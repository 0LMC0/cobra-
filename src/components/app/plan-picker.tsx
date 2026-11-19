'use client'

import { useActionState, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormFeedback } from '@/components/forms/form-feedback'
import { FREE_PLAN, PLANS, formatPlanPrice, monthlyPriceFor, yearlyTotalFor, type BillingInterval, type PlanTier } from '@/config/plans'
import { initialFormState, type FormState } from '@/server/actions/form-state'
import { cn } from '@/lib/cn'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

/** Elegir un plan pago: se paga en Mercado Pago, en pesos. */
export function PlanPicker({ current, renewing = false, action, canManage }: { current: PlanTier; renewing?: boolean; action: Action; canManage: boolean }) {
  const [interval, setInterval] = useState<BillingInterval>('year')
  const [state, formAction, pending] = useActionState(action, initialFormState)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] font-bold">{current === 'free' ? 'Pasate a un plan pago' : 'Cambiar de plan'}</p>
        <div role="radiogroup" aria-label="Frecuencia de pago" className="inline-flex rounded-[12px] bg-surface p-1 text-[13.5px] font-bold ring-1 ring-line-2">
          {(['month', 'year'] as const).map((i) => (
            <button
              key={i} type="button" role="radio" aria-checked={interval === i} onClick={() => setInterval(i)}
              className={cn('rounded-[9px] px-3 py-1.5 transition-[background-color,color,scale] duration-200 active:scale-95', interval === i ? 'bg-navy text-white' : 'text-muted hover:text-ink')}
            >
              {i === 'month' ? 'Mensual' : 'Anual · ahorrá 20%'}
            </button>
          ))}
        </div>
      </div>
      <FormFeedback state={state} />
      <div className={cn('grid grid-cols-1 gap-3 md:grid-cols-2', current === 'free' ? 'xl:grid-cols-4' : 'xl:grid-cols-3')}>
        {current === 'free' && (
          <div className="flex flex-col gap-3 rounded-[16px] bg-surface-2 p-4 ring-2 ring-ink/15">
            <div>
              <p className="flex items-center gap-2 text-[16px] font-bold">
                Gratis <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">Tu plan</span>
              </p>
              <p className="money text-[22px]">$ 0<span className="text-[13px] font-semibold text-muted"> /mes</span></p>
              <p className="text-[12.5px] font-semibold text-muted">Para siempre, sin tarjeta</p>
            </div>
            <ul className="flex flex-col gap-1.5 text-[13px]">
              {FREE_PLAN.features.slice(1, 5).map((f) => (
                <li key={f.label} className="flex items-start gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-ok" strokeWidth={3} />{f.label}</li>
              ))}
            </ul>
            <ul className="flex flex-col gap-1.5 border-t border-line-2 pt-3 text-[13px] text-muted">
              {FREE_PLAN.limits.map((l) => (
                <li key={l} className="flex items-start gap-1.5"><X className="mt-0.5 size-3.5 shrink-0 text-danger" strokeWidth={3} />{l}</li>
              ))}
            </ul>
            <p className="mt-auto text-center text-[13.5px] font-bold text-muted">Estás acá</p>
          </div>
        )}
        {PLANS.map((p) => {
          // Con la renovación cancelada se puede volver a contratar el mismo plan.
          const isCurrent = p.id === current && renewing
          const price = monthlyPriceFor(p, interval, 'ARS')
          return (
            <form key={p.id} action={formAction} className={cn('lift flex flex-col gap-3 rounded-[16px] bg-surface p-4 ring-1', p.highlighted ? 'ring-brand' : 'ring-line-2')}>
              <input type="hidden" name="plan" value={p.id} />
              <input type="hidden" name="interval" value={interval} />
              <div>
                <p className="flex items-center gap-2 text-[16px] font-bold">{p.name}{p.highlighted && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">El más elegido</span>}</p>
                <p className="money text-[22px]">
                  {formatPlanPrice(price, 'ARS')}<span className="text-[13px] font-semibold text-muted"> /mes</span>
                  {interval === 'year' && <s className="ml-2 text-[13px] font-bold text-faint">{formatPlanPrice(monthlyPriceFor(p, 'month', 'ARS'), 'ARS')}</s>}
                </p>
                <p className="text-[12.5px] font-semibold text-muted">
                  {interval === 'year' ? `Pagás ${formatPlanPrice(yearlyTotalFor(p, 'ARS'), 'ARS')} por año · precio fijo 12 meses` : 'Se cobra todos los meses'}
                </p>
              </div>
              <ul className="flex flex-col gap-1.5 text-[13px]">
                {p.features.filter((f) => f.available).map((f) => (
                  <li key={f.label} className="flex items-start gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-ok" strokeWidth={3} />{f.label}</li>
                ))}
              </ul>
              {isCurrent ? (
                <p className="mt-auto text-center text-[13.5px] font-bold text-ok">Tu plan actual</p>
              ) : canManage ? (
                <Button type="submit" size="md" variant={p.highlighted ? 'primary' : 'secondary'} loading={pending} className="mt-auto w-full">
                  Pasarme a {p.name}
                </Button>
              ) : null}
            </form>
          )
        })}
      </div>
      <p className="text-[12.5px] text-muted">
        Pagás en Mercado Pago con tarjeta, en pesos. Se renueva solo y lo cancelás cuando quieras desde acá.
        {renewing && ' Si cambiás de plan, apenas pagás el nuevo se cancela el anterior: no se cobra doble.'}
        {!canManage && ' Sólo el dueño o la dueña de la cuenta puede cambiar el plan.'}
      </p>
    </div>
  )
}

/** Cancelar la renovación, con confirmación. */
export function CancelSubscription({ action, planName, until }: { action: Action; planName: string; until: string | null }) {
  const [confirming, setConfirming] = useState(false)
  const [state, formAction, pending] = useActionState(action, initialFormState)
  if (state.ok) return <FormFeedback state={state} />
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="w-fit text-[14px] font-semibold text-muted underline-offset-4 hover:text-danger hover:underline">
        Cancelar la renovación
      </button>
    )
  }
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-[16px] bg-surface-2 p-4 ring-1 ring-line-2">
      <FormFeedback state={state} />
      <p className="text-[14.5px] leading-snug">
        <b className="font-bold">¿Cancelar la renovación de {planName}?</b> No se te cobra más.
        {until ? ` Seguís con ${planName} hasta el ${until} y después pasás a Gratis.` : ' Después pasás a Gratis.'} No perdés ningún dato.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="dark" size="md" loading={pending}>Sí, cancelar</Button>
        <Button type="button" variant="secondary" size="md" onClick={() => setConfirming(false)}>Volver</Button>
      </div>
    </form>
  )
}
