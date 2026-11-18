'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthorizationError, authorize, type OrgContext } from '@/server/auth'
import { chargeSchema, customerSchema, paymentSchema, promiseSchema } from '@/domain/forms'
import { addMonths, formatDate, todayIn } from '@/domain/dates'
import { hasRole } from '@/domain/roles'
import { customerLimitReached } from '@/server/queries'
import type { FormState } from './form-state'

/** Acciones del producto: clientes, cobros y pagos. La RLS vuelve a verificar todo. */

async function guard(): Promise<OrgContext | FormState> {
  try {
    return await authorize('operator')
  } catch (e) {
    return { error: e instanceof AuthorizationError ? e.message : 'No pudimos verificar tu sesión.' }
  }
}
const isState = (v: OrgContext | FormState): v is FormState => !('org' in v)

/** Avanza el checklist del inicio. Sólo administración puede editar la empresa. */
async function advanceOnboarding(ctx: OrgContext, from: string, to: string) {
  if (ctx.org.onboarding_step !== from || !hasRole(ctx.role, 'admin')) return
  const supabase = await createClient()
  await supabase.from('organizations').update({ onboarding_step: to }).eq('id', ctx.org.id).eq('onboarding_step', from)
}

export async function createCustomer(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await guard()
  if (isState(ctx)) return ctx
  const parsed = customerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data

  const limitError = await customerLimitReached(ctx.org.id)
  if (limitError) return { error: limitError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .insert({
      org_id: ctx.org.id, name: d.name, contact_name: d.contactName, email: d.email, phone: d.phone,
      whatsapp_number: d.whatsappNumber, whatsapp_ok: d.whatsappOk, tax_id: d.taxId, notes: d.notes, created_by: ctx.userId,
    })
    .select('id')
    .single()
  if (error || !data) {
    if (error?.message.includes('customers_active_email_uniq')) return { fieldErrors: { email: ['Ya tenés un cliente con ese email.'] } }
    if (error?.message.includes('customers_tax_id_uniq')) return { fieldErrors: { taxId: ['Ya tenés un cliente con ese CUIT.'] } }
    return { error: 'No pudimos guardar el cliente. Probá de nuevo.' }
  }
  await advanceOnboarding(ctx, 'first_customer', 'first_charge')
  revalidatePath('/app', 'layout')
  redirect(`/app/clientes/${data.id}?nuevo=1`)
}

export async function createCharge(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await guard()
  if (isState(ctx)) return ctx
  const parsed = chargeSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data
  const supabase = await createClient()

  let agreementId: string | null = null
  if (d.repeatMonthly) {
    const { data: agreement, error } = await supabase
      .from('agreements')
      .insert({
        org_id: ctx.org.id, customer_id: d.customerId, name: d.concept, amount_minor: d.amountMinor, currency: d.currency,
        frequency: 'monthly', start_date: d.dueDate, next_charge_date: addMonths(d.dueDate, 1), created_by: ctx.userId,
      })
      .select('id')
      .single()
    if (error || !agreement) return { error: 'No pudimos crear el abono. Probá de nuevo.' }
    agreementId = agreement.id
  }

  const { error } = await supabase.from('charges').insert({
    org_id: ctx.org.id, customer_id: d.customerId, agreement_id: agreementId, concept: d.concept,
    amount_minor: d.amountMinor, currency: d.currency, due_date: d.dueDate,
    period_start: agreementId ? d.dueDate : null, created_by: ctx.userId,
  })
  if (error) return { error: 'No pudimos crear el cobro. Probá de nuevo.' }

  await advanceOnboarding(ctx, 'first_charge', 'reminders')
  revalidatePath('/app', 'layout')
  return { ok: d.repeatMonthly ? 'Listo: el cobro quedó creado y se va a repetir todos los meses.' : 'Listo: el cobro quedó creado.' }
}

export async function recordPayment(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await guard()
  if (isState(ctx)) return ctx
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data
  const supabase = await createClient()

  const { data: charge } = await supabase.from('charges').select('customer_id').eq('org_id', ctx.org.id).eq('id', d.chargeId).maybeSingle()
  if (!charge) return { error: 'No encontramos ese cobro.' }

  const { error } = await supabase.rpc('record_payment', {
    p_org: ctx.org.id,
    p_customer: charge.customer_id,
    p_amount_minor: d.amountMinor,
    p_currency: d.currency,
    p_paid_on: d.paidOn,
    p_method: d.method,
    p_reference: d.reference ?? '',
    p_allocations: [{ charge_id: d.chargeId, amount_minor: d.amountMinor }],
    p_idempotency_key: d.idempotencyKey,
  })
  if (error) {
    if (error.message.includes('allocation_exceeds_charge')) return { fieldErrors: { amount: ['Es más de lo que debe en este cobro.'] } }
    return { error: 'No pudimos registrar el pago. Probá de nuevo.' }
  }
  revalidatePath('/app', 'layout')
  return { ok: d.partial ? 'Pago parcial registrado. El resto sigue pendiente.' : 'Pago registrado. Los avisos de este cobro se frenan.' }
}

/** Anota la fecha que el cliente prometió pagar: los avisos se frenan hasta ese día. */
export async function setPromise(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await guard()
  if (isState(ctx)) return ctx
  const today = todayIn(ctx.org.timezone)
  const parsed = promiseSchema(today).safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('charges')
    .update({ promised_for: parsed.data.promisedFor, promised_on: today })
    .eq('org_id', ctx.org.id)
    .eq('id', parsed.data.chargeId)
    .eq('state', 'open')
    .select('id')
  if (error || !data?.length) return { error: 'No pudimos anotar la promesa. Probá de nuevo.' }
  revalidatePath('/app', 'layout')
  return { ok: `Anotado. Cobra+ no le escribe hasta el ${formatDate(parsed.data.promisedFor, { day: 'numeric', month: 'long' })}; si ese día no pagó, le manda un recordatorio.` }
}

/** Saca la promesa: vuelven los avisos normales. */
export async function clearPromise(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await guard()
  if (isState(ctx)) return ctx
  const chargeId = String(formData.get('chargeId') ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(chargeId)) return { error: 'No encontramos ese cobro.' }
  const supabase = await createClient()
  const { error } = await supabase
    .from('charges')
    .update({ promised_for: null, promised_on: null })
    .eq('org_id', ctx.org.id)
    .eq('id', chargeId)
  if (error) return { error: 'No pudimos sacar la promesa. Probá de nuevo.' }
  revalidatePath('/app', 'layout')
  return { ok: 'Listo: vuelven los avisos normales.' }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Editar los datos de un cliente. El cambio queda en el historial (trigger en la base). */
export async function updateCustomer(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await guard()
  if (isState(ctx)) return ctx
  const customerId = String(formData.get('customerId') ?? '')
  if (!UUID_RE.test(customerId)) return { error: 'No encontramos ese cliente.' }
  const parsed = customerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .update({
      name: d.name, contact_name: d.contactName, email: d.email, phone: d.phone, whatsapp_number: d.whatsappNumber,
      whatsapp_ok: d.whatsappOk, tax_id: d.taxId, notes: d.notes, reminders_paused: d.remindersPaused,
    })
    .eq('org_id', ctx.org.id)
    .eq('id', customerId)
    .select('id')
  if (error) {
    if (error.message.includes('customers_active_email_uniq')) return { fieldErrors: { email: ['Ya tenés otro cliente con ese email.'] } }
    if (error.message.includes('customers_tax_id_uniq')) return { fieldErrors: { taxId: ['Ya tenés otro cliente con ese CUIT.'] } }
    return { error: 'No pudimos guardar los cambios. Probá de nuevo.' }
  }
  if (!data?.length) return { error: 'No encontramos ese cliente.' }
  revalidatePath('/app', 'layout')
  redirect(`/app/clientes/${customerId}?guardado=1`)
}

/** Archivar o reactivar. Archivar frena los avisos; lo que debe queda registrado. */
export async function setCustomerArchived(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await guard()
  if (isState(ctx)) return ctx
  const customerId = String(formData.get('customerId') ?? '')
  const archive = formData.get('archive') === '1'
  if (!UUID_RE.test(customerId)) return { error: 'No encontramos ese cliente.' }
  if (!archive) {
    const limitError = await customerLimitReached(ctx.org.id)
    if (limitError) return { error: limitError }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .update({ status: archive ? 'archived' : 'active' })
    .eq('org_id', ctx.org.id)
    .eq('id', customerId)
    .select('id')
  if (error) {
    if (error.message.includes('customers_active_email_uniq')) {
      return { error: 'Ya tenés otro cliente activo con el mismo email. Cambiale el email a uno de los dos y probá de nuevo.' }
    }
    return { error: archive ? 'No pudimos archivarlo. Probá de nuevo.' : 'No pudimos reactivarlo. Probá de nuevo.' }
  }
  if (!data?.length) return { error: 'No encontramos ese cliente.' }
  revalidatePath('/app', 'layout')
  return { ok: archive ? 'Cliente archivado. No le llegan más avisos.' : 'Cliente reactivado.' }
}
