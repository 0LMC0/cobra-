import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { chargeStatus, type ChargeStatus, type StoredChargeState } from '@/domain/charge-status'
import type { IsoDate } from '@/domain/dates'
import type { CurrencyCode } from '@/domain/money'
import { MONTHLY_REMINDERS, type PlanTier } from '@/config/plans'
import { effectivePlan } from '@/domain/plan-status'
import { monthStart } from '@/domain/quota'
import { buildTimeline, type TimelineEvent } from '@/domain/timeline'
import { homeTotals, remindersForToday, type HomeCharge, type HomeCustomer, type HomePayment, type HomeReminder, type HomeTotals } from '@/domain/home'

/** Lecturas del producto. Todas pasan por la sesión del usuario: la RLS filtra por empresa. */

export type ChargeView = {
  id: string
  customerId: string
  concept: string
  amountMinor: number
  currency: CurrencyCode
  dueDate: IsoDate
  state: StoredChargeState
  paidMinor: number
  balanceMinor: number
  status: ChargeStatus
  promisedFor: IsoDate | null
  promisedOn: IsoDate | null
  recurring: boolean
}

export type CustomerView = {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  whatsappNumber: string | null
  whatsappOk: boolean
  notes: string | null
  taxId: string | null
  /** Pidió no recibir avisos automáticos (link de baja del email). */
  optedOut: boolean
  /** Quien cobra pausó los avisos a este cliente. */
  remindersPaused: boolean
  archived: boolean
  createdAt: string
  /** Lo que debe, separado por moneda (nunca se suman monedas). */
  owed: { currency: CurrencyCode; balanceMinor: number }[]
  overdueCount: number
}

type ChargeRow = {
  id: string; customer_id: string; concept: string; amount_minor: number | string; currency: string
  due_date: string; state: StoredChargeState; promised_for: string | null; promised_on: string | null; agreement_id: string | null
}

async function loadCharges(orgId: string, today: IsoDate, customerId?: string): Promise<ChargeView[]> {
  const supabase = await createClient()
  let query = supabase
    .from('charges')
    .select('id, customer_id, concept, amount_minor, currency, due_date, state, promised_for, promised_on, agreement_id')
    .eq('org_id', orgId)
    .neq('state', 'cancelled')
    .order('due_date', { ascending: true })
  if (customerId) query = query.eq('customer_id', customerId)
  const { data: charges, error } = await query
  if (error) throw new Error('No pudimos cargar los cobros.')
  if (!charges?.length) return []

  const { data: balances, error: balError } = await supabase
    .from('charge_balances')
    .select('charge_id, paid_minor, balance_minor')
    .in('charge_id', charges.map((c) => c.id))
  if (balError) throw new Error('No pudimos calcular los saldos.')
  const byId = new Map((balances ?? []).map((b) => [b.charge_id as string, b]))

  return (charges as ChargeRow[]).map((c) => {
    const b = byId.get(c.id)
    const amountMinor = Number(c.amount_minor)
    const paidMinor = Number(b?.paid_minor ?? 0)
    return {
      id: c.id,
      customerId: c.customer_id,
      concept: c.concept,
      amountMinor,
      currency: c.currency as CurrencyCode,
      dueDate: c.due_date,
      state: c.state,
      paidMinor,
      balanceMinor: Math.max(0, amountMinor - paidMinor),
      status: chargeStatus({ state: c.state, totalMinor: amountMinor, paidMinor, dueDate: c.due_date }, today),
      promisedFor: c.promised_for,
      promisedOn: c.promised_on,
      recurring: Boolean(c.agreement_id),
    }
  })
}

function summarize(charges: ChargeView[]) {
  const owed = new Map<CurrencyCode, number>()
  let overdueCount = 0
  for (const c of charges) {
    if (c.balanceMinor > 0 && c.state === 'open') owed.set(c.currency, (owed.get(c.currency) ?? 0) + c.balanceMinor)
    if (c.status === 'overdue') overdueCount += 1
  }
  return { owed: [...owed].map(([currency, balanceMinor]) => ({ currency, balanceMinor })), overdueCount }
}

