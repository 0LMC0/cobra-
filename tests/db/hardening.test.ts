import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createOrg, createTestDb, type TestDb } from './harness'

describe('endurecimiento de la base (Security Advisor)', () => {
  let db: TestDb
  let ana: string

  beforeAll(async () => {
    db = await createTestDb()
    ana = await db.createUser('Ana')
    await createOrg(db, ana, 'Estudio A')
  })
  afterAll(() => db.close())

  it('las funciones tienen el search_path fijo', async () => {
    const rows = await db.admin<{ proname: string; cfg: string[] | null }>(
      `select proname, proconfig as cfg from pg_proc where pronamespace = 'public'::regnamespace
       and proname in ('set_updated_at', 'role_rank', 'protect_last_owner', 'check_allocation', 'protect_payment')`,
    )
    expect(rows).toHaveLength(5)
    for (const r of rows) expect(r.cfg ?? []).toContain('search_path=public')
  })

  it('sin iniciar sesión no se puede llamar a las funciones de la app', async () => {
    await expect(db.as(null, (q) => q(`select public.create_organization('X', '', 'ARS', 'America/Argentina/Buenos_Aires', '', '', 'monthly')`))).rejects.toThrow(/permission denied/)
    await expect(db.as(null, (q) => q(`select public.handle_new_user()`))).rejects.toThrow(/permission denied/)
  })

  it('con sesión, la app sigue funcionando (crear empresa, que dispara triggers)', async () => {
    const beto = await db.createUser('Beto') // dispara handle_new_user aunque nadie pueda llamarla a mano
    const orgId = await createOrg(db, beto, 'Estudio B')
    expect(orgId).toMatch(/^[0-9a-f-]{36}$/)
    await expect(db.as(beto, (q) => q(`select public.handle_new_user()`))).rejects.toThrow(/permission denied/)
  })
})
