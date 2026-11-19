import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOwnerStats } from '@/server/owner-stats'

/**
 * Números de las últimas 24 horas para el resumen diario de PrimerosPrecios
 * (lo pide primerosprecios.com). Sólo conteos, ningún dato personal.
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function authorized(header: string | null): boolean {
  const secret = process.env.STATS_SECRET
  if (!secret || !header) return false
  const a = Buffer.from(header)
  const b = Buffer.from(`Bearer ${secret}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(req: Request) {
  if (!authorized(req.headers.get('authorization'))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString()
  const stats = await getOwnerStats(createAdminClient(), since)
  return NextResponse.json(stats, { headers: { 'Cache-Control': 'no-store' } })
}
