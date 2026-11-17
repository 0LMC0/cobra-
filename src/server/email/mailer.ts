import 'server-only'

/**
 * Envío de emails con Resend (API HTTP, sin SDK). Sin RESEND_API_KEY no se
 * manda nada: el proceso diario corre en modo prueba y sólo informa qué saldría.
 */
export type OutgoingEmail = { to: string; subject: string; text: string; html: string; replyTo?: string | null; fromName?: string | null }
export type SendResult = { ok: true; id: string } | { ok: false; error: string }

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

/** "Estudio Martínez vía Cobra+ <avisos@dominio>": el nombre de la empresa, la casilla de Cobra+. */
export function fromHeader(fromName?: string | null): string {
  const configured = process.env.EMAIL_FROM ?? 'Cobra+ <avisos@example.com>'
  const address = configured.match(/<([^>]+)>/)?.[1] ?? configured
  if (!fromName) return configured
  const safe = fromName.replace(/["<>\r\n]/g, '').slice(0, 60)
  return `"${safe} vía Cobra+" <${address}>`
}

export async function sendEmail(e: OutgoingEmail): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: 'Falta RESEND_API_KEY' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromHeader(e.fromName),
        to: [e.to],
        subject: e.subject,
        text: e.text,
        html: e.html,
        ...(e.replyTo ? { reply_to: e.replyTo } : {}),
      }),
    })
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string }
    if (!res.ok || !body.id) return { ok: false, error: `Resend ${res.status}: ${body.message ?? 'error desconocido'}`.slice(0, 480) }
    return { ok: true, id: body.id }
  } catch (err) {
    return { ok: false, error: `No se pudo conectar con Resend: ${(err as Error).message}`.slice(0, 480) }
  }
}
