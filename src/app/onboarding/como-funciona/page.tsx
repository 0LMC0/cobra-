import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ArrowRight, BellRing, FileText, HandCoins, UserPlus } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { getOrgContext } from '@/server/auth'
import { OnboardingShell } from '../shell'

export const metadata: Metadata = { title: 'Cómo funciona', robots: { index: false } }
export const dynamic = 'force-dynamic'

const STEPS = [
  { icon: UserPlus, title: 'Cargás un cliente', text: 'Nombre y email. Si tenés su celular, también te deja avisarle por WhatsApp.' },
  { icon: FileText, title: 'Le creás un cobro', text: 'Qué le cobrás, cuánto y cuándo vence. Si te paga todos los meses, lo marcás una vez y se repite solo.' },
  { icon: BellRing, title: 'Cobra+ le avisa por vos', text: 'Le escribe antes de que venza y si se atrasa. Vos no tenés que acordarte ni reclamarle.' },
  { icon: HandCoins, title: 'Cuando te paga, lo anotás', text: 'Un toque en “Pagó” y los avisos de ese cobro se cortan. La plata va directo a tu cuenta, como siempre.' },
]

export default async function ComoFuncionaPage() {
  const ctx = await getOrgContext()
  if (!ctx) redirect('/onboarding')
  return (
    <OnboardingShell
      step={3}
      title="Así funciona Cobra+"
      intro="Son cuatro cosas. Las primeras dos las hacés vos una sola vez; el resto pasa solo."
    >
      <Card hard className="p-5 sm:p-7">
        <ol className="flex flex-col gap-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-text" aria-hidden>
                <s.icon className="size-5" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-[16.5px] font-bold"><span className="text-muted">{i + 1}.</span> {s.title}</p>
                <p className="text-[14.5px] leading-relaxed text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <div className="flex flex-col items-start gap-3">
        <ButtonLink href="/app/clientes/nuevo?primero=1" size="lg">
          Cargar mi primer cliente <ArrowRight className="size-4" />
        </ButtonLink>
        <ButtonLink href="/app" variant="ghost" size="md">Prefiero mirar la app primero</ButtonLink>
      </div>
    </OnboardingShell>
  )
}
