import type { Metadata } from 'next'
import { Logo } from '@/components/ui/misc'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyUnsubscribeToken } from '@/server/unsubscribe'
import { UnsubscribeForm } from './unsubscribe-form'

export const metadata: Metadata = { title: 'Dejar de recibir avisos', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

/**
 * Se confirma con un botón (no al abrir el link): así los antivirus que abren
 * los links de los emails no dan de baja a nadie sin querer.
 */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = '' } = await searchParams
  const customerId = verifyUnsubscribeToken(t)

  let businessName: string | null = null
  let alreadyOut = false
  if (customerId) {
    const db = createAdminClient()
    const { data } = await db.from('customers').select('contact_opt_out, organizations(name)').eq('id', customerId).maybeSingle()
    const org = data?.organizations as { name?: string } | { name?: string }[] | null | undefined
    businessName = (Array.isArray(org) ? org[0]?.name : org?.name) ?? null
    alreadyOut = Boolean(data?.contact_opt_out)
  }

  return (
    <main className="grid-paper grid min-h-dvh place-items-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-[22px] bg-surface p-6 ring-1 ring-line-2 sm:p-8">
        <Logo withBy />
        {!customerId ? (
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px]">Este link no es válido</h1>
            <p className="text-[15px] text-muted">Respondé el último email que te llegó pidiendo la baja y la hacemos a mano.</p>
          </div>
        ) : alreadyOut ? (
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px]">Ya estás dado de baja</h1>
            <p className="text-[15px] text-muted">No te llegan más recordatorios automáticos{businessName ? ` de ${businessName}` : ''}.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-[26px]">¿Dejar de recibir recordatorios{businessName ? ` de ${businessName}` : ''}?</h1>
              <p className="text-[15px] text-muted">
                Son los avisos de vencimiento que te manda Cobra+ en su nombre. Lo que debas no cambia: sólo dejan de llegarte los emails automáticos.
              </p>
            </div>
            <UnsubscribeForm token={t} />
          </div>
        )}
      </div>
    </main>
  )
}
