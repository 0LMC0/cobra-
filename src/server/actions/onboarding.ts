'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { AuthorizationError, authorize } from '@/server/auth'
import type { FormState } from './form-state'

const schema = z.object({
  reminders: z.enum(['on', 'off'], { errorMap: () => ({ message: 'Elegí una opción.' }) }),
  replyTo: z.union([z.literal(''), z.string().trim().toLowerCase().email('Ese email no parece válido.').max(254)]).optional().transform((v) => (v ? v : null)),
  frequency: z.enum(['daily', 'every_3_days', 'weekly', 'off'], { errorMap: () => ({ message: 'Elegí cada cuánto.' }) }),
})

/** Paso 2 del onboarding: avisos a los clientes y resumen para vos. Todo se cambia después en Configuración. */
export async function saveOnboardingPreferences(_: FormState, formData: FormData): Promise<FormState> {
  let ctx
  try {
    ctx = await authorize('admin')
  } catch (e) {
    return { error: e instanceof AuthorizationError ? e.message : 'No pudimos verificar tu sesión.' }
  }
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data
  const on = d.reminders === 'on'
  if (on && !d.replyTo) return { fieldErrors: { replyTo: ['Poné el email donde querés recibir las respuestas de tus clientes.'] } }

  const supabase = await createClient()
  const [orgRes, digestRes] = await Promise.all([
    supabase.from('organizations').update({ reminders_enabled: on, reply_to_email: d.replyTo }).eq('id', ctx.org.id),
    supabase.rpc('set_digest_frequency', { p_org: ctx.org.id, p_frequency: d.frequency }),
  ])
  if (orgRes.error || digestRes.error) return { error: 'No pudimos guardar tus preferencias. Probá de nuevo.' }
  redirect('/onboarding/como-funciona')
}
