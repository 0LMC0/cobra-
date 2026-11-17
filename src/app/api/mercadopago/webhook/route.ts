import { NextResponse } from 'next/server'
import { syncPreapproval, verifyWebhookSignature } from '@/server/billing/mercadopago'

/**
 * Aviso de Mercado Pago (webhook) para las suscripciones de Cobra+.
 * 1) Verifica la firma (x-signature) con MP_WEBHOOK_SECRET_COBRA.
 * 2) No confía en el contenido: vuelve a pedir la suscripción a Mercado Pago.
 * 3) Guarda el plan; repetir el mismo aviso deja todo igual (idempotente).
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TOPICS = new Set(['subscription_preapproval', 'preapproval'])

export async function POST(req: Request) {
  const url = new URL(req.url)
  const body = (await req.json().catch(() => ({}))) as { type?: string; topic?: string; data?: { id?: string } }
  const type = body.type ?? body.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic') ?? ''
  const dataId = body.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? ''
  if (!dataId) return NextResponse.json({ ok: true, ignored: 'sin id' })

  if (!verifyWebhookSignature({ signature: req.headers.get('x-signature'), requestId: req.headers.get('x-request-id'), dataId })) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  // Los cobros de cada mes (subscription_authorized_payment) no cambian el plan: se ignoran por ahora.
  if (!TOPICS.has(type)) return NextResponse.json({ ok: true, ignored: type })

  try {
    const result = await syncPreapproval(dataId)
    return NextResponse.json({ ok: true, result })
  } catch {
    // 500: Mercado Pago reintenta el aviso más tarde.
    return NextResponse.json({ error: 'No se pudo procesar' }, { status: 500 })
  }
}
