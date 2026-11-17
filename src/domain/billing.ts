import { ARS_PRICE_REFERENCE, getPlan, isPlanTier, monthlyPriceFor, yearlyTotalFor, type BillingInterval, type PlanId } from '@/config/plans'

/**
 * Suscripción de Cobra+ con Mercado Pago (API preapproval). Puro y testeable:
 * qué se le pide a Mercado Pago y cómo se lee lo que devuelve.
 * Mercado Pago Argentina cobra en pesos: el precio en dólares es sólo referencia.
 */
export const PAID_PLANS: PlanId[] = ['starter', 'growth', 'business']

/** Importe en pesos de cada cobro: mensual, o el total del año en un pago. */
export function chargeAmountArs(plan: PlanId, interval: BillingInterval): number {
  const p = getPlan(plan)
  return interval === 'year' ? yearlyTotalFor(p, 'ARS') : monthlyPriceFor(p, 'month', 'ARS')
}

/** Lo que identifica la suscripción en Mercado Pago: "<orgId>|<plan>|<interval>". */
export function buildExternalReference(orgId: string, plan: PlanId, interval: BillingInterval): string {
  return `${orgId}|${plan}|${interval}`
}

export function parseExternalReference(ref: unknown): { orgId: string; plan: PlanId; interval: BillingInterval } | null {
  if (typeof ref !== 'string') return null
  const [orgId, plan, interval] = ref.split('|')
  if (!orgId || !/^[0-9a-f-]{36}$/i.test(orgId)) return null
  if (!isPlanTier(plan) || plan === 'free') return null
  if (interval !== 'month' && interval !== 'year') return null
  return { orgId, plan, interval }
}

/** Cuerpo para POST /preapproval: la persona termina el pago en Mercado Pago (init_point). */
export function preapprovalRequest(input: {
  orgId: string
  orgName: string
  plan: PlanId
  interval: BillingInterval
  payerEmail: string
  backUrl: string
}) {
  const p = getPlan(input.plan)
  return {
    reason: `Cobra+ ${p.name} (${input.interval === 'year' ? 'anual' : 'mensual'}) · ${input.orgName}`.slice(0, 120),
    external_reference: buildExternalReference(input.orgId, input.plan, input.interval),
    payer_email: input.payerEmail,
    back_url: input.backUrl,
    status: 'pending',
    auto_recurring: {
      frequency: input.interval === 'year' ? 12 : 1,
      frequency_type: 'months',
      transaction_amount: chargeAmountArs(input.plan, input.interval),
      currency_id: 'ARS',
    },
  }
}

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled'

/**
 * Estado de Mercado Pago → estado en Cobra+. "pending" = todavía no pagó: no cambia nada.
 * authorized = activa; paused = sin cobrar (tarjeta rechazada o pausada); cancelled = cancelada.
 */
export function mapPreapprovalStatus(status: unknown): SubscriptionStatus | null {
  switch (status) {
    case 'authorized': return 'active'
    case 'paused': return 'past_due'
    case 'cancelled': return 'cancelled'
    default: return null
  }
}

/** Fin del período pago: la próxima fecha de cobro que informa Mercado Pago. */
export function periodEndFrom(nextPaymentDate: unknown): string | null {
  return typeof nextPaymentDate === 'string' && !Number.isNaN(Date.parse(nextPaymentDate)) ? new Date(nextPaymentDate).toISOString() : null
}

/** Referencia para mostrar: lista de precios en pesos fijada a mano. */
export const ARS_REFERENCE = ARS_PRICE_REFERENCE

/**
 * Firma de los webhooks de Mercado Pago (encabezado x-signature: "ts=...,v1=...").
 * El mensaje firmado es "id:<data.id>;request-id:<x-request-id>;ts:<ts>;".
 * Devuelve las partes; la comparación HMAC se hace en el servidor.
 */
export function parseSignatureHeader(header: string | null): { ts: string; v1: string } | null {
  if (!header) return null
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.trim().split('=', 2) as [string, string]))
  return parts.ts && parts.v1 ? { ts: parts.ts, v1: parts.v1 } : null
}

export function signatureManifest(dataId: string, requestId: string | null, ts: string): string {
  // Mercado Pago pide el id en minúsculas si es alfanumérico; si falta request-id, se omite esa parte.
  return `id:${dataId.toLowerCase()};${requestId ? `request-id:${requestId};` : ''}ts:${ts};`
}
