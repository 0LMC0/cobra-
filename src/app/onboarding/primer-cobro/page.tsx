import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BellRing, FileUp, HandCoins } from 'lucide-react'
import { addDays, todayIn } from '@/domain/dates'
import { getOrgContext } from '@/server/auth'
import { OnboardingShell } from '../shell'
import { FirstChargeForm } from './first-charge-form'

export const metadata: Metadata = { title: 'Tu primer cobro', robots: { index: false } }
export const dynamic = 'force-dynamic'

const HOW = [
  { icon: BellRing, title: 'Cobra+ le avisa por vos', text: 'Por email, con el nombre de tu empresa. Vos no escribís nada.' },
  { icon: HandCoins, title: 'Te paga a vos, como siempre', text: 'Tocás “Pagó” y los avisos se cortan. Cobra+ no toca tu plata.' },
]

export default async function FirstChargePage() {
  const ctx = await getOrgContext()
  if (!ctx) redirect('/onboarding')
  const today = todayIn(ctx.org.timezone)
  return (
    <OnboardingShell
      step={3}
      wide
      title="¿A quién le cobrás?"
      intro="Cargá a un cliente que te pague seguido y lo que te debe. Con eso Cobra+ ya sabe cuándo avisarle."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <FirstChargeForm currency={ctx.org.currency} defaultDueDate={addDays(today, 10)} />
        <aside className="flex flex-col gap-4">
          {HOW.map((h) => (
            <div key={h.title} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-text" aria-hidden><h.icon className="size-5" /></span>
              <div>
                <p className="text-[15px] font-bold">{h.title}</p>
                <p className="text-[13.5px] leading-relaxed text-muted">{h.text}</p>
              </div>
            </div>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-line-2 pt-4 text-[14px] font-semibold">
            <Link href="/app/clientes/importar" className="inline-flex items-center gap-1.5 text-brand-text hover:underline"><FileUp className="size-4" /> ¿Los tenés en Excel? Importalos</Link>
            <Link href="/app" className="text-muted hover:text-ink">Prefiero mirar la app primero</Link>
          </div>
        </aside>
      </div>
    </OnboardingShell>
  )
}
