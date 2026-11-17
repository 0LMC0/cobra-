import { STATUS_LABEL, type ChargeStatus } from './charge-status'
import { csvAmount, csvDate, raw, toCsv } from './csv'
import type { IsoDate } from './dates'
import { PAYMENT_METHODS, type PaymentMethod } from './forms'
import type { CurrencyCode } from './money'

/** Reportes descargables. Puros: reciben los datos ya filtrados por empresa. */

export type ExportCustomer = {
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  whatsappOk: boolean
  taxId: string | null
  notes: string | null
  archived: boolean
  optedOut: boolean
  remindersPaused: boolean
  owed: { currency: CurrencyCode; balanceMinor: number }[]
  overdueCount: number
  createdAt: string
}

const yesNo = (v: boolean) => (v ? 'Sí' : 'No')

/** Una columna "Debe" por moneda (nunca se suman monedas); la principal primero. */
export function customersCsv(customers: ExportCustomer[], mainCurrency: CurrencyCode): string {
  const currencies = [...new Set(customers.flatMap((c) => c.owed.map((o) => o.currency)))]
    .sort((a, b) => (a === mainCurrency ? -1 : b === mainCurrency ? 1 : a.localeCompare(b)))
  if (currencies.length === 0) currencies.push(mainCurrency)

  const header = [
    'Nombre', 'Contacto', 'Email', 'Celular', 'Acepta WhatsApp', 'CUIT', 'Estado', 'Avisos automáticos',
    ...currencies.map((c) => `Debe (${c})`), 'Cobros vencidos', 'Notas', 'Alta',
  ]
  const rows = customers.map((c) => [
    c.name, c.contactName, c.email, c.phone, yesNo(c.whatsappOk), c.taxId,
    c.archived ? 'Archivado' : 'Activo',
    c.optedOut ? 'Se dio de baja' : c.remindersPaused ? 'Pausados' : c.archived ? 'No (archivado)' : 'Activos',
    ...currencies.map((cur) => raw(csvAmount(c.owed.find((o) => o.currency === cur)?.balanceMinor ?? 0, cur))),
    c.overdueCount,
    c.notes,
    raw(csvDate(c.createdAt.slice(0, 10))),
  ])
  return toCsv(header, rows)
}

export type ExportCharge = {
  customerName: string
  concept: string
  currency: CurrencyCode
  amountMinor: number
  paidMinor: number
  balanceMinor: number
  dueDate: IsoDate
  status: ChargeStatus
  promisedFor: IsoDate | null
  recurring: boolean
}

export function chargesCsv(charges: ExportCharge[]): string {
  const header = ['Cliente', 'Concepto', 'Moneda', 'Importe', 'Pagado', 'Saldo', 'Vence', 'Estado', 'Prometió pagar el', 'Se repite']
  const rows = [...charges]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.customerName.localeCompare(b.customerName))
    .map((c) => [
      c.customerName, c.concept, c.currency,
      raw(csvAmount(c.amountMinor, c.currency)), raw(csvAmount(c.paidMinor, c.currency)), raw(csvAmount(c.balanceMinor, c.currency)),
      raw(csvDate(c.dueDate)), STATUS_LABEL[c.status], raw(csvDate(c.promisedFor)), yesNo(c.recurring),
    ])
  return toCsv(header, rows)
}

export type ExportPayment = {
  customerName: string
  paidOn: IsoDate
  currency: CurrencyCode
  amountMinor: number
  method: string
  reference: string | null
  status: 'confirmed' | 'voided'
  voidedReason: string | null
  createdAt: string
}

export function paymentsCsv(payments: ExportPayment[]): string {
  const header = ['Fecha de pago', 'Cliente', 'Moneda', 'Importe', 'Medio', 'Referencia', 'Estado', 'Motivo de anulación', 'Registrado el']
  const rows = [...payments]
    .sort((a, b) => b.paidOn.localeCompare(a.paidOn) || b.createdAt.localeCompare(a.createdAt))
    .map((p) => [
      raw(csvDate(p.paidOn)), p.customerName, p.currency, raw(csvAmount(p.amountMinor, p.currency)),
      PAYMENT_METHODS[p.method as PaymentMethod] ?? 'Otro', p.reference,
      p.status === 'voided' ? 'Anulado' : 'Confirmado', p.voidedReason, raw(csvDate(p.createdAt.slice(0, 10))),
    ])
  return toCsv(header, rows)
}
