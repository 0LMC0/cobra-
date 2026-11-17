import { daysBetween, type IsoDate } from './dates'

/**
 * Estado mostrado de un cobro. Se CALCULA: sólo `state` (draft/open/cancelled)
 * se guarda. Espejo SQL: vista `charge_balances` (Fase 2). Si cambiás algo acá,
 * cambialo allá y en los tests.
 */
export type StoredChargeState = 'draft' | 'open' | 'cancelled'

export type ChargeStatus =
  | 'draft'
  | 'cancelled'
  | 'paid'
  | 'overdue'
  | 'partially_paid'
  | 'due_soon'
  | 'pending'

export type ChargeStatusInput = {
  state: StoredChargeState
  /** Total luego de descuentos/recargos, en unidades menores. */
  totalMinor: number
  /** Suma de imputaciones de pagos confirmados. */
  paidMinor: number
  dueDate: IsoDate
}

export const DEFAULT_DUE_SOON_DAYS = 7

export function chargeStatus(c: ChargeStatusInput, today: IsoDate, dueSoonDays = DEFAULT_DUE_SOON_DAYS): ChargeStatus {
  if (c.state === 'draft') return 'draft'
  if (c.state === 'cancelled') return 'cancelled'

  const balance = c.totalMinor - c.paidMinor
  if (balance <= 0) return 'paid'

  const daysToDue = daysBetween(today, c.dueDate)
  if (daysToDue < 0) return 'overdue'
  if (c.paidMinor > 0) return 'partially_paid'
  if (daysToDue <= dueSoonDays) return 'due_soon'
  return 'pending'
}

export function balanceMinor(c: Pick<ChargeStatusInput, 'totalMinor' | 'paidMinor'>): number {
  return Math.max(0, c.totalMinor - c.paidMinor)
}

/** Días de atraso (0 si no está vencido). */
export function daysOverdue(dueDate: IsoDate, today: IsoDate): number {
  return Math.max(0, daysBetween(dueDate, today))
}

export const STATUS_LABEL: Record<ChargeStatus, string> = {
  draft: 'Borrador',
  cancelled: 'Cancelado',
  paid: 'Pagado',
  overdue: 'Vencido',
  partially_paid: 'Pago parcial',
  due_soon: 'Próximo a vencer',
  pending: 'Pendiente',
}

/** Estados que todavía esperan plata. */
export function isCollectible(s: ChargeStatus): boolean {
  return s === 'overdue' || s === 'partially_paid' || s === 'due_soon' || s === 'pending'
}
