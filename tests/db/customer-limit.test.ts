import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createOrg, createTestDb, type TestDb } from './harness'

describe('tope de clientes activos (lo hace cumplir la base)', () => {
  let db: TestDb
  let ana: string
  let orgFree: string
  let orgPaid: string
  const add = (org: string, name: string) =>
    db.as(ana, (q) => q<{ id: string }>(`insert into public.customers (org_id, name) values ($1, $2) returning id`, [org, name])).then((r) => r[0]!.id)

  beforeAll(async () => {
    db = await createTestDb()
    ana = await db.createUser('Ana')
    orgFree = await createOrg(db, ana, 'Gratis SA')
    orgPaid = await createOrg(db, ana, 'Starter SA')
    await db.admin(`insert into public.subscriptions (org_id, plan, status) values ($1, 'starter', 'active')`, [orgPaid])
  })
  afterAll(() => db.close())

  it('Gratis: el sexto cliente activo se rechaza aunque se escriba directo contra la API', async () => {
    const ids: string[] = []
    for (let i = 1; i <= 5; i++) ids.push(await add(orgFree, `Cliente ${i}`))
    await expect(add(orgFree, 'Cliente 6')).rejects.toThrow(/customer_limit_reached/)
    // Archivar libera lugar; reactivar pasado el tope, no.
    await db.as(ana, (q) => q(`update public.customers set status = 'archived' where id = $1`, [ids[0]]))
    const sexto = await add(orgFree, 'Cliente 6')
    expect(sexto).toBeTruthy()
    await expect(db.as(ana, (q) => q(`update public.customers set status = 'active' where id = $1`, [ids[0]]))).rejects.toThrow(/customer_limit_reached/)
  })

  it('editar un cliente activo no choca con el tope', async () => {
    const [c] = await db.as(ana, (q) => q<{ id: string }>(`select id from public.customers where org_id = $1 and status = 'active' limit 1`, [orgFree]))
    await db.as(ana, (q) => q(`update public.customers set name = 'Otro nombre' where id = $1`, [c!.id]))
  })

  it('un plan pago tiene su propio tope', async () => {
    for (let i = 1; i <= 6; i++) await add(orgPaid, `Pago ${i}`)
    const [{ n }] = await db.as(ana, (q) => q<{ n: number }>(`select count(*)::int as n from public.customers where org_id = $1`, [orgPaid]))
    expect(n).toBe(6)
  })
})
