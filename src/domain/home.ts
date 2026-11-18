import type { IsoDate } from './dates'
import type { CurrencyCode } from './money'
import { planReminders, remindersToSendOn, type ReminderKind } from './reminders'
import type { WhatsAppMoment } from './whatsapp'

/**
 * Lo que muestra el inicio, calculado con los datos reales. Puro y testeable.
 * Los totales van en la moneda principal de la empresa: nunca se mezclan monedas.
 */
export type HomeCharge = {
  id: string
  customerId: string
  concept: string
  amountMinor: number
  balanceMinor: number
  currency: CurrencyCode
  dueDate: IsoDate
  promisedFor: IsoDate | null
  promisedOn: IsoDate | null
}

export type HomeCustomer = {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  whatsappOk: boolean
  optOut: boolean
  paused: boolean
}

export type HomePayment = { amountMinor: number; currency: CurrencyCode; paidOn: IsoDate }

export type EmailStatus = 'sent' | 'today' | 'off' | 'none'

export type HomeReminder = {
  id: string
  customerName: string
  contactName: string | null
  phone: string | null
  concept: string
  amountMinor: number
  currency: CurrencyCode
  dueDate: IsoDate
  moment: WhatsAppMoment
  emailStatus: EmailStatus
}

export type HomeTotals = { pendingMinor: number; collectedMinor: number; overdueMinor: number; hasData: boolean }

const MOMENT: Record<ReminderKind | 'promise_followup', WhatsAppMoment> = {
  before: 'before', due: 'due', after: 'after', final: 'final', promise_followup: 'promise',
}

export function homeTotals(input: { charges: HomeCharge[]; payments: HomePayment[]; currency: CurrencyCode; today: IsoDate; hasAnyCharge: boolean }): HomeTotals {
  const monthStart = `${input.today.slice(0, 7)}-01`
  let pendingMinor = 0
  let overdueMinor = 0
  for (const c of input.charges) {
    if (c.currency !== input.currency || c.balanceMinor <= 0) continue
    pendingMinor += c.balanceMinor
    if (c.dueDate < input.today) overdueMinor += c.balanceMinor
  }
  const collectedMinor = input.payments
    .filter((p) => p.currency === input.currency && p.paidOn >= monthStart && p.paidOn <= input.today)
    .reduce((s, p) => s + p.amountMinor, 0)
  return { pendingMinor, collectedMinor, overdueMinor, hasData: input.hasAnyCharge }
}

/** Los cobros que tienen aviso hoy (mismo calendario que el email automático). */
export function remindersForToday(input: {
  charges: HomeCharge[]
  customers: HomeCustomer[]
  today: IsoDate
  remindersEnabled: boolean
  /** Claves "chargeId:stepId" de emails ya enviados. */
  sent: Set<string>
  holidays?: IsoDate[]
}): HomeReminder[] {
  const customers = new Map(input.customers.map((c) => [c.id, c]))
  const out: HomeReminder[] = []
  for (const charge of input.charges) {
    if (charge.balanceMinor <= 0) continue
    const customer = customers.get(charge.customerId)
    if (!customer || customer.optOut || customer.paused) continue
    const plan = planReminders({
      dueDate: charge.dueDate, holidays: input.holidays, promisedFor: charge.promisedFor, promisedOn: charge.promisedOn,
    })
    const [step] = remindersToSendOn(plan, input.today)
    if (!step) continue
    const emailStatus: EmailStatus = !customer.email
      ? 'none'
      : !input.remindersEnabled
        ? 'off'
        : input.sent.has(`${charge.id}:${step.stepId}`) ? 'sent' : 'today'
    out.push({
      id: charge.id,
      customerName: customer.name,
      contactName: customer.contactName,
      phone: customer.whatsappOk ? customer.phone : null,
      concept: charge.concept,
      amountMinor: charge.balanceMinor,
      currency: charge.currency,
      dueDate: charge.dueDate,
      moment: MOMENT[step.kind],
      emailStatus,
    })
  }
  // Primero lo más urgente: atrasados, después hoy, después lo que viene.
  const rank: Record<WhatsAppMoment, number> = { final: 0, after: 1, promise: 2, due: 3, before: 4 }
  return out.sort((a, b) => rank[a.moment] - rank[b.moment] || a.dueDate.localeCompare(b.dueDate))
}

