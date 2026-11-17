import { NextResponse } from 'next/server'
import { optOutFromToken } from '@/server/actions/unsubscribe'

/**
 * Baja con un clic desde el botón de Gmail y otros (RFC 8058): el cliente de
 * correo hace POST con "List-Unsubscribe=One-Click" al link del encabezado.
 * El link visible del email va a /baja (con botón de confirmación).
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const t = new URL(req.url).searchParams.get('t') ?? ''
  const ok = await optOutFromToken(t)
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 })
}
