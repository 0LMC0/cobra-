import { describe, expect, it } from 'vitest'
import { chargeSchema, customerSchema, paymentSchema } from '@/domain/forms'

const UUID = '6f1d1b4e-8c3a-4f2e-9b7d-2a1c3e4f5a6b'
const errors = (r: { success: boolean; error?: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } } }) =>
  r.success ? {} : r.error!.flatten().fieldErrors

describe('formulario de cliente', () => {
  it('convierte el celular al formato de WhatsApp', () => {
    const r = customerSchema.safeParse({ name: 'Estudio Rivas', phone: '11 15 2345-6789', whatsappOk: 'on' })
    expect(r.success && r.data.whatsappNumber).toBe('5491123456789')
    expect(r.success && r.data.whatsappOk).toBe(true)
  })

  it('pide al menos un email o un celular', () => {
    expect(errors(customerSchema.safeParse({ name: 'Sin datos' })).email?.[0]).toMatch(/al menos un email o un celular/)
    expect(customerSchema.safeParse({ name: 'Con mail', email: 'Hola@Rivas.example' }).success).toBe(true)
  })

  it('guarda el email en minúsculas y los vacíos como null', () => {
    const r = customerSchema.safeParse({ name: '  Estudio Rivas ', email: 'Hola@Rivas.EXAMPLE', contactName: '', notes: '' })
    expect(r.success && r.data).toMatchObject({ name: 'Estudio Rivas', email: 'hola@rivas.example', contactName: null, notes: null, whatsappNumber: null, whatsappOk: false })
  })

  it('avisa si el celular no se reconoce', () => {
    expect(errors(customerSchema.safeParse({ name: 'X', phone: '1234' })).phone?.[0]).toMatch(/No reconocemos ese celular/)
  })

  it('sin celular, el permiso de WhatsApp queda en falso', () => {
    const r = customerSchema.safeParse({ name: 'X', email: 'x@x.example', whatsappOk: 'on' })
    expect(r.success && r.data.whatsappOk).toBe(false)
  })

  it('valida el nombre y el email', () => {
    expect(errors(customerSchema.safeParse({ name: '  ', email: 'x@x.example' })).name?.[0]).toMatch(/nombre/)
    expect(errors(customerSchema.safeParse({ name: 'X', email: 'no-es-mail' })).email?.[0]).toMatch(/no parece válido/)
  })
})

describe('formulario de cobro', () => {
  const base = { customerId: UUID, concept: 'Cuota de noviembre', currency: 'ARS', dueDate: '2026-11-10' }

  it('entiende el importe como lo escribe la gente', () => {
    const r = chargeSchema.safeParse({ ...base, amount: '150.000,50' })
    expect(r.success && r.data.amountMinor).toBe(15_000_050)
    expect(r.success && r.data.repeatMonthly).toBe(false)
  })

  it('rechaza importes inválidos o en cero', () => {
    expect(errors(chargeSchema.safeParse({ ...base, amount: 'mil' })).amount?.[0]).toMatch(/no es válido/)
    expect(errors(chargeSchema.safeParse({ ...base, amount: '0' })).amount?.[0]).toMatch(/no es válido/)
  })

  it('pide fecha, concepto y moneda válidos', () => {
    const e = errors(chargeSchema.safeParse({ ...base, amount: '100', dueDate: '10/11/2026', concept: '', currency: 'EUR' }))
    expect(e.dueDate?.[0]).toMatch(/vencimiento/)
    expect(e.concept?.[0]).toMatch(/qué le cobrás/)
    expect(e.currency?.[0]).toMatch(/moneda/)
  })

  it('marca si se repite todos los meses', () => {
    const r = chargeSchema.safeParse({ ...base, amount: '150000', repeatMonthly: 'on' })
    expect(r.success && r.data.repeatMonthly).toBe(true)
  })
})

describe('formulario de pago', () => {
  const base = { chargeId: UUID, currency: 'ARS', balanceMinor: '15000000', paidOn: '2026-11-12', idempotencyKey: 'clave-123456' }

  it('pago total', () => {
    const r = paymentSchema.safeParse({ ...base, amount: '150.000' })
    expect(r.success && r.data).toMatchObject({ amountMinor: 15_000_000, partial: false, method: 'transfer' })
  })

  it('pago parcial', () => {
    const r = paymentSchema.safeParse({ ...base, amount: '50.000', method: 'cash' })
    expect(r.success && r.data).toMatchObject({ amountMinor: 5_000_000, partial: true, method: 'cash' })
  })

  it('no deja pagar más de lo que debe', () => {
    expect(errors(paymentSchema.safeParse({ ...base, amount: '200.000' })).amount?.[0]).toMatch(/más de lo que debe/)
  })

  it('rechaza un método desconocido', () => {
    expect(paymentSchema.safeParse({ ...base, amount: '1', method: 'bitcoin' }).success).toBe(false)
  })
})
