import { NextResponse } from 'next/server'
import { getOrgContext } from '@/server/auth'
import { listCharges, listCustomers, listPayments } from '@/server/queries'
import { chargesCsv, customersCsv, paymentsCsv } from '@/domain/exports'
import { csvFilename } from '@/domain/csv'
import { todayIn } from '@/domain/dates'
import { isCurrency } from '@/domain/money'

/**
 * Descargas en CSV: /app/exportar/clientes, /cobros y /pagos.
 * Siempre de la empresa activa de la sesión; la RLS vuelve a filtrar en la base.
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const KINDS = ['clientes', 'cobros', 'pagos'] as const
type Kind = (typeof KINDS)[number]

export async function GET(_req: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params
  if (!KINDS.includes(tipo as Kind)) return NextResponse.json({ error: 'No existe ese reporte.' }, { status: 404 })

  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'Tu sesión venció. Volvé a ingresar.' }, { status: 401 })

  const { org } = ctx
  const today = todayIn(org.timezone)
  let body: string
  try {
    if (tipo === 'clientes') {
      const [active, archived] = await Promise.all([listCustomers(org.id, today), listCustomers(org.id, today, { archived: true })])
      body = customersCsv([...active, ...archived], isCurrency(org.currency) ? org.currency : 'ARS')
    } else if (tipo === 'cobros') {
      body = chargesCsv(await listCharges(org.id, today))
    } else {
      body = paymentsCsv(await listPayments(org.id))
    }
  } catch {
    return NextResponse.json({ error: 'No pudimos armar el reporte. Probá de nuevo.' }, { status: 500 })
  }

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${csvFilename(tipo, today)}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
