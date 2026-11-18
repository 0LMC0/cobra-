import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { bajaDoneEmail } from '@/domain/consumer-requests'
import { escapeHtml } from '@/domain/emails'
import { createAdminClient } from '@/lib/supabase/admin'
import { cancelPreapproval, mercadoPagoConfigured, syncPreapproval } from '@/server/billing/mercadopago'
import { sendEmail } from '@/server/email/mailer'

/**
 * Link del email de baja: confirma que el pedido lo hizo el dueño del email y
 * cancela la renovación de todos sus planes pagos. Sirve una sola vez y por 7 días.
 */
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const back = (q: string) => NextResponse.redirect(new URL(`/boton-de-baja?${q}`, url.origin))
  const token = url.searchParams.get('t') ?? ''
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return back('error=link')

  const db = createAdminClient()
  const hash = createHash('sha256').update(token).digest('hex')
  const { data: request } = await db.from('consumer_requests')
    .select('id, code, email, status, created_at').eq('confirm_hash', hash).eq('kind', 'baja').maybeSingle()
  if (!request) return back('error=link')
  if (request.status !== 'pendiente') return back(`listo=${request.code}`)
  if (Date.now() - new Date(request.created_at as string).getTime() > 7 * 24 * 3600 * 1000) return back('error=vencido')

  const { data: orgs } = await db.rpc('owner_orgs_by_email', { p_email: request.email })
  let cancelled = 0
  for (const { org_id } of (orgs ?? []) as { org_id: string }[]) {
    const { data: sub } = await db.from('subscriptions').select('provider_subscription_id, status').eq('org_id', org_id).maybeSingle()
    if (!sub?.provider_subscription_id || sub.status === 'cancelled' || !mercadoPagoConfigured()) continue
    try {
      await cancelPreapproval(sub.provider_subscription_id as string)
      await syncPreapproval(sub.provider_subscription_id as string, org_id)
      cancelled += 1
    } catch {
      return back('error=mp')
    }
  }

  await db.from('consumer_requests').update({
    status: 'resuelta', confirmed_at: new Date().toISOString(),
    result: cancelled ? `Renovación cancelada en ${cancelled} plan(es)` : 'Sin planes pagos activos',
  }).eq('id', request.id)
  await sendEmail({ to: request.email as string, ...bajaDoneEmail(request.code as string, cancelled), idempotencyKey: `tramite-listo-${request.code}` })
  const owner = process.env.OWNER_NOTIFY_EMAIL
  if (owner) await sendEmail({ to: owner, subject: `[Cobra+] Baja confirmada · ${request.code}`, text: `${request.email}: ${cancelled ? `se canceló la renovación de ${cancelled} plan(es)` : 'no tenía planes pagos activos'}.`, html: `<p>${escapeHtml(request.email as string)}: ${cancelled ? `se canceló la renovación de ${cancelled} plan(es)` : 'no tenía planes pagos activos'}.</p>` })
  return back(`listo=${request.code}`)
}
