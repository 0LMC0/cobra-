'use server'

import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'
import { siteUrl } from '@/config/env'
import { cleanText } from '@/domain/safe-text'
import { ownerNotice, receiptEmail, requestCode, type ConsumerRequestKind } from '@/domain/consumer-requests'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/server/email/mailer'
import type { FormState } from './form-state'

/**
 * Botón de arrepentimiento y botón de baja: sin iniciar sesión (Disp. 954/2025).
 * Se le da un código de trámite al instante y por email. La baja se confirma desde
 * el email de la cuenta (verificación de identidad, Disp. 3/2026).
 */
const schema = z.object({
  kind: z.enum(['arrepentimiento', 'baja']),
  email: z.string().trim().toLowerCase().email('Poné el email con el que usás Cobra+.').max(254),
  fullName: z.string().transform(cleanText).pipe(z.string().max(120)).optional().transform((v) => (v ? v : null)),
  message: z.string().transform(cleanText).pipe(z.string().max(1000, 'Usá 1000 caracteres o menos.')).optional().transform((v) => (v ? v : null)),
})

export type ConsumerRequestState = FormState & { code?: string }

export async function submitConsumerRequest(_: ConsumerRequestState, formData: FormData): Promise<ConsumerRequestState> {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data
  const kind = d.kind as ConsumerRequestKind
  const db = createAdminClient()

  // Freno contra abuso: hasta 3 pedidos por email por día.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { count } = await db.from('consumer_requests').select('id', { count: 'exact', head: true }).eq('email', d.email).gte('created_at', since)
  if ((count ?? 0) >= 3) return { error: 'Ya recibimos varios pedidos con este email hoy. Revisá tu bandeja: ahí está tu código de trámite.' }

  const code = requestCode(randomBytes(6))
  const token = kind === 'baja' ? randomBytes(24).toString('base64url') : null
  const { error } = await db.from('consumer_requests').insert({
    code, kind, email: d.email, full_name: d.fullName, message: d.message,
    confirm_hash: token ? createHash('sha256').update(token).digest('hex') : null,
  })
  if (error) return { error: 'No pudimos registrar tu pedido. Probá de nuevo en un momento.' }

  const confirmUrl = token ? `${siteUrl()}/boton-de-baja/confirmar?t=${token}` : undefined
  await sendEmail({ to: d.email, ...receiptEmail(kind, code, confirmUrl), idempotencyKey: `tramite-${code}` })
  const owner = process.env.OWNER_NOTIFY_EMAIL
  if (owner) await sendEmail({ to: owner, ...ownerNotice(kind, code, d.email, d.fullName, d.message), replyTo: d.email, idempotencyKey: `tramite-aviso-${code}` })

  return {
    code,
    ok: kind === 'baja'
      ? `Tu código de trámite es ${code}. Te mandamos un email a ${d.email}: confirmá la baja desde ahí y cancelamos la renovación de tu plan.`
      : `Tu código de trámite es ${code}. También te lo mandamos a ${d.email}. Te escribimos para confirmar la devolución.`,
  }
}
