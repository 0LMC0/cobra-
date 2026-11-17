import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite, type Transaction } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

/**
 * Base Postgres embebida (PGlite) para probar las migraciones tal cual están
 * en supabase/migrations: tablas, RLS, funciones y triggers.
 *
 * No reemplaza la prueba contra el proyecto real de Supabase: no hay Auth,
 * PostgREST ni Storage. Sí verifica lo más delicado, que es SQL puro: que una
 * empresa no vea datos de otra y que cada rol haga sólo lo que le toca.
 */
const MIGRATIONS_DIR = fileURLToPath(new URL('../../supabase/migrations', import.meta.url))

/** Lo mínimo de Supabase que las migraciones dan por hecho, con sus mismos privilegios por defecto. */
const SUPABASE_STUB = `
  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    raw_user_meta_data jsonb not null default '{}'
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public, auth to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`

export type Tx = Transaction
export type Row = Record<string, unknown>

export type TestDb = {
  /** Consulta como superusuario (saltea RLS): sólo para preparar datos y verificar. */
  admin<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T[]>
  /** Crea un usuario en auth.users (dispara el trigger que crea su perfil). */
  createUser(fullName?: string): Promise<string>
  /**
   * Ejecuta como ese usuario, con el rol `authenticated` y su id en el JWT,
   * igual que una request de la app. Con null actúa como `anon`.
   * Si algo falla, la transacción se revierte.
   */
  as<T>(userId: string | null, fn: (q: Query) => Promise<T>): Promise<T>
  close(): Promise<void>
}

export type Query = <T extends Row = Row>(sql: string, params?: unknown[]) => Promise<T[]>

export async function createTestDb(): Promise<TestDb> {
  const pg = await PGlite.create({ extensions: { citext, pgcrypto } })
  await pg.exec(SUPABASE_STUB)
  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()) {
    try {
      await pg.exec(readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))
    } catch (error) {
      throw new Error(`La migración ${file} falló: ${(error as Error).message}`)
    }
  }

  let userCount = 0
  return {
    async admin<T extends Row = Row>(sql: string, params: unknown[] = []) {
      return (await pg.query<T>(sql, params)).rows
    },
    async createUser(fullName) {
      userCount += 1
      const name = fullName ?? `Usuario ${userCount}`
      const { rows } = await pg.query<{ id: string }>(
        `insert into auth.users (email, raw_user_meta_data) values ($1, jsonb_build_object('full_name', $2::text)) returning id`,
        [`usuario${userCount}@prueba.test`, name],
      )
      return rows[0]!.id
    },
    async as<T>(userId: string | null, fn: (q: Query) => Promise<T>) {
      return (await pg.transaction(async (tx: Tx) => {
        await tx.exec(`set local role ${userId ? 'authenticated' : 'anon'}`)
        await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId ?? ''])
        const q: Query = async <R extends Row = Row>(sql: string, params: unknown[] = []) => (await tx.query<R>(sql, params)).rows
        return fn(q)
      })) as T
    },
    close: () => pg.close(),
  }
}

/** Crea una empresa como ese usuario, por el mismo RPC que usa la app. */
export async function createOrg(db: TestDb, userId: string, name = 'Estudio de prueba'): Promise<string> {
  const rows = await db.as(userId, (q) =>
    q<{ id: string }>(
      `select public.create_organization($1, 'Consultoría', 'ARS', 'America/Argentina/Buenos_Aires', '', '', 'monthly') as id`,
      [name],
    ),
  )
  return rows[0]!.id
}
