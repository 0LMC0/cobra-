'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { AuthorizationError, authorize } from '@/server/auth'
import type { FormState } from './form-state'

const schema = z.object({
  enabled: z.union([z.literal('on'), z.literal('')]).optional().transform((v) => v === 'on'),
  transferAlias: z.string().trim().max(80, 'Usá 80 caracteres o menos.').optional().transform((v) => (v ? v : null)),
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
