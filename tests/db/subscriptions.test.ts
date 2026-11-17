import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createOrg, createTestDb, type TestDb } from './harness'

describe('plan de la empresa (subscriptions)', () => {
  let db: TestDb
  let ana: string
  let beto: string
  let orgA: string

  beforeAll(async () => {
    db = await createTestDb()
    ana = await db.createUser('Ana')
    beto = await db.createUser('Beto')
    orgA = await createOrg(db, ana, 'Estudio A')
    await createOrg(db, beto, 'Estudio B')
    // Lo escribe el servidor (webhook de Mercado Pago), como superusuario acá.
    await db.admin(`insert into public.subscriptions (org_id, plan, status, provider) values ($1, 'growth', 'active', 'mercadopago')`, [orgA])
  })
  afterAll(() => db.close())

  it('la empresa ve su plan; otra empresa no', async () => {
    expect(await db.as(ana, (q) => q(`select plan from public.subscriptions`))).toEqual([{ plan: 'growth' }])
    expect(await db.as(beto, (q) => q(`select plan from public.subscriptions`))).toEqual([])
  })

  it('nadie puede cambiarse el plan desde la app', async () => {
    await expect(db.as(ana, (q) => q(`update public.subscriptions set plan = 'business' where org_id = $1`, [orgA]))).rejects.toThrow(/permission denied/)
    await expect(db.as(beto, (q) => q(`insert into public.subscriptions (org_id, plan) values ((select org_id from public.organization_members where user_id = $1), 'business')`, [beto]))).rejects.toThrow(/permission denied/)
    await expect(db.as(ana, (q) => q(`delete from public.subscriptions where org_id = $1`, [orgA]))).rejects.toThrow(/permission denied/)
  })

  it('sólo acepta planes y estados conocidos', async () => {
    await expect(db.admin(`update public.subscriptions set plan = 'oro' where org_id = $1`, [orgA])).rejects.toThrow(/check constraint/)
  })
})
