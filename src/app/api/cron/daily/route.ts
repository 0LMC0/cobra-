import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailConfigured, sendEmail } from '@/server/email/mailer'
import { planDailyEmails, type PlanCharge, type PlanCustomer, type PlanMember, type PlanOrg } from '@/domain/daily-plan'
import { todayIn, type Frequency } from '@/domain/dates'
import { periodsToGenerate } from '@/domain/agreements'
import type { DigestFrequency } from '@/domain/digest'
import type { CurrencyCode } from '@/domain/money'
import { siteUrl } from '@/config/env'
import { MONTHLY_REMINDERS } from '@/config/plans'
import { effectivePlan } from '@/domain/plan-status'
import { monthStart, remainingReminders } from '@/domain/quota'
import { paidClaimToken, unsubscribeToken } from '@/server/unsubscribe'
import { isTestAddress } from '@/domain/email-address'
import { needsNudge, nudgeEmail } from '@/domain/onboarding-nudge'
import { ownerReportEmail } from '@/domain/owner-report'
import { formatDate } from '@/domain/dates'

/** Intentos por aviso: si una corrida falla, otra corrida del mismo día lo reintenta. */
const MAX_ATTEMPTS = 3

/**
 * Proceso diario (Vercel Cron, ver vercel.json): recordatorios a los clientes
 * y resumen para quien cobra. Protegido con CRON_SECRET. Es idempotente:
 * correrlo dos veces el mismo día no repite ningún email.
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Manda los emails de a uno (con reintentos): con muchas empresas tarda. 60 s es el máximo del plan Hobby de Vercel.
export const maxDuration = 60

/** Crea los cobros de los abonos activos que vencen dentro de la semana. Devuelve cuántos creó. */
async function generateAgreementCharges(db: ReturnType<typeof createAdminClient>): Promise<number> {
  const [orgsRes, agreementsRes] = await Promise.all([
    db.from('organizations').select('id, timezone'),
    db.from('agreements')
      .select('id, org_id, customer_id, name, amount_minor, currency, frequency, next_charge_date, end_date')
      .eq('status', 'active')
      .not('next_charge_date', 'is', null),
  ])
  if (orgsRes.error || agreementsRes.error) return 0
  const tz = new Map((orgsRes.data ?? []).map((o) => [o.id as string, o.timezone as string]))
  let created = 0
  for (const a of agreementsRes.data ?? []) {
    const today = todayIn(tz.get(a.org_id) ?? 'America/Argentina/Buenos_Aires')
    const { periods, nextChargeDate } = periodsToGenerate(
      { id: a.id, name: a.name, frequency: a.frequency as Frequency, nextChargeDate: a.next_charge_date, endDate: a.end_date },
      today,
    )
    if (periods.length === 0 && nextChargeDate === a.next_charge_date) continue
    if (periods.length) {
      const { data, error } = await db
        .from('charges')
        .upsert(
          periods.map((p) => ({
            org_id: a.org_id, customer_id: a.customer_id, agreement_id: a.id, concept: p.concept,
            amount_minor: a.amount_minor, currency: a.currency, due_date: p.dueDate, period_start: p.periodStart,
          })),
          { onConflict: 'agreement_id,period_start', ignoreDuplicates: true },
        )
        .select('id')
      if (error) continue
      created += data?.length ?? 0
    }
    // Sólo avanza si nadie lo movió en el medio.
    await db.from('agreements')
      .update({ next_charge_date: nextChargeDate, ...(nextChargeDate ? {} : { status: 'ended' }) })
      .eq('id', a.id)
      .eq('next_charge_date', a.next_charge_date)
  }
  return created
}

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const got = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret}`)
  return got.length === want.length && timingSafeEqual(got, want)
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const db = createAdminClient()

  // 1) Abonos: primero se generan los cobros que tocan, así ya entran en los avisos de hoy.
  const generated = await generateAgreementCharges(db)

  const [orgsRes, customersRes, chargesRes, membersRes] = await Promise.all([
    db.from('organizations').select('id, name, timezone, reminders_enabled, transfer_alias, reply_to_email'),
    db.from('customers').select('id, org_id, name, contact_name, email, contact_opt_out, reminders_paused').eq('status', 'active'),
    db.from('charges').select('id, org_id, customer_id, concept, amount_minor, currency, due_date, promised_for, promised_on').eq('state', 'open'),
    db.from('organization_members').select('org_id, user_id, role, digest_frequency, digest_last_sent_on').in('role', ['owner', 'admin']),
  ])
  if ([orgsRes, customersRes, chargesRes, membersRes].some((r) => r.error)) {
    return NextResponse.json({ error: 'No se pudieron leer los datos' }, { status: 500 })
  }

  const chargeIds = (chargesRes.data ?? []).map((c) => c.id as string)
  let balanceRows: { charge_id: string; balance_minor: number | string }[] = []
  let sentRows: { id: string; charge_id: string; step_id: string; status: string; attempts: number }[] = []
  if (chargeIds.length) {
    const [b, s] = await Promise.all([
      db.from('charge_balances').select('charge_id, balance_minor').in('charge_id', chargeIds),
      db.from('reminder_deliveries').select('id, charge_id, step_id, status, attempts').in('charge_id', chargeIds).eq('channel', 'email'),
    ])
    balanceRows = b.data ?? []
    sentRows = s.data ?? []
  }
  const balance = new Map(balanceRows.map((b) => [b.charge_id, Number(b.balance_minor)]))

  // Plan de cada empresa y avisos ya usados este mes (Gratis: 10 por mes).
  const todays = new Map((orgsRes.data ?? []).map((o) => [o.id as string, todayIn(o.timezone)]))
  const earliestMonth = [...todays.values()].map(monthStart).sort()[0] ?? monthStart(todayIn('America/Argentina/Buenos_Aires'))
  const [subsRes, usageRes] = await Promise.all([
    db.from('subscriptions').select('org_id, plan, status, current_period_end'),
    db.from('reminder_deliveries').select('org_id, send_on').eq('channel', 'email').in('status', ['sent', 'queued']).gte('send_on', earliestMonth),
  ])
  if (subsRes.error || usageRes.error) return NextResponse.json({ error: 'No se pudieron leer los planes' }, { status: 500 })
  const subs = new Map((subsRes.data ?? []).map((x) => [x.org_id as string, { plan: x.plan as string, status: x.status as string, currentPeriodEnd: x.current_period_end as string | null }]))
  const usedThisMonth = (orgId: string) => {
    const start = monthStart(todays.get(orgId)!)
    return (usageRes.data ?? []).filter((d) => d.org_id === orgId && (d.send_on as string) >= start).length
  }

  const orgs: PlanOrg[] = (orgsRes.data ?? []).map((o) => ({
    id: o.id, name: o.name, today: todays.get(o.id)!, remindersEnabled: o.reminders_enabled,
    transferAlias: o.transfer_alias, replyTo: o.reply_to_email,
    remainingReminders: remainingReminders(MONTHLY_REMINDERS[effectivePlan(subs.get(o.id) ?? null)], usedThisMonth(o.id)),
  }))
  const customers: PlanCustomer[] = (customersRes.data ?? []).map((c) => ({
    id: c.id, orgId: c.org_id, name: c.name, contactName: c.contact_name, email: c.email, optOut: c.contact_opt_out, paused: c.reminders_paused,
  }))
  const charges: PlanCharge[] = (chargesRes.data ?? []).map((c) => ({
    id: c.id, orgId: c.org_id, customerId: c.customer_id, concept: c.concept, amountMinor: Number(c.amount_minor),
    balanceMinor: balance.get(c.id) ?? Number(c.amount_minor), currency: c.currency as CurrencyCode, dueDate: c.due_date,
    promisedFor: c.promised_for, promisedOn: c.promised_on,
  }))

  // Email y nombre de quienes reciben el resumen (dueños y administración).
  const members: PlanMember[] = []
  for (const m of membersRes.data ?? []) {
    const { data } = await db.auth.admin.getUserById(m.user_id)
    const email = data.user?.email
    if (!email) continue
    const fullName = (data.user?.user_metadata?.full_name as string | undefined) ?? null
    members.push({
      orgId: m.org_id, userId: m.user_id, email, firstName: fullName?.split(' ')[0] ?? null,
      frequency: m.digest_frequency as DigestFrequency, lastSentOn: m.digest_last_sent_on,
    })
  }

  const plan = planDailyEmails({
    orgs, customers, charges, members,
    // Un aviso fallido no cuenta como enviado mientras le queden intentos.
    alreadySent: new Set(sentRows.filter((s) => !(s.status === 'failed' && s.attempts < MAX_ATTEMPTS)).map((s) => `${s.charge_id}:${s.step_id}`)),
    appUrl: siteUrl(),
    unsubscribeUrlFor: (customerId) => `${siteUrl()}/baja?t=${unsubscribeToken(customerId)}`,
    paidUrlFor: (chargeId) => `${siteUrl()}/ya-pague?t=${paidClaimToken(chargeId)}`,
  })

  if (!emailConfigured()) {
    return NextResponse.json({ dryRun: true, generatedCharges: generated, reminders: plan.reminders.length, digests: plan.digests.length, heldByPlanLimit: plan.held, note: 'Falta RESEND_API_KEY o EMAIL_FROM: no se envió nada.' })
  }

  let sent = 0
  let failed = 0
  const failedByKey = new Map(sentRows.filter((s) => s.status === 'failed').map((s) => [`${s.charge_id}:${s.step_id}`, s]))
  for (const r of plan.reminders) {
    // Direcciones de prueba (@algo.example, .test): no existen. Se registran como salteadas, sin intentar.
    if (isTestAddress(r.to)) {
      await db.from('reminder_deliveries').upsert(
        { org_id: r.orgId, charge_id: r.chargeId, step_id: r.stepId, channel: 'email', send_on: r.sendOn, recipient: r.to, status: 'skipped', last_error: 'test_address' },
        { onConflict: 'charge_id,step_id,channel', ignoreDuplicates: true },
      )
      continue
    }
    // Primero se reserva el aviso: si otra ejecución ya lo tomó, no se manda.
    let id: string | undefined
    const prev = failedByKey.get(`${r.chargeId}:${r.stepId}`)
    if (prev) {
      // Reintento: sólo si nadie lo tomó en el medio (mismo estado y mismos intentos).
      const { data: retried } = await db
        .from('reminder_deliveries')
        .update({ status: 'queued', attempts: prev.attempts + 1 })
        .eq('id', prev.id)
        .eq('status', 'failed')
        .eq('attempts', prev.attempts)
        .select('id')
      id = retried?.[0]?.id
    } else {
      const { data: claimed } = await db
        .from('reminder_deliveries')
        .upsert(
          { org_id: r.orgId, charge_id: r.chargeId, step_id: r.stepId, channel: 'email', send_on: r.sendOn, recipient: r.to, status: 'queued', attempts: 1 },
          { onConflict: 'charge_id,step_id,channel', ignoreDuplicates: true },
        )
        .select('id')
      id = claimed?.[0]?.id
    }
    if (!id) continue
    const res = await sendEmail({ to: r.to, ...r.email, replyTo: r.replyTo, fromName: r.fromName, listUnsubscribeUrl: r.unsubscribeUrl?.replace('/baja?', '/api/baja?'), idempotencyKey: `aviso-${id}` })
    await db
      .from('reminder_deliveries')
      .update(res.ok
        ? { status: 'sent', provider_message_id: res.id, sent_at: new Date().toISOString(), last_error: null }
        : { status: 'failed', last_error: res.error })
      .eq('id', id)
    if (res.ok) sent += 1
    else failed += 1
  }

  // Los que no salieron por el tope del plan quedan registrados como 'skipped':
  // así se ven en el historial y en el uso del mes, y no se reintentan.
  if (plan.heldItems.length) {
    await db.from('reminder_deliveries').upsert(
      plan.heldItems.map((r) => ({
        org_id: r.orgId, charge_id: r.chargeId, step_id: r.stepId, channel: 'email', send_on: r.sendOn,
        recipient: r.to, status: 'skipped', last_error: 'plan_limit',
      })),
      { onConflict: 'charge_id,step_id,channel', ignoreDuplicates: true },
    )
  }

  let digests = 0
  for (const d of plan.digests) {
    if (isTestAddress(d.to)) continue // cuentas de prueba: no se manda ni se cuenta como error
    // Igual con el resumen: se marca el día antes de mandarlo, así no sale dos veces.
    const { data: claimed } = await db
      .from('organization_members')
      .update({ digest_last_sent_on: d.sendOn })
      .eq('org_id', d.orgId)
      .eq('user_id', d.userId)
      .or(`digest_last_sent_on.is.null,digest_last_sent_on.lt.${d.sendOn}`)
      .select('user_id')
    if (!claimed?.length) continue
    const res = await sendEmail({ to: d.to, ...d.email })
    if (res.ok) digests += 1
    else failed += 1
  }

  // Un solo recordatorio a quien se registró y no terminó de configurar (entre 1 y 4 días después).
  let nudges = 0
  const now = new Date()
  const { data: fresh } = await db.from('organizations')
    .select('id, onboarding_step, created_at, onboarding_nudged_at')
    .is('onboarding_nudged_at', null)
    .gte('created_at', new Date(now.getTime() - 96 * 3_600_000).toISOString())
  for (const o of fresh ?? []) {
    if (!needsNudge({ onboardingStep: o.onboarding_step as string, createdAt: o.created_at as string, nudgedAt: null }, now)) continue
    const owner = (membersRes.data ?? []).find((m) => m.org_id === o.id && m.role === 'owner')
    if (!owner) continue
    const { data: claimed } = await db.from('organizations').update({ onboarding_nudged_at: now.toISOString() })
      .eq('id', o.id).is('onboarding_nudged_at', null).select('id')
    if (!claimed?.length) continue
    const { data: u } = await db.auth.admin.getUserById(owner.user_id)
    const email = u.user?.email
    if (!email || isTestAddress(email)) continue
    const firstName = ((u.user?.user_metadata?.full_name as string | undefined) ?? '').split(' ')[0] || null
    const res = await sendEmail({ to: email, ...nudgeEmail(o.onboarding_step as 'first_customer', { firstName, appUrl: siteUrl() }), idempotencyKey: `empujon-${o.id}` })
    if (res.ok) nudges += 1
  }

  // Parte diario para PrimerosPrecios (una vez por día: lo marca la idempotencia de Resend).
  const owner = process.env.OWNER_NOTIFY_EMAIL
  if (owner) {
    const since = new Date(now.getTime() - 24 * 3_600_000).toISOString()
    const head = { count: 'exact' as const, head: true }
    const [u, o, ot, paid, rem, errs, reqs] = await Promise.all([
      db.from('profiles').select('id', head).gte('created_at', since),
      db.from('organizations').select('id', head).gte('created_at', since),
      db.from('organizations').select('id', head),
      db.from('subscriptions').select('org_id', head).eq('status', 'active'),
      db.from('reminder_deliveries').select('id', head).eq('status', 'sent').gte('sent_at', since),
      db.from('app_errors').select('id', head).gte('at', since),
      db.from('consumer_requests').select('id', head).eq('status', 'pendiente'),
    ])
    const today = todayIn('America/Argentina/Buenos_Aires')
    const report = ownerReportEmail({
      newUsers: u.count ?? 0, newOrgs: o.count ?? 0, totalOrgs: ot.count ?? 0, activePaid: paid.count ?? 0,
      remindersSent: rem.count ?? 0, errors: errs.count ?? 0, pendingRequests: reqs.count ?? 0,
    }, formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' }), siteUrl())
    await sendEmail({ to: owner, ...report, idempotencyKey: `parte-${today}` })
  }

  return NextResponse.json({ generatedCharges: generated, reminders: sent, heldByPlanLimit: plan.held, digests, nudges, failed })
}
