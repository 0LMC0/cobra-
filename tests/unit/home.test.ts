import { describe, expect, it } from 'vitest'
import { homeTotals, remindersForToday, type HomeCharge, type HomeCustomer } from '@/domain/home'

const today = '2026-11-17' // martes

const charge = (over: Partial<HomeCharge>): HomeCharge => ({
  id: 'c1', customerId: 'k1', concept: 'Cuota', amountMinor: 100_00, balanceMinor: 100_00, currency: 'ARS',
  dueDate: today, promisedFor: null, promisedOn: null, ...over,
})
const customer: HomeCustomer = { id: 'k1', name: 'Estudio Rivas', contactName: 'Marina', email: 'm@x.example', phone: '11 0000-0001', whatsappOk: true, optOut: false, paused: false }

describe('homeTotals', () => {
  it('suma pendiente y atrasado en la moneda principal, sin mezclar', () => {
    const t = homeTotals({
      charges: [
        charge({ id: 'a', balanceMinor: 50_00, dueDate: '2026-11-10' }),
        charge({ id: 'b', balanceMinor: 30_00, dueDate: '2026-11-20' }),
        charge({ id: 'c', balanceMinor: 99_00, currency: 'USD', dueDate: '2026-11-01' }),
        charge({ id: 'd', balanceMinor: 0, dueDate: '2026-11-01' }),
      ],
      payments: [
        { amountMinor: 10_00, currency: 'ARS', paidOn: '2026-11-02' },
        { amountMinor: 7_00, currency: 'ARS', paidOn: '2026-10-31' },
        { amountMinor: 5_00, currency: 'USD', paidOn: '2026-11-03' },
      ],
      currency: 'ARS', today, hasAnyCharge: true,
    })
    expect(t).toEqual({ pendingMinor: 80_00, overdueMinor: 50_00, collectedMinor: 10_00, hasData: true })
  })
})

describe('remindersForToday', () => {
  const base = { customers: [customer], today, remindersEnabled: true, sent: new Set<string>() }

  it('muestra el cobro que vence hoy y si el email ya salió', () => {
    const [r] = remindersForToday({ ...base, charges: [charge({})], sent: new Set(['c1:vence']) })
    expect(r).toMatchObject({ moment: 'due', emailStatus: 'sent', phone: '11 0000-0001' })
  })

  it('distingue avisos apagados y clientes sin email', () => {
    expect(remindersForToday({ ...base, charges: [charge({})], remindersEnabled: false })[0]?.emailStatus).toBe('off')
    expect(remindersForToday({ ...base, charges: [charge({})], customers: [{ ...customer, email: null }] })[0]?.emailStatus).toBe('none')
  })

  it('no muestra pagados, pausados ni días sin aviso; ordena por urgencia', () => {
    const list = remindersForToday({
      ...base,
      charges: [
        charge({ id: 'hoy' }),
        charge({ id: 'atraso', dueDate: '2026-11-14' }), // vence +3 días = hoy
        charge({ id: 'pagado', balanceMinor: 0 }),
        charge({ id: 'nada', dueDate: '2026-11-30' }),
      ],
    })
    expect(list.map((r) => r.id)).toEqual(['atraso', 'hoy'])
    expect(remindersForToday({ ...base, charges: [charge({})], customers: [{ ...customer, paused: true }] })).toEqual([])
  })

  it('sin permiso de WhatsApp no ofrece el botón', () => {
    expect(remindersForToday({ ...base, charges: [charge({})], customers: [{ ...customer, whatsappOk: false }] })[0]?.phone).toBeNull()
  })
})

describe('cobrado por mes (gráfico del inicio)', () => {
  it('suma por mes sólo la moneda principal y completa los meses vacíos', async () => {
    const { collectedByMonth } = await import('@/domain/home')
    const bars = collectedByMonth([
      { amountMinor: 10_000, currency: 'ARS', paidOn: '2026-11-03' },
      { amountMinor: 5_000, currency: 'ARS', paidOn: '2026-11-20' },
      { amountMinor: 7_000, currency: 'USD', paidOn: '2026-11-04' },
      { amountMinor: 2_000, currency: 'ARS', paidOn: '2026-09-30' },
      { amountMinor: 9_999, currency: 'ARS', paidOn: '2026-04-30' },
    ], 'ARS', '2026-11-18')
    expect(bars.map((b) => b.month)).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'])
    expect(bars.map((b) => b.collectedMinor)).toEqual([0, 0, 0, 2_000, 0, 15_000])
    expect(bars.at(-1)?.current).toBe(true)
    expect(bars[0].label).toBe('jun')
  })

  it('cruza el cambio de año', async () => {
    const { collectedByMonth } = await import('@/domain/home')
    expect(collectedByMonth([], 'ARS', '2027-02-01', 3).map((b) => b.month)).toEqual(['2026-12', '2027-01', '2027-02'])
  })
})
