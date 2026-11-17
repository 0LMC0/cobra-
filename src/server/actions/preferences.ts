'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { AuthorizationError, authorize } from '@/server/auth'
import type { FormState } from './form-state'

const schema = z.object({ frequency: z.enum(['daily', 'every_3_days', 'weekly', 'off']) })

export async function setDigestFrequency(_: FormState, formData: FormData): Promise<FormState> {
  let orgId: string
  try {
    orgId = (await authorize('viewer')).org.id
  } catch (e) {
    return { error: e instanceof AuthorizationError ? e.message : 'No pudimos verificar tu sesión.' }
  }
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Elegí una opción.' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_digest_frequency', { p_org: orgId, p_frequency: parsed.data.frequency })
  if (error) return { error: 'No pudimos guardar tu preferencia. Probá de nuevo.' }
  revalidatePath('/app/configuracion')
  return { ok: parsed.data.frequency === 'off' ? 'Listo: no te vamos a mandar el resumen.' : 'Listo: guardamos tu preferencia.' }
}
