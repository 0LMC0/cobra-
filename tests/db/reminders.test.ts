import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createOrg, createTestDb, type TestDb } from './harness'

describe('registro de avisos enviados', () => {
  let db: TestDb
  let ana: string
  let beto: string
  let orgA: string
  let charge: string

  beforeAll(async () => {
    db = await createTestDb()
    ana = await db.createUser('Ana')
    beto = await db.createUser('Beto')
    orgA = await createOrg(db, ana, 'Estudio A')
    await createOrg(db, beto, 'Estudio B')
    const [c] = await db.admin<{ id: string }>(`insert into public.customers (org_id, name, email) values ($1, 'Rivas', 'r@x.example') returning id`, [orgA])
    const [ch] = await db.admin<{ id: string }>(
      `insert into public.charges (org_id, customer_id, concept, amount_minor, currency, due_date) values ($1, $2, 'Cuota', 100, 'ARS', '2026-11-10') returning id`,
      [orgA, c!.id],
    )
    charge = ch!.id
    // El proceso automático escribe con service role (saltea RLS); acá, como superusuario.
    await db.admin(`insert into public.reminder_deliveries (org_id, charge_id, step_id, send_on, recipient, status) values ($1, $2, 'previo', '2026-11-05', 'r@x.example', 'sent')`, [orgA, charge])
  })
  afterAll(() => db.close())

  it('el mismo aviso no se puede registrar dos veces', async () => {
    await expect(
      db.admin(`insert into public.reminder_deliveries (org_id, charge_id, step_id, send_on, recipient) values ($1, $2, 'previo', '2026-11-05', 'r@x.example')`, [orgA, charge]),
    ).rejects.toThrow(/duplicate key|unique/)
  })

  it('el reintento con "on conflict do nothing" no duplica ni falla', async () => {
    const rows = await db.admin(
      `insert into public.reminder_deliveries (org_id, charge_id, step_id, send_on, recipient) values ($1, $2, 'previo', '2026-11-05', 'r@x.example')
       on conflict (charge_id, step_id, channel) do nothing returning id`,
      [orgA, charge],
    )
    expect(rows).toEqual([])
  })

  it('los miembros ven el historial de su empresa; un ajeno no', async () => {
    expect(await db.as(ana, (q) => q(`select step_id from public.reminder_deliveries`))).toEqual([{ step_id: 'previo' }])
    expect(await db.as(beto, (q) => q(`select step_id from public.reminder_deliveries`))).toEqual([])
  })

  it('nadie desde la app puede escribir avisos a mano', async () => {
    await expect(
      db.as(ana, (q) => q(`insert into public.reminder_deliveries (org_id, charge_id, step_id, send_on, recipient) values ($1, $2, 'falso', '2026-11-06', 'x@x.example')`, [orgA, charge])),
    ).rejects.toThrow(/row-level security/)
    expect(await db.as(ana, (q) => q(`update public.reminder_deliveries set status = 'failed' returning id`))).toEqual([])
  })

  it('la empresa guarda sus datos de envío y valida el email de respuesta', async () => {
    await db.as(ana, (q) => q(`update public.organizations set transfer_alias = 'estudio.a', reply_to_email = 'hola@a.example', reminders_enabled = true where id = $1`, [orgA]))
    await expect(db.as(ana, (q) => q(`update public.organizations set reply_to_email = 'no-es-mail' where id = $1`, [orgA]))).rejects.toThrow(/check constraint/)
  })
})
