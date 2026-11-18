import { NextResponse } from 'next/server'
import { todayIn } from '@/domain/dates'
import { hasRole } from '@/domain/roles'
import { createClient } from '@/lib/supabase/server'
import { getOrgContext } from '@/server/auth'
import { getWhatsAppQuota } from '@/server/queries'

/**
 * "Avisar por WhatsApp": anota el aviso (historial y cupo del plan Gratis) y abre
 * WhatsApp con el mensaje listo. El mensaje lo arma la pantalla; acá sólo se acepta
 * un link a wa.me, así esta ruta no puede usarse para mandar a nadie a otro sitio.
 */
export const dynamic = 'force-dynamic'

const WA_LINK = /^https:\/\/wa\.me\/\d{8,15}\?text=[^\s]{1,4000}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: Request) {
  const url = new URL(req.url)
  const back = (path: string) => NextResponse.redirect(new URL(path, url.origin))
  const ctx = await getOrgContext()
  if (!ctx) return back('/ingresar')
  if (!hasRole(ctx.role, 'operator')) return back('/app/sin-permisos')

  const chargeId = url.searchParams.get('cobro') ?? ''
  const link = url.searchParams.get('a') ?? ''
  if (!UUID.test(chargeId) || !WA_LINK.test(link)) return back('/app')

  const quota = await getWhatsAppQuota(ctx.org.id, todayIn(ctx.org.timezone))
  if (quota.locked) return back('/app/configuracion?wa=tope#tu-plan')

  const supabase = await createClient()
  const { error } = await supabase.from('whatsapp_sends').insert({ org_id: ctx.org.id, charge_id: chargeId, created_by: ctx.userId })
  if (error) return back('/app') // el cobro no es de esta empresa (lo frena la base)
  return NextResponse.redirect(link)
}
