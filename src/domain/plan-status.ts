import { isPlanTier, type PlanTier } from '@/config/plans'

/**
 * Qué plan rige hoy para una empresa. Sin suscripción, o cancelada y vencida, es Gratis.
 * Un pago atrasado mantiene el plan hasta el fin del período ya pagado.
 */
export type SubscriptionRow = { plan: string; status: string; currentPeriodEnd: string | null } | null

export function effectivePlan(sub: SubscriptionRow, now: Date = new Date()): PlanTier {
  if (!sub || !isPlanTier(sub.plan)) return 'free'
  if (sub.status === 'active' || sub.status === 'trialing') return sub.plan
  // past_due o cancelled: vale hasta que termina lo pagado.
  if (sub.currentPeriodEnd && Date.parse(sub.currentPeriodEnd) > now.getTime()) return sub.plan
  return 'free'
}
