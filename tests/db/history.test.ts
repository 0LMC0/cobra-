import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createOrg, createTestDb, type TestDb } from './harness'

/** Historial: la base registra sola los cambios de clientes y cobros. */
describe('historial de clientes y cobros', () => {
  let db: TestDb
  let ana: string // dueña de A
  let vera: string // sólo lectura en A
  let beto: string // dueño de B
  let orgA: string
  let cliente: string
  let cobro: string

  type Log = { action: string; before: Record<string, unknown> | null; after: Record<string, unknown> | null; actor_id: string | null }
  const logsOf = (entity: string) =>
    db.admin<Log>(`select action, before, after, actor_id from public.audit_logs where entity_id = $1 order by id`, [entity])

  beforeAll(async () => {
    db = await createTestDb()
    ana = await db.createUser('Ana')
    vera = await db.createUser('Vera')
    beto = await db.createUser('Beto')
    orgA = await createOrg(db, ana, 'Estudio A')
    await createOrg(db, beto, 'Estudio B')
    await db.admin(`insert into public.organization_members (org_id, user_id, role) values ($1, $2, 'viewer')`, [orgA, vera])
    const [c] = await db.as(ana, (q) => q<{ id: string }>(`insert into public.customers (org_id, name, email) values ($1, 'Estudio Rivas', 'marina@rivas.example') returning id`, [orgA]))
    cliente = c!.id
    const [ch] = await db.as(ana, (q) =>
      q<{ id: string }>(`insert into public.charges (org_id, customer_id, concept, amount_minor, currency, due_date) values ($1, $2, 'Cuota', 100, 'ARS', '2026-11-10') returning id`, [orgA, cliente]),
    )
    cobro = ch!.id
  })
  afterAll(() => db.close())

  it('editar un cliente guarda qué cambió y quién lo cambió', async () => {
    await db.as(ana, (q) => q(`update public.customers set name = 'Estudio Rivas SRL', phone = '11 0000-0001' where id = $1`, [cliente]))
    const [log] = await logsOf(cliente)
    expect(log).toMatchObject({
      action: 'customer.updated',
      actor_id: ana,
      before: { name: 'Estudio Rivas', phone: null },
      after: { name: 'Estudio Rivas SRL', phone: '11 0000-0001' },
    })
  })

  it('guardar sin cambios no deja rastro', async () => {
    const before = (await logsOf(cliente)).length
    await db.as(ana, (q) => q(`update public.customers set name = name where id = $1`, [cliente]))
    expect(await logsOf(cliente)).toHaveLength(before)
  })

  it('archivar, reactivar, pausar y la baja quedan registrados', async () => {
    await db.as(ana, (q) => q(`update public.customers set status = 'archived' where id = $1`, [cliente]))
    await db.as(ana, (q) => q(`update public.customers set status = 'active' where id = $1`, [cliente]))
    await db.as(ana, (q) => q(`update public.customers set reminders_paused = true where id = $1`, [cliente]))
    // La baja llega desde el link del email, sin sesión: actor nulo.
    await db.admin(`update public.customers set contact_opt_out = true where id = $1`, [cliente])
    const actions = (await logsOf(cliente)).map((l) => l.action)
    expect(actions.slice(-4)).toEqual(['customer.archived', 'customer.restored', 'customer.paused', 'customer.opted_out'])
    expect((await logsOf(cliente)).at(-1)!.actor_id).toBeNull()
  })

  it('las promesas y los cambios de un cobro quedan registrados', async () => {
    await db.as(ana, (q) => q(`update public.charges set promised_for = '2026-11-20', promised_on = '2026-11-17' where id = $1`, [cobro]))
    await db.as(ana, (q) => q(`update public.charges set promised_for = null, promised_on = null where id = $1`, [cobro]))
    await db.as(ana, (q) => q(`update public.charges set due_date = '2026-11-15' where id = $1`, [cobro]))
    const logs = await logsOf(cobro)
    expect(logs.map((l) => l.action)).toEqual(['charge.promise_set', 'charge.promise_cleared', 'charge.updated'])
    expect(logs[0]!.after).toEqual({ promised_for: '2026-11-20' })
    expect(logs[2]!.before).toMatchObject({ due_date: '2026-11-10' })
  })

  it('el equipo ve el historial de sus clientes; otra empresa no', async () => {
    const asVera = await db.as(vera, (q) => q<{ action: string }>(`select action from public.audit_logs where entity_id = $1`, [cliente]))
    expect(asVera.length).toBeGreaterThan(0)
    expect(await db.as(beto, (q) => q(`select action from public.audit_logs where entity_id = $1`, [cliente]))).toEqual([])
  })

  it('la auditoría de la empresa sigue siendo sólo de administración', async () => {
    expect(await db.as(vera, (q) => q(`select action from public.audit_logs where entity_type = 'organization'`))).toEqual([])
    expect((await db.as(ana, (q) => q(`select action from public.audit_logs where entity_type = 'organization'`))).length).toBe(1)
  })

  it('nadie puede borrar ni cambiar el historial, ni llamar a los triggers a mano', async () => {
    expect(await db.as(ana, (q) => q(`update public.audit_logs set action = 'x' where entity_id = $1 returning id`, [cliente]))).toEqual([])
    expect(await db.as(ana, (q) => q(`delete from public.audit_logs where entity_id = $1 returning id`, [cliente]))).toEqual([])
    await expect(db.as(ana, (q) => q(`select public.audit_customer_change()`))).rejects.toThrow()
  })
})
