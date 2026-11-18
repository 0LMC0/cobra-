'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_ORG_COOKIE, getUser } from '@/server/auth'
import { cancelPreapproval, mercadoPagoConfigured } from '@/server/billing/mercadopago'
import type { FormState } from './form-state'

/**
 * Borrar mi cuenta (derecho de supresión, Ley 25.326).
 * - Las empresas donde sos la única persona dueña se borran enteras, con sus clientes,
 *   cobros, pagos e historial; antes se cancela la suscripción de Mercado Pago si hay una.
 * - En las empresas que tienen otra persona dueña, sólo salís vos.
 * - Por último se borra tu usuario. No se puede deshacer.
 */
export async function deleteAccount(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser()
  if (!user) return { error: 'Tu sesión venció. Volvé a ingresar.' }
  if (String(formData.get('confirm') ?? '').trim().toUpperCase() !== 'BORRAR') {
    return { fieldErrors: { confirm: ['Escribí BORRAR para confirmar.'] } }
  }

  const db = createAdminClient()
  const { data: mine, error } = await db.from('organization_members').select('org_id, role').eq('user_id', user.id)
  if (error) return { error: 'No pudimos borrar la cuenta. Probá de nuevo en un momento.' }

  for (const m of mine ?? []) {
    if (m.role !== 'owner') continue
    const { count } = await db.from('organization_members').select('user_id', { count: 'exact', head: true })
      .eq('org_id', m.org_id).eq('role', 'owner').neq('user_id', user.id)
    if ((count ?? 0) > 0) continue // hay otra persona dueña: la empresa sigue

    // Sos la única dueña: primero se corta el cobro del plan, después se borra la empresa.
    const { data: sub } = await db.from('subscriptions').select('provider_subscription_id, status').eq('org_id', m.org_id).maybeSingle()
    if (sub?.provider_subscription_id && sub.status !== 'cancelled' && mercadoPagoConfigured()) {
      try {
        await cancelPreapproval(sub.provider_subscription_id as string)
      } catch {
        return { error: 'No pudimos cancelar tu suscripción en Mercado Pago, así que no borramos nada. Probá de nuevo en un momento.' }
      }
    }
    const { error: delOrg } = await db.from('organizations').delete().eq('id', m.org_id)
    if (delOrg) return { error: 'No pudimos borrar los datos de tu empresa. Probá de nuevo en un momento.' }
  }

  const { error: delUser } = await db.auth.admin.deleteUser(user.id)
  if (delUser) return { error: 'Borramos tus empresas pero no pudimos borrar tu usuario. Escribinos y lo terminamos a mano.' }

  const supabase = await createClient()
  await supabase.auth.signOut().catch(() => undefined)
  ;(await cookies()).delete(ACTIVE_ORG_COOKIE)
  redirect('/ingresar?cuenta=borrada')
}