type CustomerRow = {
  id: string; name: string; contact_name: string | null; email: string | null; phone: string | null
  whatsapp_number: string | null; whatsapp_ok: boolean; notes: string | null; contact_opt_out: boolean
  tax_id: string | null; status: 'active' | 'archived'; reminders_paused: boolean; created_at: string
}

function toCustomer(r: CustomerRow, charges: ChargeView[]): CustomerView {
  return {
    id: r.id, name: r.name, contactName: r.contact_name, email: r.email, phone: r.phone,
    whatsappNumber: r.whatsapp_number, whatsappOk: r.whatsapp_ok, notes: r.notes, optedOut: Boolean(r.contact_opt_out),
    taxId: r.tax_id, remindersPaused: Boolean(r.reminders_paused), archived: r.status === 'archived', createdAt: r.created_at,
    ...summarize(charges.filter((c) => c.customerId === r.id)),
  }
}

const CUSTOMER_FIELDS = 'id, name, contact_name, email, phone, whatsapp_number, whatsapp_ok, notes, contact_opt_out, tax_id, status, reminders_paused, created_at'

/** Clientes activos (o los archivados, si se piden). La búsqueda se hace en src/domain/customer-filter.ts. */
export async function listCustomers(orgId: string, today: IsoDate, opts: { archived?: boolean } = {}): Promise<CustomerView[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .select(CUSTOMER_FIELDS)
    .eq('org_id', orgId)
    .eq('status', opts.archived ? 'archived' : 'active')
    .order('name', { ascending: true })
  if (error) throw new Error('No pudimos cargar los clientes.')
  const charges = await loadCharges(orgId, today)
  return ((data ?? []) as CustomerRow[]).map((r) => toCustomer(r, charges))
}

/** Cuántos clientes archivados tiene la empresa (para ofrecer verlos aunque no haya activos). */
export async function countArchivedCustomers(orgId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase.from('customers').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'archived')
  return count ?? 0
}

export async function getCustomer(orgId: string, customerId: string, today: IsoDate): Promise<{ customer: CustomerView; charges: ChargeView[] } | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('customers').select(CUSTOMER_FIELDS).eq('org_id', orgId).eq('id', customerId).maybeSingle()
  if (error) throw new Error('No pudimos cargar el cliente.')
  if (!data) return null
  const charges = await loadCharges(orgId, today, customerId)
  return { customer: toCustomer(data as CustomerRow, charges), charges }
}

/* ───────────── Inicio ───────────── */

export type HomeData = {
  totals: HomeTotals
  reminders: HomeReminder[]
  transferAlias: string | null
}

/** Totales del mes y avisos de hoy, con los datos reales de la empresa. */
export async function getHomeData(orgId: string, currency: CurrencyCode, today: IsoDate): Promise<HomeData> {
  const supabase = await createClient()
  const monthStart = `${today.slice(0, 7)}-01`
  const [charges, customersRes, paymentsRes, orgRes, sentRes] = await Promise.all([
    loadCharges(orgId, today),
    supabase.from('customers').select('id, name, contact_name, email, phone, whatsapp_ok, contact_opt_out, reminders_paused').eq('org_id', orgId).eq('status', 'active'),
    supabase.from('payments').select('amount_minor, currency, paid_on').eq('org_id', orgId).eq('status', 'confirmed').gte('paid_on', monthStart),
    supabase.from('organizations').select('reminders_enabled, transfer_alias').eq('id', orgId).single(),
    supabase.from('reminder_deliveries').select('charge_id, step_id').eq('org_id', orgId).eq('send_on', today).eq('status', 'sent'),
  ])
  if (customersRes.error || paymentsRes.error || orgRes.error || sentRes.error) throw new Error('No pudimos cargar el inicio.')

  const open = charges.filter((c) => c.state === 'open')
  const homeCharges: HomeCharge[] = open.map((c) => ({
    id: c.id, customerId: c.customerId, concept: c.concept, amountMinor: c.amountMinor, balanceMinor: c.balanceMinor,
    currency: c.currency, dueDate: c.dueDate, promisedFor: c.promisedFor, promisedOn: c.promisedOn,
  }))
  const customers: HomeCustomer[] = (customersRes.data ?? []).map((r) => ({
    id: r.id as string, name: r.name as string, contactName: r.contact_name as string | null, email: r.email as string | null,
    phone: r.phone as string | null, whatsappOk: Boolean(r.whatsapp_ok), optOut: Boolean(r.contact_opt_out), paused: Boolean(r.reminders_paused),
  }))
  const payments: HomePayment[] = (paymentsRes.data ?? []).map((p) => ({
    amountMinor: Number(p.amount_minor), currency: p.currency as CurrencyCode, paidOn: p.paid_on as IsoDate,
  }))

  return {
    totals: homeTotals({ charges: homeCharges, payments, currency, today, hasAnyCharge: charges.length > 0 }),
    reminders: remindersForToday({
      charges: homeCharges, customers, today,
      remindersEnabled: Boolean(orgRes.data?.reminders_enabled),
      sent: new Set((sentRes.data ?? []).map((d) => `${d.charge_id}:${d.step_id}`)),
    }),
    transferAlias: (orgRes.data?.transfer_alias as string | null) ?? null,
  }
}

