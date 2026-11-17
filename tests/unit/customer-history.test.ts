import { describe, expect, it } from 'vitest'
import { filterCustomers, normalizeSearch, parseCustomerView } from '@/domain/customer-filter'
import { buildTimeline, formatEventTime, type TimelineInput } from '@/domain/timeline'

const c = (over: Partial<Parameters<typeof filterCustomers>[0][number]>) => ({
  name: 'Estudio Rivas', contactName: null, email: null, phone: null, taxId: null, owed: [] as unknown[], overdueCount: 0, ...over,
})

describe('búsqueda de clientes', () => {
  const list = [
    c({ name: 'Clínica Núñez', email: 'admin@nunez.example', phone: '11 2345-6789', owed: [1], overdueCount: 1 }),
    c({ name: 'Estudio Rivas', contactName: 'Marina Pérez', taxId: '30-71234567-9', owed: [1] }),
    c({ name: 'Panadería Sol' }),
  ]

  it('ignora acentos y mayúsculas, y busca en contacto y email', () => {
    expect(normalizeSearch('  Clínica   NÚÑEZ ')).toBe('clinica nunez')
    expect(filterCustomers(list, { q: 'clinica nunez', view: 'todos' }).map((x) => x.name)).toEqual(['Clínica Núñez'])
    expect(filterCustomers(list, { q: 'marina', view: 'todos' }).map((x) => x.name)).toEqual(['Estudio Rivas'])
    expect(filterCustomers(list, { q: 'nunez.example', view: 'todos' })).toHaveLength(1)
  })

  it('encuentra por celular o CUIT con o sin guiones', () => {
    expect(filterCustomers(list, { q: '2345 6789', view: 'todos' }).map((x) => x.name)).toEqual(['Clínica Núñez'])
    expect(filterCustomers(list, { q: '71234567', view: 'todos' }).map((x) => x.name)).toEqual(['Estudio Rivas'])
  })

  it('filtra por los que deben y los atrasados', () => {
    expect(filterCustomers(list, { view: 'deben' })).toHaveLength(2)
    expect(filterCustomers(list, { view: 'atrasados' }).map((x) => x.name)).toEqual(['Clínica Núñez'])
    expect(filterCustomers(list, { q: 'sol', view: 'deben' })).toEqual([])
  })

  it('una vista desconocida vuelve a "todos"', () => {
    expect(parseCustomerView('cualquiera')).toBe('todos')
    expect(parseCustomerView('archivados')).toBe('archivados')
  })
})

describe('historial del cliente', () => {
  const input: TimelineInput = {
    customer: { id: 'k1', createdAt: '2026-11-01T12:00:00Z' },
    charges: [
      { id: 'c1', concept: 'Cuota de noviembre', amountMinor: 15_000_000, currency: 'ARS', dueDate: '2026-11-10', createdAt: '2026-11-01T12:05:00Z', generated: false },
      { id: 'c2', concept: 'Cuota de diciembre', amountMinor: 15_000_000, currency: 'ARS', dueDate: '2026-12-10', createdAt: '2026-12-03T12:00:00Z', generated: true },
    ],
    payments: [
      { id: 'p1', amountMinor: 5_000_000, currency: 'ARS', paidOn: '2026-11-12', method: 'transfer', status: 'confirmed', voidedReason: null, createdAt: '2026-11-12T15:00:00Z' },
      { id: 'p2', amountMinor: 100, currency: 'ARS', paidOn: '2026-11-12', method: 'cash', status: 'voided', voidedReason: 'Lo cargué dos veces', createdAt: '2026-11-12T15:01:00Z' },
    ],
    deliveries: [
      { id: 'd1', chargeId: 'c1', stepId: 'vence', status: 'sent', sentAt: '2026-11-10T12:00:00Z', createdAt: '2026-11-10T11:59:00Z' },
      { id: 'd2', chargeId: 'c1', stepId: 'atraso', status: 'failed', sentAt: null, createdAt: '2026-11-13T12:00:00Z' },
      { id: 'd3', chargeId: 'c1', stepId: 'previo', status: 'queued', sentAt: null, createdAt: '2026-11-05T12:00:00Z' },
    ],
    audits: [
      { id: 1, action: 'customer.updated', entityType: 'customer', entityId: 'k1', before: { name: 'A', phone: null }, after: { name: 'B', phone: '11' }, createdAt: '2026-11-02T10:00:00Z' },
      { id: 2, action: 'charge.promise_set', entityType: 'charge', entityId: 'c1', before: { promised_for: null }, after: { promised_for: '2026-11-20' }, createdAt: '2026-11-14T10:00:00Z' },
      { id: 3, action: 'customer.opted_out', entityType: 'customer', entityId: 'k1', before: null, after: null, createdAt: '2026-11-15T10:00:00Z' },
      { id: 4, action: 'charge.updated', entityType: 'charge', entityId: 'c1', before: { due_date: '2026-11-10', concept: 'Cuota de noviembre', amount_minor: 1 }, after: { due_date: '2026-11-15', concept: 'Cuota de noviembre', amount_minor: 1 }, createdAt: '2026-11-03T10:00:00Z' },
      { id: 5, action: 'payment.recorded', entityType: 'payment', entityId: 'p1', before: null, after: {}, createdAt: '2026-11-12T15:00:00Z' },
    ],
  }
  // El formato de plata usa espacio duro entre $ y el número.
  const events = buildTimeline(input).map((e) => ({ ...e, title: e.title.replace(/ /g, ' ') }))

  it('ordena de lo más nuevo a lo más viejo', () => {
    expect(events[0]!.title).toBe('Cobra+ generó el cobro del abono: Cuota de diciembre')
    expect(events.at(-1)!.title).toBe('Cliente cargado')
  })

  it('cuenta pagos, anulaciones, avisos y fallas en palabras simples', () => {
    const titles = events.map((e) => e.title)
    expect(titles).toContain('Pagó $ 50.000')
    expect(events.find((e) => e.kind === 'payment')!.detail).toBe('Transferencia · el 12 de noviembre')
    expect(events.find((e) => e.kind === 'payment_voided')).toMatchObject({ title: 'Pago de $ 1 anulado', detail: 'Lo cargué dos veces' })
    expect(titles).toContain('Se le mandó el aviso del día del vencimiento')
    expect(titles).toContain('No se pudo mandar el aviso de atraso')
    expect(titles).toContain('Prometió pagar el 20 de noviembre')
    expect(titles).toContain('Pidió no recibir más avisos')
  })

  it('no muestra avisos en cola ni duplica el pago con su auditoría', () => {
    expect(events.filter((e) => e.kind === 'reminder' || e.kind === 'reminder_failed')).toHaveLength(2)
    expect(events.filter((e) => e.title.startsWith('Pagó'))).toHaveLength(1)
  })

  it('dice qué datos se editaron y qué cambió del cobro', () => {
    expect(events.find((e) => e.kind === 'edited')!.detail).toBe('Cambió: nombre y celular')
    expect(events.find((e) => e.kind === 'charge_updated')!.detail).toBe('vence el 15 de noviembre (antes el 10 de noviembre)')
  })

  it('muestra la hora en la zona de la empresa', () => {
    expect(formatEventTime('2026-11-17T19:40:00Z', 'America/Argentina/Buenos_Aires')).toBe('17 nov · 16:40')
  })
})
