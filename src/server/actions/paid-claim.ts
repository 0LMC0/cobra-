'use server'

import { redirect } from 'next/navigation'
import { siteUrl } from '@/config/env'
import { addDays, todayIn, type IsoDate } from '@/domain/dates'
import { escapeHtml } from '@/domain/emails'
import { button, emailLayout, mark, p } from '@/domain/email-layout'
import { isTestAddress } from '@/domain/email-address'
import { formatMoneyClean, type CurrencyCode } from '@/domain/money'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/server/email/mailer'
import { verifyPaidClaimToken } from '@/server/unsubscribe'

/** Días que se frenan los avisos mientras quien cobra confirma el pago. */
export const CLAIM_PAUSE_DAYS = 3

/**
 * "Ya pagué" desde el aviso: NO marca el pago (eso lo confirma quien cobra).
 * Frena los avisos de ese cobro unos días y le avisa a quien cobra por email.
 */
export async function claimPaid(formData: FormData): Promise<void> {
  const token = String(formData.get('t') ?? '')
  const chargeId = verifyPaidClaimToken(token)
  if (!chargeId) redirect('/ya-pague?error=link')

  const db = createAdminClient()
  const { data: c } = await db.from('charges')
    .select('id, org_id, customer_id, concept, amount_minor, currency, state, promised_for, customers(name), organizations(name, timezone)')
    .eq('id', chargeId).maybeSingle()
  if (!c) redirect('/ya-pague?error=link')
  if (c.state !== 'open') redirect(`/ya-pague?t=${encodeURIComponent(token)}&listo=1`)

  const org = (Array.isArray(c.organizations) ? c.organizations[0] : c.organizations) as { name: string; timezone: string }
  const customer = (Array.isArray(c.customers) ? c.customers[0] : c.customers) as { name: string }
  const today = todayIn(org.timezone)
  const until = addDays(today, CLAIM_PAUSE_DAYS)
  if (!c.promised_for || (c.promised_for as IsoDate) < until) {
    await db.from('charges').update({ promised_for: until, promised_on: today }).eq('id', c.id).eq('state', 'open')
  }

  const { data: members } = await db.from('organization_members').select('user_id').eq('org_id', c.org_id).in('role', ['owner', 'admin'])
  const amount = formatMoneyClean(Number(c.amount_minor), c.currency as CurrencyCode)
  const link = `${siteUrl()}/app/clientes/${c.customer_id}`
  for (const m of members ?? []) {
    const { data: u } = await db.auth.admin.getUserById(m.user_id as string)
    const to = u.user?.email
    if (!to || isTestAddress(to)) continue
    const title = `${customer.name} dice que ya te pagó`
    await sendEmail({
      to,
      subject: `${title} · ${c.concept}`,
      text: `${title}: ${c.concept} por ${amount}.\n\nFijate si te llegó y marcalo como pagado en Cobra+: ${link}\nMientras tanto frenamos los avisos de ese cobro ${CLAIM_PAUSE_DAYS} días.`,
      html: emailLayout({
        preheader: escapeHtml(`${c.concept} por ${amount}`),
        header: 'cobra',
        heading: escapeHtml(title),
        body: p(`${mark(`<b>${escapeHtml(customer.name)}</b>`)} tocó "Ya pagué" en el aviso de <b>${escapeHtml(c.concept as string)}</b> por <b>${escapeHtml(amount)}</b>.`)
          + p('Fijate si te llegó la plata y, si está, marcalo como pagado. Mientras tanto frenamos los avisos de ese cobro ' + CLAIM_PAUSE_DAYS + ' días.')
          + button(link, 'Ver y marcar el pago'),
        footer: p('Te llega porque un cliente avisó que pagó un cobro de tu empresa en Cobra+.', { muted: true, size: 12.5 }),
      }),
      idempotencyKey: `yapague-${c.id}-${today}`,
    })
  }
  redirect(`/ya-pague?t=${encodeURIComponent(token)}&listo=1`)
}
