import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapPreapprovalStatus, parseExternalReference, parseSignatureHeader, periodEndFrom, signatureManifest } from '@/domain/billing'

/**
 * Adaptador de Mercado Pago (Suscripciones / preapproval), por HTTP, sin SDK.
 * Sin MP_ACCESS_TOKEN_COBRA no hace nada y lo dice: no hay integraciones de mentira.
 */
const API = 'https://api.mercadopago.com'

export function mercadoPagoConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN_COBRA)
}

async function mp<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.MP_ACCESS_TOKEN_COBRA
  if (!token) throw new Error('Falta MP_ACCESS_TOKEN_COBRA')
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    cache: 'no-store',
  })
  const body = (await res.json().catch(() => ({}))) as T & { message?: string }
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${body.message ?? 'error'}`.slice(0, 300))
  return body
}

export type Preapproval = {
  id: string
  status: string
  external_reference?: string
  init_point?: string
  next_payment_date?: string
  payer_email?: string
}

export function createPreapproval(body: object, idempotencyKey: string): Promise<Preapproval> {
  return mp<Preapproval>('/preapproval', { method: 'POST', body: JSON.stringify(body), headers: { 'X-Idempotency-Key': idempotencyKey } })
}

export function getPreapproval(id: string): Promise<Preapproval> {
  return mp<Preapproval>(`/preapproval/${encodeURIComponent(id)}`)
}

export function cancelPreapproval(id: string): Promise<Preapproval> {
  return mp<Preapproval>(`/preapproval/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ status: 'cancelled' }) })
}

/** Verifica la firma del webhook con MP_WEBHOOK_SECRET_COBRA (HMAC SHA-256, comparación en tiempo constante). */
export function verifyWebhookSignature(opts: { signature: string | null; requestId: string | null; dataId: string }): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET_COBRA
  const parsed = parseSignatureHeader(opts.signature)
  if (!secret || !parsed) return false
  const want = createHmac('sha256', secret).update(signatureManifest(opts.dataId, opts.requestId, parsed.ts)).digest('hex')
  const a = Buffer.from(parsed.v1)
  const b = Buffer.from(want)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Trae la suscripción desde Mercado Pago (nunca confía en lo que llega en la URL
 * o en el aviso) y guarda el plan de la empresa. Idempotente: repetirlo deja lo mismo.
 * Devuelve el orgId afectado, o null si no correspondía hacer nada.
 */
export async function syncPreapproval(preapprovalId: string, expectedOrgId?: string): Promise<{ orgId: string; status: string } | null> {
  const pre = await getPreapproval(preapprovalId)
  const ref = parseExternalReference(pre.external_reference)
  if (!ref) return null
  if (expectedOrgId && ref.orgId !== expectedOrgId) return null
  const status = mapPreapprovalStatus(pre.status)
  if (!status) return { orgId: ref.orgId, status: pre.status } // pending: todavía no pagó

  const db = createAdminClient()
  const { data: current } = await db.from('subscriptions').select('provider_subscription_id, status').eq('org_id', ref.orgId).maybeSingle()
  const previousId = current?.provider_subscription_id as string | null | undefined
  if (previousId && previousId !== pre.id) {
    // Un aviso de una suscripción vieja no pisa a la nueva.
    if (status !== 'active') return { orgId: ref.orgId, status: 'ignored_old_subscription' }
    // Cambio de plan: la nueva quedó activa, la vieja se cancela para no cobrar dos veces.
    if (current?.status !== 'cancelled') await cancelPreapproval(previousId).catch(() => undefined)
  }

  const { error } = await db.from('subscriptions').upsert(
    {
      org_id: ref.orgId,
      plan: ref.plan,
      status,
      billing_interval: ref.interval,
      current_period_end: periodEndFrom(pre.next_payment_date),
      cancel_at_period_end: status === 'cancelled',
      provider: 'mercadopago',
      provider_subscription_id: pre.id,
    },
    { onConflict: 'org_id' },
  )
  if (error) throw new Error(`No se pudo guardar la suscripción: ${error.message}`)
  return { orgId: ref.orgId, status }
}
