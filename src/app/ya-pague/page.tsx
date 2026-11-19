import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/misc'
import { formatMoneyClean, type CurrencyCode } from '@/domain/money'
import { createAdminClient } from '@/lib/supabase/admin'
import { claimPaid } from '@/server/actions/paid-claim'
import { verifyPaidClaimToken } from '@/server/unsubscribe'

export const metadata: Metadata = { title: 'Ya pagué', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

/**
 * Desde el botón "Ya pagué" del aviso. Se confirma con un botón (no al abrir el link),
 * así los antivirus que abren los links no avisan nada solos.
 */
export default async function PaidClaimPage({ searchParams }: { searchParams: Promise<{ t?: string; listo?: string; error?: string }> }) {
  const { t = '', listo, error } = await searchParams
  const chargeId = error ? null : verifyPaidClaimToken(t)

  let info: { concept: string; amount: string; business: string; open: boolean } | null = null
  if (chargeId) {
    const db = createAdminClient()
    const { data } = await db.from('charges').select('concept, amount_minor, currency, state, organizations(name)').eq('id', chargeId).maybeSingle()
    if (data) {
      const org = (Array.isArray(data.organizations) ? data.organizations[0] : data.organizations) as { name: string } | null
      info = { concept: data.concept as string, amount: formatMoneyClean(Number(data.amount_minor), data.currency as CurrencyCode), business: org?.name ?? 'quien te cobra', open: data.state === 'open' }
    }
  }

  return (
    <main className="grid-paper grid min-h-dvh place-items-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-[22px] bg-surface p-6 ring-1 ring-line-2 sm:p-8">
        <Logo />
        {!info ? (
          <>
            <h1 className="text-[24px]">Este link no es válido</h1>
            <p className="text-[15px] text-muted">Si ya pagaste, respondé el email del aviso con el comprobante.</p>
          </>
        ) : listo || !info.open ? (
          <>
            <h1 className="text-[24px]">¡Gracias! Le avisamos a {info.business}</h1>
            <p className="text-[15px] leading-relaxed text-muted">
              Frenamos los avisos de {info.concept} mientras confirma que le llegó el pago. Si tenés el comprobante, podés responder el email del aviso con él.
            </p>
          </>
        ) : (
          <form action={claimPaid} className="flex flex-col gap-4">
            <input type="hidden" name="t" value={t} />
            <h1 className="text-[24px] leading-tight">¿Ya pagaste {info.concept}?</h1>
            <p className="text-[15px] leading-relaxed text-muted">
              Le avisamos a <b className="text-ink">{info.business}</b> que ya pagaste <b className="text-ink">{info.amount}</b> y dejamos de mandarte recordatorios mientras lo confirma.
            </p>
            <Button type="submit" size="lg">Sí, ya pagué</Button>
          </form>
        )}
      </div>
    </main>
  )
}
