/**
 * Fechas de negocio. Los vencimientos son fechas calendario ("2026-11-10"),
 * sin hora. "Hoy" siempre se calcula en la zona horaria de la empresa.
 */

export type IsoDate = string // YYYY-MM-DD

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDate(s: string): s is IsoDate {
  if (!ISO_RE.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

/** Fecha de hoy en una zona horaria IANA. */
export function todayIn(timeZone: string, now: Date = new Date()): IsoDate {
  // en-CA formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Diferencia en días calendario: b - a. */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

export function addDays(d: IsoDate, days: number): IsoDate {
  const t = new Date(`${d}T00:00:00Z`)
  t.setUTCDate(t.getUTCDate() + days)
  return t.toISOString().slice(0, 10)
}

/**
 * Suma meses respetando fin de mes: 31/01 + 1 mes = 28/02 (o 29).
 * Usado por los abonos.
 */
export function addMonths(d: IsoDate, months: number): IsoDate {
  const [y, m, day] = d.split('-').map(Number)
  const targetMonthIndex = m - 1 + months
  const ty = y + Math.floor(targetMonthIndex / 12)
  const tm = ((targetMonthIndex % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate()
  const td = Math.min(day, lastDay)
  return `${ty}-${String(tm + 1).padStart(2, '0')}-${String(td).padStart(2, '0')}`
}

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual'

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
}

export function nextOccurrence(d: IsoDate, f: Frequency): IsoDate {
  switch (f) {
    case 'weekly': return addDays(d, 7)
    case 'biweekly': return addDays(d, 14)
    case 'monthly': return addMonths(d, 1)
    case 'quarterly': return addMonths(d, 3)
    case 'semiannual': return addMonths(d, 6)
    case 'annual': return addMonths(d, 12)
  }
}

export function formatDate(d: IsoDate, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  return new Intl.DateTimeFormat('es-AR', { ...opts, timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`))
}
