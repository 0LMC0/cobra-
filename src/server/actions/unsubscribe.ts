'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyUnsubscribeToken } from '@/server/unsubscribe'
import type { FormState } from './form-state'

/**
 * Baja de los avisos automáticos, desde el link del email. Sin sesión: la firma
 * del link es la autorización, y sólo puede tocar el permiso de ese cliente.
 */
export async function optOutFromToken(token: string): Promise<boolean> {
  const customerId = verifyUnsubscribeToken(token)
  if (!customerId) return false
  const db = createAdminClient()
  const { error } = await db.from('customers').update({ contact_opt_out: true }).eq('id', customerId)
  return !error
}

export async function confirmUnsubscribe(_: FormState, formData: FormData): Promise<FormState> {
  const ok = await optOutFromToken(String(formData.get('t') ?? ''))
  return ok
    ? { ok: 'Listo, no te vamos a mandar más recordatorios automáticos. Si querés volver a recibirlos, avisale a quien te cobra.' }
    : { error: 'Este link no es válido. Respondé el último email que te llegó y te damos de baja a mano.' }
}
