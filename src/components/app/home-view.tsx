import { ArrowRight, Bell, Building2, Check, CircleAlert, FileText, HandCoins, UserPlus, Wallet } from 'lucide-react'
import Link from 'next/link'
import { ButtonLink } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import type { HomeTotals } from '@/domain/home'
import { formatMoneyClean, type CurrencyCode } from '@/domain/money'
import { TodayReminders, type TodayReminder } from './today-reminders'

/**
 * Inicio del panel. Componente de presentación puro: la página real le pasa
 * los datos de la empresa y la vista previa de desarrollo, datos de ejemplo.
 */
export type OnboardingStep = 'company' | 'first_customer' | 'first_charge' | 'reminders' | 'done'

const STEPS = [
  { key: 'company', icon: Building2, title: 'Crear tu empresa', desc: 'Nombre y moneda. Listo.', href: '/app/configuracion', cta: 'Ver' },
  { key: 'first_customer', icon: UserPlus, title: 'Cargar tu primer cliente', desc: 'Nombre y email, nada más.', href: '/app/clientes/nuevo', cta: 'Cargar cliente' },
  { key: 'first_charge', icon: FileText, title: 'Crear su primer cobro', desc: 'Cuánto te paga y cuándo vence.', href: '/app/clientes', cta: 'Ir a clientes' },
  { key: 'reminders', icon: Bell, title: 'Prender los avisos', desc: 'Cobra+ le escribe por vos antes y después del vencimiento.', href: '/app/configuracion', cta: 'Activar' },
] as const

const ORDER: OnboardingStep[] = ['company', 'first_customer', 'first_charge', 'reminders', 'done']

export function HomeView({
  dateLabel, onboardingStep, currency, businessName = '', transferAlias = null, todayReminders = [], totals,
}: {
  dateLabel: string
  onboardingStep: OnboardingStep
  currency: CurrencyCode
  totals?: HomeTotals
  businessName?: string
  transferAlias?: string | null
  todayReminders?: TodayReminder[]
}) {
  const reached = ORDER.indexOf(onboardingStep)
  const doneCount = Math.min(reached, STEPS.length)
  const next = STEPS[doneCount]

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-[14px] font-semibold text-muted first-letter:uppercase">{dateLabel}</p>
        <h1 className="text-[34px] sm:text-[40px]">Inicio</h1>
      </header>

      {/* Totales: aparecen recién cuando hay cobros cargados; antes sólo meten ruido. */}
      {totals?.hasData && (
        <section aria-label="Totales del mes" className="divide-y divide-line overflow-hidden rounded-[18px] bg-surface ring-1 ring-line-2 sm:grid sm:grid-cols-3 sm:gap-3 sm:divide-y-0 sm:overflow-visible sm:bg-transparent sm:ring-0">
          <Kpi icon={Wallet} label="Falta cobrar" value={formatMoneyClean(totals.pendingMinor, currency)} tone="brand" />
          <Kpi icon={HandCoins} label="Cobrado este mes" value={formatMoneyClean(totals.collectedMinor, currency)} tone="ok" />
          <Kpi icon={CircleAlert} label="Atrasado" value={formatMoneyClean(totals.overdueMinor, currency)} tone="danger" muted={totals.overdueMinor === 0} />
        </section>
      )}

      <TodayReminders items={todayReminders} businessName={businessName} transferAlias={transferAlias} />

      {onboardingStep !== 'done' && next && (
        <section aria-labelledby="setup-title" className="overflow-hidden rounded-[22px] bg-surface ring-1 ring-line-2">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div>
              <h2 id="setup-title" className="text-[19px] tracking-[-0.02em]">Dejá Cobra+ lista para cobrar</h2>
              <p className="text-[13.5px] text-muted">{doneCount} de {STEPS.length} pasos</p>
            </div>
            <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={STEPS.length} aria-label="Progreso de configuración">
              {STEPS.map((s, i) => (
                <span key={s.key} className={cn('h-2 w-9 rounded-full', i < doneCount ? 'bg-ok-bright' : i === doneCount ? 'bg-brand' : 'bg-surface-3')} />
              ))}
            </div>
          </div>

          <ol>
            {STEPS.map((s, i) => {
              const done = i < doneCount
              const current = i === doneCount
              const Icon = s.icon
              return (
                <li
                  key={s.key}
                  aria-current={current ? 'step' : undefined}
                  className={cn('flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0 sm:px-6', current && 'bg-brand-soft/60')}
                >
                  <span
                    className={cn(
                      'grid size-10 shrink-0 place-items-center rounded-full',
                      done ? 'bg-ok-bright text-white' : current ? 'bg-brand text-white' : 'bg-surface-3 text-muted',
                    )}
                  >
                    {done ? <Check className="size-5" strokeWidth={3} /> : <Icon className="size-[18px]" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[15.5px] font-bold', done && 'text-muted line-through decoration-1')}>{s.title}</p>
                    <p className="text-[13.5px] text-muted">{s.desc}</p>
                    {current && (
                      <span className="mt-3 block sm:hidden"><ButtonLink href={s.href} size="sm">{s.cta} <ArrowRight className="size-3.5" /></ButtonLink></span>
                    )}
                  </div>
                  {done ? (
                    <span className="hidden text-[13px] font-bold text-ok sm:inline">Listo</span>
                  ) : current ? (
                    <span className="hidden shrink-0 sm:block"><ButtonLink href={s.href} size="sm">{s.cta} <ArrowRight className="size-3.5" /></ButtonLink></span>
                  ) : (
                    <Link href={s.href} className="hidden text-[13px] font-semibold text-muted hover:text-ink sm:inline">Ver</Link>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {totals?.hasData && todayReminders.length === 0 && (
        <p className="flex items-center gap-2 rounded-[16px] bg-ok-soft px-4 py-3 text-[14.5px] font-semibold text-ok">
          <Check className="size-4" strokeWidth={3} /> Hoy no hay que avisarle a nadie. Cobra+ te escribe cuando haga falta.
        </p>
      )}
    </div>
  )
}

const kpiTone = {
  brand: 'bg-brand-soft text-brand-d',
  ok: 'bg-ok-soft text-ok',
  danger: 'bg-danger-soft text-danger',
} as const

function Kpi({ icon: Icon, label, value, tone, muted = false }: { icon: typeof Wallet; label: string; value: string; tone: keyof typeof kpiTone; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:flex-col sm:items-start sm:gap-3 sm:rounded-[18px] sm:bg-surface sm:p-5 sm:ring-1 sm:ring-line-2">
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-[11px] sm:size-10 sm:rounded-[12px]', kpiTone[tone])}><Icon className="size-[18px] sm:size-5" /></span>
      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3 sm:block">
        <p className="text-[14px] font-semibold text-muted">{label}</p>
        <p className={cn('money text-[18px] sm:mt-0.5 sm:text-[24px]', muted && 'text-faint')}>{value}</p>
      </div>
    </div>
  )
}
