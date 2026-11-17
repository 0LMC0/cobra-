import { addDays, nextOccurrence, type Frequency, type IsoDate } from './dates'

/**
 * Abonos: qué cobros hay que generar hoy. Puro y testeable; el proceso diario
 * lo aplica. La base impide generar dos veces el mismo período
 * (unique agreement_id + period_start), así que repetirlo no duplica nada.
 */

/** Días de anticipación: el cobro existe antes del primer aviso (5 días antes). */
export const GENERATE_AHEAD_DAYS = 7
/** Si el proceso estuvo parado, no genera más que esto de golpe por abono. */
export const MAX_CATCH_UP = 3

export type AgreementForGeneration = {
  id: string
  name: string
  frequency: Frequency
  nextChargeDate: IsoDate | null
  endDate: IsoDate | null
}

export type PeriodToGenerate = { periodStart: IsoDate; dueDate: IsoDate; concept: string }

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MONTH_RE = new RegExp(`\\b(${MONTHS.join('|')})\\b`, 'i')

/** "Cuota de noviembre" → "Cuota de diciembre". Si el nombre no tiene mes, se agrega. */
export function conceptForPeriod(name: string, dueDate: IsoDate, frequency: Frequency): string {
  const month = MONTHS[Number(dueDate.slice(5, 7)) - 1]!
  const trimmed = name.trim()
  if (MONTH_RE.test(trimmed)) {
    return trimmed.replace(MONTH_RE, (m) => (m[0] === m[0]!.toUpperCase() ? month[0]!.toUpperCase() + month.slice(1) : month))
  }
  if (frequency === 'weekly' || frequency === 'biweekly') return `${trimmed} · ${Number(dueDate.slice(8, 10))} de ${month}`
  return `${trimmed} · ${month}`
}

export function periodsToGenerate(a: AgreementForGeneration, today: IsoDate): { periods: PeriodToGenerate[]; nextChargeDate: IsoDate | null } {
  const horizon = addDays(today, GENERATE_AHEAD_DAYS)
  const periods: PeriodToGenerate[] = []
  let next = a.nextChargeDate
  while (next && next <= horizon && periods.length < MAX_CATCH_UP) {
    if (a.endDate && next > a.endDate) { next = null; break }
    periods.push({ periodStart: next, dueDate: next, concept: conceptForPeriod(a.name, next, a.frequency) })
    next = nextOccurrence(next, a.frequency)
  }
  if (next && a.endDate && next > a.endDate) next = null
  return { periods, nextChargeDate: next }
}
