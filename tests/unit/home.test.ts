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

describe('lo que vence en las próximas semanas', () => {
  const base = { amountMinor: 100_00, currency: 'ARS' as const, promisedFor: null, promisedOn: null }
  const names = new Map([['c1', 'Estudio Rivas'], ['c2', 'Pyme Sur']])

  it('agrupa de lunes a domingo, arrancando hoy, y deja afuera lo vencido', async () => {
    const { upcomingByWeek } = await import('@/domain/home')
    // 2026-11-18 es miércoles: esta semana va hasta el domingo 22.
    const weeks = upcomingByWeek([
      { ...base, id: 'a', customerId: 'c1', concept: 'Cuota', balanceMinor: 50_00, dueDate: '2026-11-22' },
      { ...base, id: 'b', customerId: 'c2', concept: 'Abono', balanceMinor: 80_00, dueDate: '2026-11-23' },
      { ...base, id: 'c', customerId: 'c2', concept: 'Viejo', balanceMinor: 10_00, dueDate: '2026-11-10' },
      { ...base, id: 'd', customerId: 'c1', concept: 'Lejos', balanceMinor: 10_00, dueDate: '2027-01-30' },
      { ...base, id: 'e', customerId: 'c1', concept: 'Dólares', balanceMinor: 20_00, currency: 'USD', dueDate: '2026-11-19' },
    ] as never, names, '2026-11-18')
    expect(weeks.map((w) => [w.from, w.to])).toEqual([
      ['2026-11-18', '2026-11-22'], ['2026-11-23', '2026-11-29'], ['2026-11-30', '2026-12-06'], ['2026-12-07', '2026-12-13'],
    ])
    expect(weeks[0].items.map((i) => i.concept)).toEqual(['Dólares', 'Cuota'])
    expect(weeks[0].totals).toEqual([{ currency: 'USD', minor: 20_00 }, { currency: 'ARS', minor: 50_00 }])
    expect(weeks[1]).toMatchObject({ label: 'La semana que viene', totals: [{ currency: 'ARS', minor: 80_00 }] })
    expect(weeks[1].items[0].customerName).toBe('Pyme Sur')
    expect(weeks.flatMap((w) => w.items).some((i) => i.concept === 'Viejo' || i.concept === 'Lejos')).toBe(false)
  })

  it('si prometió pagar otro día, cuenta esa fecha', async () => {
    const { upcomingByWeek } = await import('@/domain/home')
    const weeks = upcomingByWeek([
      { ...base, id: 'a', customerId: 'c1', concept: 'Cuota', balanceMinor: 50_00, dueDate: '2026-11-10', promisedFor: '2026-11-25' },
    ] as never, names, '2026-11-18')
    expect(weeks[1].items[0]).toMatchObject({ date: '2026-11-25', promised: true })
  })
})