export type MonthBar = { month: string; label: string; collectedMinor: number; current: boolean }

/**
 * Cobrado por mes (pagos confirmados) en la moneda principal, de los últimos `months`
 * meses incluido el actual. Los meses sin pagos van en 0 para que el gráfico no salte.
 */
export function collectedByMonth(payments: { amountMinor: number; currency: string; paidOn: string }[], currency: string, today: string, months = 6): MonthBar[] {
  const [y, m] = today.split('-').map(Number)
  const keys: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1))
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  const sums = new Map(keys.map((k) => [k, 0]))
  for (const p of payments) {
    const k = p.paidOn.slice(0, 7)
    if (p.currency === currency && sums.has(k)) sums.set(k, (sums.get(k) ?? 0) + p.amountMinor)
  }
  const fmt = new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: 'UTC' })
  return keys.map((k, i) => ({
    month: k,
    label: fmt.format(new Date(`${k}-15T12:00:00Z`)).replace('.', ''),
    collectedMinor: sums.get(k) ?? 0,
    current: i === keys.length - 1,
  }))
}

export type UpcomingItem = { chargeId: string; customerId: string; customerName: string; concept: string; balanceMinor: number; currency: CurrencyCode; date: IsoDate; promised: boolean }
export type UpcomingWeek = { label: string; from: IsoDate; to: IsoDate; totals: { currency: CurrencyCode; minor: number }[]; items: UpcomingItem[] }

const addDaysIso = (d: string, n: number): IsoDate => {
  const t = new Date(`${d}T12:00:00Z`)
  t.setUTCDate(t.getUTCDate() + n)
  return t.toISOString().slice(0, 10) as IsoDate
}

/**
 * Lo que vence en las próximas semanas (de lunes a domingo; la primera arranca hoy).
 * Usa la fecha que prometió el cliente si la hay. Lo vencido no entra: ya está en "Atrasado".
 * Los totales van por moneda: nunca se suman monedas distintas.
 */
export function upcomingByWeek(charges: HomeCharge[], names: Map<string, string>, today: IsoDate, weeks = 4): UpcomingWeek[] {
  const dow = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7 // 0 = lunes
  const fmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const short = (d: string) => fmt.format(new Date(`${d}T12:00:00Z`)).replace('.', '')
  const out: UpcomingWeek[] = []
  for (let w = 0; w < weeks; w++) {
    const from = w === 0 ? today : addDaysIso(today, 7 * w - dow)
    const to = addDaysIso(today, 7 * w - dow + 6)
    const label = w === 0 ? 'Esta semana' : w === 1 ? 'La semana que viene' : `Del ${short(from)} al ${short(to)}`
    out.push({ label, from, to, totals: [], items: [] })
  }
  for (const c of charges) {
    if (c.balanceMinor <= 0) continue
    const date = (c.promisedFor && c.promisedFor >= today ? c.promisedFor : c.dueDate) as IsoDate
    if (date < today) continue
    const week = out.find((w) => date >= w.from && date <= w.to)
    if (!week) continue
    week.items.push({ chargeId: c.id, customerId: c.customerId, customerName: names.get(c.customerId) ?? 'Cliente', concept: c.concept, balanceMinor: c.balanceMinor, currency: c.currency, date, promised: date === c.promisedFor })
  }
  for (const w of out) {
    w.items.sort((a, b) => a.date.localeCompare(b.date) || b.balanceMinor - a.balanceMinor)
    const sums = new Map<CurrencyCode, number>()
    for (const i of w.items) sums.set(i.currency, (sums.get(i.currency) ?? 0) + i.balanceMinor)
    w.totals = [...sums].map(([currency, minor]) => ({ currency, minor }))
  }
  return out
}