/* ───────────── Cobros ───────────── */

export type ChargeListItem = ChargeView & { customerName: string; customerWhatsapp: string | null; customerContact: string | null }

/** Todos los cobros de la empresa con el nombre de su cliente. */
export async function listCharges(orgId: string, today: IsoDate): Promise<ChargeListItem[]> {
  const supabase = await createClient()
  const [charges, { data, error }] = await Promise.all([
    loadCharges(orgId, today),
    supabase.from('customers').select('id, name, contact_name, whatsapp_number, whatsapp_ok').eq('org_id', orgId),
  ])
  if (error) throw new Error('No pudimos cargar los clientes.')
  const byId = new Map((data ?? []).map((c) => [c.id as string, c]))
  return charges.map((c) => {
    const k = byId.get(c.customerId)
    return {
      ...c,
      customerName: (k?.name as string | undefined) ?? 'Cliente',
      customerContact: (k?.contact_name as string | null | undefined) ?? null,
      customerWhatsapp: k?.whatsapp_ok && k.whatsapp_number ? `+${k.whatsapp_number as string}` : null,
    }
  })
}

/* ───────────── Historial del cliente ───────────── */

/** Todo lo que pasó con un cliente, de lo más nuevo a lo más viejo. */
export async function getCustomerTimeline(orgId: string, customer: { id: string; createdAt: string }): Promise<TimelineEvent[]> {
  const supabase = await createClient()
  const { data: charges, error: chError } = await supabase
    .from('charges')
    .select('id, concept, amount_minor, currency, due_date, created_at, created_by, agreement_id')
    .eq('org_id', orgId)
    .eq('customer_id', customer.id)
  if (chError) throw new Error('No pudimos cargar el historial.')
  const chargeIds = (charges ?? []).map((c) => c.id as string)

  const [paymentsRes, deliveriesRes, auditsRes] = await Promise.all([
    supabase.from('payments').select('id, amount_minor, currency, paid_on, method, status, voided_reason, created_at').eq('org_id', orgId).eq('customer_id', customer.id),
    chargeIds.length
      ? supabase.from('reminder_deliveries').select('id, charge_id, step_id, status, last_error, sent_at, created_at').eq('org_id', orgId).in('charge_id', chargeIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, before, after, created_at')
      .eq('org_id', orgId)
      .in('entity_id', [customer.id, ...chargeIds])
      .order('id', { ascending: false })
      .limit(300),
  ])
  if (paymentsRes.error || deliveriesRes.error || auditsRes.error) throw new Error('No pudimos cargar el historial.')

  return buildTimeline({
    customer,
    charges: (charges ?? []).map((c) => ({
      id: c.id as string, concept: c.concept as string, amountMinor: Number(c.amount_minor), currency: c.currency as CurrencyCode,
      dueDate: c.due_date as IsoDate, createdAt: c.created_at as string,
      // Lo generó el proceso diario (sin persona) a partir de un abono.
      generated: Boolean(c.agreement_id) && !c.created_by,
    })),
    payments: (paymentsRes.data ?? []).map((p) => ({
      id: p.id as string, amountMinor: Number(p.amount_minor), currency: p.currency as CurrencyCode, paidOn: p.paid_on as IsoDate,
      method: p.method as string, status: p.status as 'confirmed' | 'voided', voidedReason: p.voided_reason as string | null, createdAt: p.created_at as string,
    })),
    deliveries: (deliveriesRes.data ?? []).map((d) => ({
      id: d.id as string, chargeId: d.charge_id as string, stepId: d.step_id as string, status: d.status as string, reason: d.last_error as string | null,
      sentAt: d.sent_at as string | null, createdAt: d.created_at as string,
    })),
    audits: (auditsRes.data ?? []).map((a) => ({
      id: a.id as number, action: a.action as string, entityType: a.entity_type as string, entityId: a.entity_id as string,
      before: a.before as Record<string, unknown> | null, after: a.after as Record<string, unknown> | null, createdAt: a.created_at as string,
    })),
  })
}

/* ───────────── Pagos (para exportar) ───────────── */

export type PaymentListItem = {
  customerName: string; paidOn: IsoDate; currency: CurrencyCode; amountMinor: number; method: string
  reference: string | null; status: 'confirmed' | 'voided'; voidedReason: string | null; createdAt: string
}

export async function listPayments(orgId: string): Promise<PaymentListItem[]> {
  const supabase = await createClient()
  const [paymentsRes, customersRes] = await Promise.all([
    supabase.from('payments').select('customer_id, paid_on, currency, amount_minor, method, reference, status, voided_reason, created_at').eq('org_id', orgId),
    supabase.from('customers').select('id, name').eq('org_id', orgId),
  ])
  if (paymentsRes.error || customersRes.error) throw new Error('No pudimos cargar los pagos.')
  const names = new Map((customersRes.data ?? []).map((c) => [c.id as string, c.name as string]))
  return (paymentsRes.data ?? []).map((p) => ({
    customerName: names.get(p.customer_id as string) ?? 'Cliente',
    paidOn: p.paid_on as IsoDate, currency: p.currency as CurrencyCode, amountMinor: Number(p.amount_minor), method: p.method as string,
    reference: p.reference as string | null, status: p.status as 'confirmed' | 'voided', voidedReason: p.voided_reason as string | null,
    createdAt: p.created_at as string,
  }))
}

/* ───────────── Plan y uso del mes ───────────── */

export type PlanUsage = { plan: PlanTier; limit: number | null; used: number; held: number; monthLabel: string }

/** Sólo el plan vigente (para candados en la interfaz). */
export async function getOrgPlan(orgId: string): Promise<PlanTier> {
  const supabase = await createClient()
  const { data } = await supabase.from('subscriptions').select('plan, status, current_period_end').eq('org_id', orgId).maybeSingle()
  return effectivePlan(data ? { plan: data.plan as string, status: data.status as string, currentPeriodEnd: data.current_period_end as string | null } : null)
}

/** Plan vigente y cuántos avisos automáticos salieron este mes. */
export async function getPlanUsage(orgId: string, today: IsoDate): Promise<PlanUsage> {
  const supabase = await createClient()
  const [subRes, usageRes, heldRes] = await Promise.all([
    supabase.from('subscriptions').select('plan, status, current_period_end').eq('org_id', orgId).maybeSingle(),
    supabase.from('reminder_deliveries').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('channel', 'email').in('status', ['sent', 'queued']).gte('send_on', monthStart(today)),
    supabase.from('reminder_deliveries').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'skipped').eq('last_error', 'plan_limit').gte('send_on', monthStart(today)),
  ])
  const sub = subRes.data ? { plan: subRes.data.plan as string, status: subRes.data.status as string, currentPeriodEnd: subRes.data.current_period_end as string | null } : null
  const plan = effectivePlan(sub)
  return {
    plan,
    limit: MONTHLY_REMINDERS[plan],
    used: usageRes.count ?? 0,
    held: heldRes.count ?? 0,
    monthLabel: new Intl.DateTimeFormat('es-AR', { month: 'long', timeZone: 'UTC' }).format(new Date(`${today}T12:00:00Z`)),
  }
}
