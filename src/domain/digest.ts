import { addDays, daysBetween, isIsoDate, type IsoDate } from './dates'
import { formatMoneyClean, type CurrencyCode } from './money'

/**
 * Resumen por email para quien cobra: le recuerda entrar a Cobra+ y le dice a
 * quién hay que cobrarle. Reglas para que no moleste:
 * - Sólo sale si hay algo para hacer (vencidos, vence hoy o en los próximos días, promesas).
 * - Respeta la frecuencia que eligió la persona (por defecto, cada 3 días).
 * - Nunca más de uno por día, y no sale sábados ni domingos.
 */
export type DigestFrequency = 'daily' | 'every_3_days' | 'weekly' | 'off'

export const DIGEST_FREQUENCY_LABEL: Record<DigestFrequency, string> = {
  daily: 'Todos los días (sólo si hay algo para cobrar)',
  every_3_days: 'Cada 3 días',
  weekly: 'Una vez por semana',
  off: 'No mandarme el resumen',
}

export const DEFAULT_DIGEST_FREQUENCY: DigestFrequency = 'every_3_days'

const MIN_DAYS: Record<Exclude<DigestFrequency, 'off'>, number> = { daily: 1, every_3_days: 3, weekly: 7 }

function isWeekend(d: IsoDate): boolean {
  const [y, m, day] = d.split('-').map(Number) as [number, number, number]
  const wd = new Date(Date.UTC(y, m - 1, day)).getUTCDay()
  return wd === 0 || wd === 6
}

export function shouldSendDigest(input: { frequency: DigestFrequency; lastSentOn: IsoDate | null; today: IsoDate; hasNews: boolean }): boolean {
  const { frequency, lastSentOn, today, hasNews } = input
  if (frequency === 'off' || !hasNews || isWeekend(today)) return false
  if (!lastSentOn) return true
  return daysBetween(lastSentOn, today) >= MIN_DAYS[frequency]
}

export type DigestCharge = {
  customerName: string
  concept: string
  balanceMinor: number
  currency: CurrencyCode
  dueDate: IsoDate
  promisedFor?: IsoDate | null
}

export type DigestLine = { customerName: string; concept: string; amount: string; note: string }

export type Digest = {
  subject: string
  overdue: DigestLine[]
  dueToday: DigestLine[]
  dueSoon: DigestLine[]
  promises: DigestLine[]
  /** Totales por moneda de lo que hay que mirar (nunca se suman monedas distintas). */
  totals: string[]
}

/** Días hacia adelante que cuentan como "vence pronto". */
export const DUE_SOON_DAYS = 3

export function buildDigest(charges: DigestCharge[], today: IsoDate): Digest | null {
  if (!isIsoDate(today)) throw new Error(`Fecha inválida: ${today}`)
  const soonLimit = addDays(today, DUE_SOON_DAYS)
  const overdue: DigestLine[] = []
  const dueToday: DigestLine[] = []
  const dueSoon: DigestLine[] = []
  const promises: DigestLine[] = []
  const totals = new Map<CurrencyCode, number>()

  const sorted = [...charges].filter((c) => c.balanceMinor > 0).sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0))
  for (const c of sorted) {
    const line = (note: string): DigestLine => ({ customerName: c.customerName, concept: c.concept, amount: formatMoneyClean(c.balanceMinor, c.currency), note })
    let counted = true
    if (c.promisedFor && c.promisedFor <= today) promises.push(line(c.promisedFor === today ? 'Prometió pagar hoy' : 'Prometió pagar y todavía no pagó'))
    else if (c.promisedFor) counted = false // prometió una fecha futura: no se lo apura
    else if (c.dueDate < today) {
      const days = daysBetween(c.dueDate, today)
      overdue.push(line(days === 1 ? 'Venció ayer' : `Venció hace ${days} días`))
    } else if (c.dueDate === today) dueToday.push(line('Vence hoy'))
    else if (c.dueDate <= soonLimit) {
      const days = daysBetween(today, c.dueDate)
      dueSoon.push(line(days === 1 ? 'Vence mañana' : `Vence en ${days} días`))
    } else counted = false
    if (counted) totals.set(c.currency, (totals.get(c.currency) ?? 0) + c.balanceMinor)
  }

  const count = overdue.length + dueToday.length + dueSoon.length + promises.length
  if (count === 0) return null

  const subject = overdue.length > 0
    ? `${count === 1 ? 'Tenés 1 cobro para mirar' : `Tenés ${count} cobros para mirar`}: ${overdue.length === 1 ? '1 está atrasado' : `${overdue.length} están atrasados`}`
    : count === 1 ? 'Tenés 1 cobro para mirar' : `Tenés ${count} cobros para mirar`

  return {
    subject,
    overdue,
    dueToday,
    dueSoon,
    promises,
    totals: [...totals].map(([currency, minor]) => formatMoneyClean(minor, currency)),
  }
}
