import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createOrg, createTestDb, type TestDb } from './harness'

describe('registro de avisos por WhatsApp', () => {
  let db: TestDb
  let ana: string
  let beto: string
  let orgA: string
  let chargeA: string

  beforeAll(async () => {
    db = await createTestDb()
    ana = await db.createUser('Ana')
    beto = await db.createUser('Beto')
    orgA = await createOrg(db, ana, 'Estudio A')
    await createOrg(db, beto, 'Estudio B')
    const [c] = await db.admin<{ id: string }>(`insert into public.customers (org_id, name, phone) values ($1, 'Cliente', '11 2345-6789') returning id`, [orgA])
    const [ch] = await db.admin<{ id: string }>(`insert into public.charges (org_id, customer_id, concept, amount_minor, currency, due_date) values ($1, $2, 'Cuota', 1000, 'ARS', '2026-11-20') returning id`, [orgA, c!.id])
    chargeA = ch!.id
  })
  afterAll(() => db.close())

  it('quien cobra lo registra y lo ve; otra empresa no', async () => {
    await db.as(ana, (q) => q(`insert into public.whatsapp_sends (org_id, charge_id) values ($1, $2)`, [orgA, chargeA]))
    expect(await db.as(ana, (q) => q(`select charge_id from public.whatsapp_sends`))).toHaveLength(1)
    expect(await db.as(beto, (q) => q(`select charge_id from public.whatsapp_sends`))).toEqual([])
  })

  it('nadie lo registra en una empresa ajena, ni lo edita o borra', async () => {
    await expect(db.as(beto, (q) => q(`insert into public.whatsapp_sends (org_id, charge_id) values ($1, $2)`, [orgA, chargeA]))).rejects.toThrow()
    await expect(db.as(ana, (q) => q(`delete from public.whatsapp_sends where org_id = $1`, [orgA]))).rejects.toThrow(/permission denied/)
    await expect(db.as(null, (q) => q(`select * from public.whatsapp_sends`))).rejects.toThrow(/permission denied/)
  })
})
