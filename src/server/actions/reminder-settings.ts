'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { AuthorizationError, authorize } from '@/server/auth'
import type { FormState } from './form-state'
import { normalizeTransferAlias } from '@/domain/safe-text'

const schema = z.object({
  enabled: z.union([z.literal('on'), z.literal('')]).optional().transform((v) => v === 'on'),
  transferAlias: z.string().optional().transform((v, ctx) => {
    if (!v || !v.trim()) return null
    const alias = normalizeTransferAlias(v)
    if (!alias) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Poné tu alias (por ejemplo estudio.rivas.mp) o tu CBU/CVU de 22 números.' })
      return z.NEVER
    }
    return alias
  }),
  replyTo: z.union([z.literal(''), z.string().trim().toLowerCase().email('Ese email no parece válido.').max(254)]).optional().transform((v) => (v ? v : null)),
})

/** Avisos automáticos de la empresa: sólo administración o dueños. */
export async function updateReminderSettings(_: FormState, formData: FormData): Promise<FormState> {
  let ctx
  try {
    ctx = await authorize('admin')
  } catch (e) {
    return { error: e instanceof AuthorizationError ? e.message : 'No pudimos verificar tu sesión.' }
  }
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data
  if (d.enabled && !d.replyTo) return { fieldErrors: { replyTo: ['Poné el email donde querés recibir las respuestas de tus clientes.'] } }

  const supabase = await createClient()
  const update: Record<string, unknown> = { reminders_enabled: d.enabled, transfer_alias: d.transferAlias, reply_to_email: d.replyTo }
  if (d.enabled && ctx.org.onboarding_step === 'reminders') update.onboarding_step = 'done'
  const { error } = await supabase.from('organizations').update(update).eq('id', ctx.org.id)
  if (error) return { error: 'No pudimos guardar los cambios. Probá de nuevo.' }
  revalidatePath('/app', 'layout')
  return { ok: d.enabled ? 'Listo: Cobra+ va a avisarle por email a tus clientes.' : 'Listo: los avisos automáticos quedaron apagados.' }
}

/**
 * Prender los avisos con un toque (desde la ficha del cliente). Si todavía no hay
 * email para respuestas, usa el de la persona que los prende; se cambia en Configuración.
 */
export async function turnOnReminders(_: FormState, formData: FormData): Promise<FormState> {
  let ctx
  try {
    ctx = await authorize('admin')
  } catch (e) {
    return { error: e instanceof AuthorizationError ? e.message : 'No pudimos verificar tu sesión.' }
  }
  const supabase = await createClient()
  const { data: org } = await supabase.from('organizations').select('reply_to_email').eq('id', ctx.org.id).maybeSingle()
  const update: Record<string, unknown> = { reminders_enabled: true, reply_to_email: (org?.reply_to_email as string | null) || ctx.email }
  if (['first_customer', 'first_charge', 'reminders'].includes(ctx.org.onboarding_step)) update.onboarding_step = 'done'
  const { error } = await supabase.from('organizations').update(update).eq('id', ctx.org.id)
  if (error) return { error: 'No pudimos prenderlos. Probá de nuevo.' }
  revalidatePath('/app', 'layout')
  const back = String(formData.get('customerId') ?? '')
  if (/^[0-9a-f-]{36}$/i.test(back)) redirect(`/app/clientes/${back}?avisos=1`)
  return { ok: 'Listo: Cobra+ ya le avisa por email a tus clientes antes y después de cada vencimiento.' }
}
