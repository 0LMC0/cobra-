import type { Metadata } from 'next'
import { Bell, Building2, Check, FileText, LayoutDashboard, UserPlus } from 'lucide-react'
import { Badge, EmptyState } from '@/components/ui/misc'
import { requireOrg } from '@/server/auth'
import { formatDate, todayIn } from '@/domain/dates'
import { cn } from '@/lib/cn'

export const metadata: Metadata = { title: 'Inicio' }

const STEPS = [
  { key: 'company', icon: Building2, title: 'Crear tu empresa', desc: 'Moneda, zona horaria y datos de contacto.' },
  { key: 'first_customer', icon: UserPlus, title: 'Cargar tu primer cliente', desc: 'A quién le cobrás y a qué email le llegan los avisos.' },
  { key: 'first_charge', icon: FileText, title: 'Crear tu primer cobro o abono', desc: 'Cuánto te paga y cuándo vence.' },
  { key: 'reminders', icon: Bell, title: 'Activar los recordatorios', desc: 'COBRA le avisa por email antes y después del vencimiento.' },
] as const

const ORDER = ['company', 'first_customer', 'first_charge', 'reminders', 'done'] as const

export default async function AppHome() {
  const { org } = await requireOrg('viewer')
  const today = todayIn(org.timezone)
  const reached = ORDER.indexOf(org.onboarding_step)
  const doneCount = Math.min(reached, STEPS.length)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2.5">
        <p className="eyebrow">{formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="text-[36px] sm:text-[42px]"><span className="marker">Inicio</span></h1>
        <p className="max-w-2xl text-[15.5px] text-muted">
          Acá vas a ver cuánto te falta cobrar, quién está atrasado y qué vence esta semana.
        </p>
      </header>

      {org.onboarding_step !== 'done' && (
        <section className="hard overflow-hidden rounded-[24px] bg-surface" aria-labelledby="setup-title">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-navy px-5 py-4 text-white sm:px-6">
            <div>
              <h2 id="setup-title" className="text-[18px] text-white">Dejá COBRA listo para cobrar</h2>
              <p className="text-[13.5px] text-white/70">{doneCount} de {STEPS.length} pasos completos</p>
            </div>
            <div className="h-2.5 w-44 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={STEPS.length} aria-label="Progreso de configuración">
              <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${(doneCount / STEPS.length) * 100}%` }} />
            </div>
          </div>
          <ol className="flex flex-col">
            {STEPS.map((s, i) => {
              const done = i < reached
              const Icon = s.icon
              return (
                <li key={s.key} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0 sm:px-6">
                  <span className={cn('grid size-11 shrink-0 place-items-center rounded-[14px]', done ? 'bg-ok-bright text-white' : 'bg-brand-soft text-brand-d')}>
                    {done ? <Check className="size-5" strokeWidth={3} /> : <Icon className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[15px] font-bold', done && 'text-muted line-through decoration-2')}>{s.title}</p>
                    <p className="text-[13.5px] text-muted">{s.desc}</p>
                  </div>
                  {done ? <Badge tone="ok">Listo</Badge> : <Badge>Próximamente</Badge>}
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <EmptyState icon={LayoutDashboard} title="Tu panel de cobros aparece acá">
        Cuando cargues clientes y cobros vas a ver cuánto te falta cobrar, qué está atrasado y qué vence esta semana.
        Todo calculado con tus datos reales.
      </EmptyState>
    </div>
  )
}
