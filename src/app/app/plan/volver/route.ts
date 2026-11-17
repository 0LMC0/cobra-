import { NextResponse } from 'next/server'
import { getOrgContext } from '@/server/auth'
import { syncPreapproval } from '@/server/billing/mercadopago'

/**
 * Vuelta desde Mercado Pago (back_url). Llega ?preapproval_id=...; se consulta la
 * suscripción a Mercado Pago y sólo se aplica si es de la empresa de esta sesión.
 * El webhook hace lo mismo aunque la persona no vuelva.
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const back = (estado: string) => NextResponse.redirect(new URL(`/app/configuracion?plan=${estado}#tu-plan`, url.origin))
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.redirect(new URL('/ingresar', url.origin))

  const id = url.searchParams.get('preapproval_id')
  if (!id || !/^[A-Za-z0-9-]{6,64}$/.test(id)) return back('sin-datos')
  try {
    const result = await syncPreapproval(id, ctx.org.id)
    if (!result) return back('no-corresponde')
    return back(result.status === 'active' ? 'activo' : 'pendiente')
  } catch {
    return back('error')
  }
}
