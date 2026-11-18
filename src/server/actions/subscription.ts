'use server'

import { randomUUID } from 'node:crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { siteUrl } from '@/config/env'
import { PAID_PLANS, preapprovalRequest } from '@/domain/billing'
import { can } from '@/domain/roles'
import { createClient } from '@/lib/supabase/server'
import { AuthorizationError, authorize, type OrgContext } from '@/server/auth'
import { cancelPreapproval, createPreapproval, mercadoPagoConfigured, syncPreapproval } from '@/server/billing/mercadopago'
import type { PlanId } from '@/config/plans'
import type { FormState } from './form-state'

/** Contratar o cancelar el plan de Cobra+. Sólo dueños (billing.manage). */
async function owner(): Promise<OrgContext | FormState> {
  try {
    const ctx = await authorize('viewer')
    if (!can(ctx.role, 'billing.manage')) return { error: 'Sólo el dueño o la dueña de la cuenta puede cambiar el plan.' }
    return ctx
  } catch (e) {
    return { error: e instanceof AuthorizationError ? e.message : 'No pudimos verificar tu sesión.' }
  }
}
const isState = (v: OrgContext | FormState): v is FormState => !('org' in v)

/** Crea la suscripción en Mercado Pago y manda a la persona a pagar ahí. */
export async function startSubscription(_: FormState, formData: FormData): Promise<FormState> {
  const ctx = await owner()
  if (isState(ctx)) return ctx
  if (!mercadoPagoConfigured()) return { error: 'Los planes pagos todavía no están habilitados. Probá en unos días.' }

  const plan = String(formData.get('plan') ?? '') as PlanId
  const interval = formData.get('interval') === 'year' ? 'year' : 'month'
  if (!PAID_PLANS.includes(plan)) return { error: 'Elegí un plan.' }

  let initPoint: string | undefined
  try {
    const pre = await createPreapproval(
      preapprovalRequest({
        orgId: ctx.org.id,
        orgName: ctx.org.name,
        plan,
        interval,
        // En pruebas, Mercado Pago exige el email de la cuenta de prueba compradora.
        payerEmail: process.env.MP_TEST_PAYER_EMAIL || ctx.email,
        backUrl: `${process.env.MP_BACK_URL_BASE || siteUrl()}/app/plan/volver`,
      }),
      randomUUID(),
    )
    initPoint = pre.init_point
  } catch (e) {
    console.error('[mercadopago] crear suscripción', (e as Error).message)
    return { error: 'Mercado Pago no respondió. Probá de nuevo en un momento.' }
  }
  if (!initPoint) return { error: 'Mercado Pago no devolvió el link de pago. Probá de nuevo.' }
  redirect(initPoint)
}

/** Cancela la renovación: el plan sigue hasta el fin de lo pagado y después pasa a Gratis. */
export async function cancelSubscription(_state: FormState): Promise<FormState> {
  const ctx = await owner()
  if (isState(ctx)) return ctx
  const supabase = await createClient()
  const { data: sub } = await supabase.from('subscriptions').select('provider_subscription_id, status').eq('org_id', ctx.org.id).maybeSingle()
  const id = sub?.provider_subscription_id as string | undefined
  if (!id || sub?.status === 'cancelled') return { error: 'No tenés una suscripción activa para cancelar.' }
  try {
    await cancelPreapproval(id)
    await syncPreapproval(id, ctx.org.id)
  } catch (e) {
    console.error('[mercadopago] cancelar', (e as Error).message)
    return { error: 'No pudimos cancelar en Mercado Pago. Probá de nuevo en un momento.' }
  }
  revalidatePath('/app', 'layout')
  return { ok: 'Listo: no se renueva más. Seguís con tu plan hasta el fin del período pago y después pasás a Gratis.' }
}
