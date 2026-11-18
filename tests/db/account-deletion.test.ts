import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createOrg, createTestDb, type TestDb } from './harness'

/**
 * "Borrar mi cuenta" (src/server/actions/account.ts): primero se borran las empresas donde la
 * persona es la única dueña y después su usuario. Las protecciones de la base (último dueño,
 * pagos inmutables) no tienen que frenarlo, y no tiene que quedar nada suelto.
 */
describe('borrar la cuenta', () => {
  let db: TestDb
  let ana: string
  let beto: string
  let orgAna: string
  let orgCompartida: string

  beforeAll(async () => {
    db = await createTestDb()
    ana = await db.createUser('Ana')
    beto = await db.createUser('Beto')
    orgAna = await createOrg(db, ana, 'Estudio Ana')
    orgCompartida = await createOrg(db, beto, 'Estudio Compartido')
    await db.admin(`insert into public.organization_members (org_id, user_id, role) values ($1, $2, 'owner')`, [orgCompartida, ana])

    // Datos completos en la empresa de Ana: cliente, cobro y pago confirmado.
    const [c] = await db.admin<{ id: string }>(`insert into public.customers (org_id, name, email) values ($1, 'Cliente', 'c@x.example') returning id`, [orgAna])
    const [ch] = await db.admin<{ id: string }>(`insert into public.charges (org_id, customer_id, concept, amount_minor, currency, due_date) values ($1, $2, 'Cuota', 10000, 'ARS', '2026-11-10') returning id`, [orgAna, c!.id])
    await db.as(ana, (q) => q(`select public.record_payment($1, $2, 10000, 'ARS', '2026-11-12', 'transfer', '', $3::jsonb, null)`, [orgAna, c!.id, JSON.stringify([{ charge_id: ch!.id, amount_minor: 10000 }])]))
  })
  afterAll(() => db.close())

  it('borra la empresa donde es la única dueña, con todo adentro', async () => {
    await db.admin(`delete from public.organizations where id = $1`, [orgAna])
    for (const t of ['customers', 'charges', 'payments', 'organization_members']) {
      expect(await db.admin(`select 1 from public.${t} where org_id = $1`, [orgAna])).toEqual([])
    }
  })

  it('después borra el usuario y la empresa compartida sigue con su otra dueña', async () => {
    await db.admin(`delete from auth.users where id = $1`, [ana])
    expect(await db.admin(`select 1 from public.profiles where id = $1`, [ana])).toEqual([])
    const members = await db.admin<{ user_id: string }>(`select user_id from public.organization_members where org_id = $1`, [orgCompartida])
    expect(members.map((m) => m.user_id)).toEqual([beto])
  })
})
