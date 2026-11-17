import { addDays, isIsoDate, type IsoDate } from './dates'

/**
 * Plan de avisos de un cobro. Reglas puras, sin base de datos ni reloj.
 *
 * Salen del estudio de mercado (docs/MARKET_RESEARCH.md):
 * - El peso está ANTES y EN el vencimiento: recordar a tiempo rinde más que
 *   insistir después.
 * - Después del vencimiento van pocos avisos y luego el caso pasa a una persona.
 * - Nunca se escribe en fin de semana ni en feriado.
 * - Si el cliente prometió una fecha, no se le escribe hasta ese día.
 * - Cuando paga, lo que faltaba no sale.
 */
export type ReminderKind = 'before' | 'due' | 'after' | 'final'

export type ReminderStep = {
  id: string
  /** Días respecto del vencimiento: negativo = antes, 0 = el día, positivo = después. */
  offsetDays: number
  kind: ReminderKind
}

export const DEFAULT_SEQUENCE: readonly ReminderStep[] = [
  { id: 'previo', offsetDays: -5, kind: 'before' },
  { id: 'vispera', offsetDays: -1, kind: 'before' },
  { id: 'vence', offsetDays: 0, kind: 'due' },
  { id: 'atraso', offsetDays: 3, kind: 'after' },
  { id: 'ultimo', offsetDays: 7, kind: 'final' },
]

/** Días que se le dan al cliente después del último aviso antes de pasarle el caso a quien cobra. */
export const HANDOFF_AFTER_DAYS = 3

export type ReminderStatus =
  | 'send' // sale ese día
  | 'cancelled_paid' // no sale: ya pagó
  | 'held_promise' // no sale: prometió una fecha y todavía no llegó
  | 'paused' // no sale: quien cobra pausó a este cliente
  | 'opted_out' // no sale: el cliente pidió no recibir avisos

export type PlannedReminder = {
  stepId: string
  kind: ReminderKind | 'promise_followup'
  sendOn: IsoDate
  status: ReminderStatus
}

export type ReminderPlan = {
  reminders: PlannedReminder[]
  /** Día en que el caso pasa a quien cobra (aparece en su resumen). Null si no corresponde. */
  handOffOn: IsoDate | null
}

export type ReminderPlanInput = {
  dueDate: IsoDate
  steps?: readonly ReminderStep[]
  /** Feriados en formato YYYY-MM-DD. */
  holidays?: readonly IsoDate[]
  /** Día en que el cobro quedó saldado. */
  paidOn?: IsoDate | null
  /** Día para el que el cliente prometió pagar. */
  promisedFor?: IsoDate | null
  /** Día en que se anotó la promesa. Los avisos anteriores ya salieron y no cambian. */
  promisedOn?: IsoDate | null
  paused?: boolean
  optedOut?: boolean
}

function assertIso(value: string, name: string): void {
  if (!isIsoDate(value)) throw new Error(`Fecha inválida en ${name}: ${value}`)
}

export function isBusinessDay(date: IsoDate, holidays: readonly IsoDate[] = []): boolean {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = domingo
  return weekday !== 0 && weekday !== 6 && !holidays.includes(date)
}

/** Mueve la fecha al día hábil más cercano en la dirección indicada (-1 atrás, +1 adelante). */
export function shiftToBusinessDay(date: IsoDate, direction: -1 | 1, holidays: readonly IsoDate[] = []): IsoDate {
  let current = date
  for (let i = 0; i < 31 && !isBusinessDay(current, holidays); i += 1) current = addDays(current, direction)
  return current
}

export function planReminders(input: ReminderPlanInput): ReminderPlan {
  const { dueDate, holidays = [], paidOn = null, promisedFor = null, promisedOn = null, paused = false, optedOut = false } = input
  assertIso(dueDate, 'dueDate')
  if (paidOn) assertIso(paidOn, 'paidOn')
  if (promisedFor) assertIso(promisedFor, 'promisedFor')
  if (promisedOn) assertIso(promisedOn, 'promisedOn')

  const steps = [...(input.steps ?? DEFAULT_SEQUENCE)].sort((a, b) => a.offsetDays - b.offsetDays)

  // 1) Cada paso cae en día hábil: lo previo se adelanta, lo posterior se atrasa.
  const reminders: PlannedReminder[] = []
  for (const step of steps) {
    const raw = addDays(dueDate, step.offsetDays)
    const sendOn = shiftToBusinessDay(raw, step.offsetDays <= 0 ? -1 : 1, holidays)
    const previous = reminders[reminders.length - 1]
    const planned: PlannedReminder = { stepId: step.id, kind: step.kind, sendOn, status: 'send' }
    // Dos avisos el mismo día no: queda el más cercano al vencimiento.
    if (previous && previous.sendOn === sendOn) reminders[reminders.length - 1] = planned
    else reminders.push(planned)
  }

  // 2) Promesa de pago: silencio hasta la fecha prometida y un seguimiento al día hábil siguiente.
  if (promisedFor) {
    for (const r of reminders) {
      const alreadySent = promisedOn !== null && r.sendOn <= promisedOn
      if (!alreadySent && r.sendOn <= promisedFor) r.status = 'held_promise'
    }
    const followUp = shiftToBusinessDay(addDays(promisedFor, 1), 1, holidays)
    if (!reminders.some((r) => r.sendOn === followUp)) {
      reminders.push({ stepId: 'promesa', kind: 'promise_followup', sendOn: followUp, status: 'send' })
      reminders.sort((a, b) => (a.sendOn < b.sendOn ? -1 : a.sendOn > b.sendOn ? 1 : 0))
    }
  }

  // 3) Pagó: lo que faltaba no sale.
  if (paidOn) {
    for (const r of reminders) if (r.sendOn > paidOn) r.status = 'cancelled_paid'
  }

  // 4) Pausa y baja mandan sobre todo lo demás.
  if (paused || optedOut) {
    for (const r of reminders) r.status = optedOut ? 'opted_out' : 'paused'
  }

  // 5) Si nadie pagó, después del último aviso el caso pasa a una persona.
  let handOffOn: IsoDate | null = null
  if (!paidOn && !paused && !optedOut) {
    const last = reminders.filter((r) => r.status === 'send').at(-1)
    if (last) handOffOn = shiftToBusinessDay(addDays(last.sendOn, HANDOFF_AFTER_DAYS), 1, holidays)
  }

  return { reminders, handOffOn }
}

/** Los avisos que salen un día dado. */
export function remindersToSendOn(plan: ReminderPlan, day: IsoDate): PlannedReminder[] {
  return plan.reminders.filter((r) => r.status === 'send' && r.sendOn === day)
}
