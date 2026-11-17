import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createOrg, createTestDb, type TestDb } from './harness'

/**
 * Fase 2: clientes, abonos, cobros, pagos e imputaciones contra las
 * migraciones reales. Lo central: aislamiento entre empresas, permisos por
 * rol y que la plata cierre siempre.
 */
describe('núcleo: clientes, cobros y pagos', () => {
  let db: TestDb
  let ana: string // dueña de A
  let beto: string // dueño de B
  let vera: string // solo lectura en A
  let orgA: string
  let orgB: string
  let clienteA: string
  let clienteB: string

  const newCustomer = (user: string, org: string, name: string, extra = '') =>
    db.as(user, (q) => q<{ id: string }>(`insert into public.customers (org_id, name${extra ? ', email' : ''}) values ($1, $2${extra ? ', $3' : ''}) returning id`, extra ? [org, name, extra] : [org, name])).then((r) => r[0]!.id)

  const newCharge = (user: string, org: string, customer: string, amount: number, currency = 'ARS', due = '2026-11-10') =>
    db.as(user, (q) =>
      q<{ id: string }>(
        `insert into public.charges (org_id, customer_id, concept, amount_minor, currency, due_date) values ($1, $2, 'Cuota de noviembre', $3, $4, $5) returning id`,
        [org, customer, amount, currency, due],
      ),
    ).then((r) => r[0]!.id)

  const recordPayment = (user: string, org: string, customer: string, amount: number, allocations: { charge_id: string; amount_minor: number }[], key: string | null = null, currency = 'ARS') =>
    db.as(user, (q) =>
      q<{ id: string }>(
        `select public.record_payment($1, $2, $3, $4, '2026-11-12', 'transfer', 'Comprobante 123', $5::jsonb, $6) as id`,
        [org, customer, amount, currency, JSON.stringify(allocations), key],
      ),
    ).then((r) => r[0]!.id)

  const balance = (chargeId: string) =>
    db.admin<{ paid_minor: string | number; balance_minor: string | number }>(`select paid_minor, balance_minor from public.charge_balances where charge_id = $1`, [chargeId])
      .then((r) => ({ paid: Number(r[0]!.paid_minor), balance: Number(r[0]!.balance_minor) }))

  beforeAll(async () => {
    db = await createTestDb()
    ana = await db.createUser('Ana')
    beto = await db.createUser('Beto')
    vera = await db.createUser('Vera')
    orgA = await createOrg(db, ana, 'Estudio A')
    orgB = await createOrg(db, beto, 'Estudio B')
    await db.admin(`insert into public.organization_members (org_id, user_id, role) values ($1, $2, 'viewer')`, [orgA, vera])
    clienteA = await newCustomer(ana, orgA, 'Estudio Rivas', 'marina@rivas.example')
    clienteB = await newCustomer(beto, orgB, 'Clínica Norte')
  })
  afterAll(() => db.close())

  describe('clientes', () => {
    it('cada empresa ve sólo sus clientes', async () => {
      expect(await db.as(ana, (q) => q(`select name from public.customers`))).toEqual([{ name: 'Estudio Rivas' }])
      expect(await db.as(beto, (q) => q(`select name from public.customers`))).toEqual([{ name: 'Clínica Norte' }])
    })

    it('no se puede crear un cliente en otra empresa', async () => {
      await expect(newCustomer(beto, orgA, 'Intruso')).rejects.toThrow(/row-level security/)
    })

    it('solo lectura no crea ni edita clientes', async () => {
      await expect(newCustomer(vera, orgA, 'Otro')).rejects.toThrow(/row-level security/)
      expect(await db.as(vera, (q) => q(`update public.customers set name = 'X' where id = $1 returning id`, [clienteA]))).toEqual([])
      expect(await db.as(vera, (q) => q(`select name from public.customers`))).toEqual([{ name: 'Estudio Rivas' }])
    })

    it('no permite dos clientes activos con el mismo email en la empresa', async () => {
      await expect(newCustomer(ana, orgA, 'Duplicado', 'MARINA@rivas.example')).rejects.toThrow(/customers_active_email_uniq|duplicate key/)
    })

    it('valida el email y el número de WhatsApp', async () => {
      await expect(newCustomer(ana, orgA, 'Mal email', 'esto-no-es-un-mail')).rejects.toThrow(/check constraint/)
      await expect(
        db.as(ana, (q) => q(`insert into public.customers (org_id, name, whatsapp_number) values ($1, 'Mal número', '11 2345-6789')`, [orgA])),
      ).rejects.toThrow(/check constraint/)
    })
  })

  describe('cobros', () => {
    it('no se puede crear un cobro de un cliente de otra empresa', async () => {
      // Beto intenta colgar un cobro de su empresa en un cliente de A.
      await expect(newCharge(beto, orgB, clienteA, 10_000)).rejects.toThrow(/foreign key|violates/)
      // Y Ana no puede usar su empresa con un cliente de B.
      await expect(newCharge(ana, orgA, clienteB, 10_000)).rejects.toThrow(/foreign key|violates/)
    })

    it('rechaza importes en cero o negativos', async () => {
      await expect(newCharge(ana, orgA, clienteA, 0)).rejects.toThrow(/check constraint/)
      await expect(newCharge(ana, orgA, clienteA, -500)).rejects.toThrow(/check constraint/)
    })

    it('un abono no genera dos veces el mismo período', async () => {
      const [{ id: abono }] = await db.as(ana, (q) =>
        q<{ id: string }>(
          `insert into public.agreements (org_id, customer_id, name, amount_minor, currency, frequency, start_date) values ($1, $2, 'Abono mensual', 15000000, 'ARS', 'monthly', '2026-11-01') returning id`,
          [orgA, clienteA],
        ),
      ) as [{ id: string }]
      const insertPeriod = () =>
        db.as(ana, (q) =>
          q(`insert into public.charges (org_id, customer_id, agreement_id, concept, amount_minor, currency, due_date, period_start) values ($1, $2, $3, 'Noviembre', 15000000, 'ARS', '2026-11-10', '2026-11-01')`, [orgA, clienteA, abono]),
        )
      await insertPeriod()
      await expect(insertPeriod()).rejects.toThrow(/duplicate key|unique/)
    })

    it('una promesa de pago necesita la fecha en que se anotó', async () => {
      const id = await newCharge(ana, orgA, clienteA, 5_000)
      await expect(db.as(ana, (q) => q(`update public.charges set promised_for = '2026-11-20' where id = $1`, [id]))).rejects.toThrow(/check constraint/)
      await db.as(ana, (q) => q(`update public.charges set promised_for = '2026-11-20', promised_on = '2026-11-11' where id = $1`, [id]))
    })
  })

  describe('pagos', () => {
    it('un pago total deja el cobro en cero', async () => {
      const charge = await newCharge(ana, orgA, clienteA, 15_000_000)
      await recordPayment(ana, orgA, clienteA, 15_000_000, [{ charge_id: charge, amount_minor: 15_000_000 }])
      expect(await balance(charge)).toEqual({ paid: 15_000_000, balance: 0 })
    })

    it('un pago parcial deja el saldo pendiente', async () => {
      const charge = await newCharge(ana, orgA, clienteA, 9_500_000)
      await recordPayment(ana, orgA, clienteA, 5_000_000, [{ charge_id: charge, amount_minor: 5_000_000 }])
      expect(await balance(charge)).toEqual({ paid: 5_000_000, balance: 4_500_000 })
    })

    it('un pago puede cubrir varios cobros', async () => {
      const c1 = await newCharge(ana, orgA, clienteA, 1_000_000)
      const c2 = await newCharge(ana, orgA, clienteA, 2_000_000)
      await recordPayment(ana, orgA, clienteA, 3_000_000, [{ charge_id: c1, amount_minor: 1_000_000 }, { charge_id: c2, amount_minor: 2_000_000 }])
      expect((await balance(c1)).balance).toBe(0)
      expect((await balance(c2)).balance).toBe(0)
    })

    it('no deja imputar más de lo que se pagó', async () => {
      const charge = await newCharge(ana, orgA, clienteA, 10_000_000)
      await expect(recordPayment(ana, orgA, clienteA, 1_000_000, [{ charge_id: charge, amount_minor: 2_000_000 }])).rejects.toThrow(/allocation_exceeds_payment/)
      expect((await balance(charge)).paid).toBe(0) // la transacción se revirtió entera
    })

    it('no deja cobrar dos veces lo mismo', async () => {
      const charge = await newCharge(ana, orgA, clienteA, 1_000_000)
      await recordPayment(ana, orgA, clienteA, 1_000_000, [{ charge_id: charge, amount_minor: 1_000_000 }])
      await expect(recordPayment(ana, orgA, clienteA, 500_000, [{ charge_id: charge, amount_minor: 500_000 }])).rejects.toThrow(/allocation_exceeds_charge/)
    })

    it('nunca mezcla monedas', async () => {
      const charge = await newCharge(ana, orgA, clienteA, 10_000, 'USD')
      await expect(recordPayment(ana, orgA, clienteA, 10_000, [{ charge_id: charge, amount_minor: 10_000 }], null, 'ARS')).rejects.toThrow(/currency_mismatch/)
    })

    it('no imputa el pago de un cliente al cobro de otro', async () => {
      const otro = await newCustomer(ana, orgA, 'Panadería Sol')
      const charge = await newCharge(ana, orgA, otro, 10_000)
      await expect(recordPayment(ana, orgA, clienteA, 10_000, [{ charge_id: charge, amount_minor: 10_000 }])).rejects.toThrow(/customer_mismatch/)
    })

    it('es idempotente: repetir la misma clave no duplica el pago', async () => {
      const charge = await newCharge(ana, orgA, clienteA, 2_000_000)
      const first = await recordPayment(ana, orgA, clienteA, 2_000_000, [{ charge_id: charge, amount_minor: 2_000_000 }], 'doble-clic-1')
      const second = await recordPayment(ana, orgA, clienteA, 2_000_000, [{ charge_id: charge, amount_minor: 2_000_000 }], 'doble-clic-1')
      expect(second).toBe(first)
      expect((await balance(charge)).paid).toBe(2_000_000)
    })

    it('anular un pago devuelve el saldo y exige un motivo', async () => {
      const charge = await newCharge(ana, orgA, clienteA, 3_000_000)
      const pay = await recordPayment(ana, orgA, clienteA, 3_000_000, [{ charge_id: charge, amount_minor: 3_000_000 }])
      await expect(db.as(ana, (q) => q(`update public.payments set status = 'voided' where id = $1`, [pay]))).rejects.toThrow(/check constraint/)
      await db.as(ana, (q) => q(`update public.payments set status = 'voided', voided_reason = 'Lo cargué dos veces' where id = $1`, [pay]))
      expect(await balance(charge)).toEqual({ paid: 0, balance: 3_000_000 })
    })

    it('un pago no se puede editar ni reactivar', async () => {
      const charge = await newCharge(ana, orgA, clienteA, 1_000)
      const pay = await recordPayment(ana, orgA, clienteA, 1_000, [{ charge_id: charge, amount_minor: 1_000 }])
      await expect(db.as(ana, (q) => q(`update public.payments set amount_minor = 999999 where id = $1`, [pay]))).rejects.toThrow(/payment_immutable/)
      await db.as(ana, (q) => q(`update public.payments set status = 'voided', voided_reason = 'Error' where id = $1`, [pay]))
      await expect(db.as(ana, (q) => q(`update public.payments set status = 'confirmed' where id = $1`, [pay]))).rejects.toThrow(/payment_voided/)
    })

    it('registrar un pago queda en la auditoría', async () => {
      const rows = await db.admin<{ n: string | number }>(`select count(*) as n from public.audit_logs where org_id = $1 and action = 'payment.recorded'`, [orgA])
      expect(Number(rows[0]!.n)).toBeGreaterThan(0)
    })

    it('ni un ajeno ni solo lectura pueden registrar pagos', async () => {
      const charge = await newCharge(ana, orgA, clienteA, 1_000)
      await expect(recordPayment(beto, orgA, clienteA, 1_000, [{ charge_id: charge, amount_minor: 1_000 }])).rejects.toThrow(/forbidden/)
      await expect(recordPayment(vera, orgA, clienteA, 1_000, [{ charge_id: charge, amount_minor: 1_000 }])).rejects.toThrow(/forbidden/)
    })

    it('un ajeno no ve pagos, cobros ni saldos de otra empresa', async () => {
      expect(await db.as(beto, (q) => q(`select id from public.payments where org_id = $1`, [orgA]))).toEqual([])
      expect(await db.as(beto, (q) => q(`select id from public.charges where org_id = $1`, [orgA]))).toEqual([])
      expect(await db.as(beto, (q) => q(`select charge_id from public.charge_balances where org_id = $1`, [orgA]))).toEqual([])
      expect(await db.as(beto, (q) => q(`select payment_id from public.payment_allocations where org_id = $1`, [orgA]))).toEqual([])
    })

    it('solo lectura ve los saldos de su empresa', async () => {
      const rows = await db.as(vera, (q) => q(`select charge_id from public.charge_balances`))
      expect(rows.length).toBeGreaterThan(0)
    })
  })
})
