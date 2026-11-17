import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { chargeStatus, type ChargeStatus, type StoredChargeState } from '@/domain/charge-status'
import type { IsoDate } from '@/domain/dates'
import type { CurrencyCode } from '@/domain/money'

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
  /** Lo que debe, separado por moneda (nunca se suman monedas). */
  owed: { currency: CurrencyCode; balanceMinor: number }[]
  overdueCount: number
}

type ChargeRow = {
  id: string; customer_id: string; concept: string; amount_minor: number | string; currency: string
  due_date: string; state: StoredChargeState; promised_for: string | null; agreement_id: string | null
}

async function loadCharges(orgId: string, today: IsoDate, customerId?: string): Promise<ChargeView[]> {
  const supabase = await createClient()
  let query = supabase
    .from('charges')
    .select('id, customer_id, concept, amount_minor, currency, due_date, state, promised_for, agreement_id')
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
  whatsapp_number: string | null; whatsapp_ok: boolean; notes: string | null
}

function toCustomer(r: CustomerRow, charges: ChargeView[]): CustomerView {
  return {
    id: r.id, name: r.name, contactName: r.contact_name, email: r.email, phone: r.phone,
    whatsappNumber: r.whatsapp_number, whatsappOk: r.whatsapp_ok, notes: r.notes,
    ...summarize(charges.filter((c) => c.customerId === r.id)),
  }
}

const CUSTOMER_FIELDS = 'id, name, contact_name, email, phone, whatsapp_number, whatsapp_ok, notes'

export async function listCustomers(orgId: string, today: IsoDate): Promise<CustomerView[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .select(CUSTOMER_FIELDS)
    .eq('org_id', orgId)
    .eq('status', 'active')
    .order('name', { ascending: true })
  if (error) throw new Error('No pudimos cargar los clientes.')
  const charges = await loadCharges(orgId, today)
  return ((data ?? []) as CustomerRow[]).map((r) => toCustomer(r, charges))
}

export async function getCustomer(orgId: string, customerId: string, today: IsoDate): Promise<{ customer: CustomerView; charges: ChargeView[] } | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('customers').select(CUSTOMER_FIELDS).eq('org_id', orgId).eq('id', customerId).maybeSingle()
  if (error) throw new Error('No pudimos cargar el cliente.')
  if (!data) return null
  const charges = await loadCharges(orgId, today, customerId)
  return { customer: toCustomer(data as CustomerRow, charges), charges }
}
