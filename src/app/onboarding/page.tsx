import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/ui/misc'
import { getOrgContext, requireUser } from '@/server/auth'
import { CompanyForm } from './company-form'

export const metadata: Metadata = { title: 'Configurá tu empresa', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ nueva?: string }> }) {
  const user = await requireUser()
  const { nueva } = await searchParams
  const ctx = await getOrgContext()
  // Ya tiene empresa y no pidió crear otra: al panel.
  if (ctx && nueva !== '1') redirect('/app')

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0]

  return (
    <div className="grid-paper min-h-dvh px-4 py-8 sm:px-8">
      <header className="mx-auto flex max-w-2xl items-center justify-between">
        <Logo withBy />
        <span className="rounded-full bg-surface px-3 py-1 text-[13px] font-bold shadow-[var(--shadow-soft)] ring-1 ring-line">Paso 1 de 4</span>
      </header>
      <main className="mx-auto mt-10 flex max-w-2xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i === 0 ? 'bg-brand' : 'bg-line-2'}`} />
            ))}
          </div>
          <h1 className="mt-5 text-[34px] sm:text-[40px]">
            {firstName ? `${firstName}, contanos de tu empresa` : 'Contanos de tu empresa'}
          </h1>
          <p className="text-[15.5px] text-muted">
            Con esto configuramos tus montos, tus vencimientos y la firma de los recordatorios. Podés cambiarlo después.
          </p>
        </div>
        <CompanyForm defaultEmail={user.email ?? ''} />
      </main>
    </div>
  )
}
