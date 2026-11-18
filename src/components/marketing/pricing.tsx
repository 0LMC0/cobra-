'use client'

import { useState } from 'react'
import { Check, Lock } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { ANNUAL_DISCOUNT, FREE_PLAN, PLANS, formatPlanAmount, formatPlanPrice, monthlyPriceFor, yearlyTotalFor, type BillingInterval } from '@/config/plans'
import { cn } from '@/lib/cn'

/**
 * Precios en pesos, como los muestran las apps grandes (Notion, Canva, Slack):
 * un solo selector Mensual / Anual que arranca en Anual, el precio por mes grande,
 * el mensual tachado al lado y, abajo, cuánto se paga por año.
 */
export function Pricing() {
  const [interval, setBillingInterval] = useState<BillingInterval>('year')
  const discount = Math.round(ANNUAL_DISCOUNT * 100)

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-col items-start gap-2">
        <div role="radiogroup" aria-label="Frecuencia de pago" className="inline-flex rounded-full border-[1.5px] border-ink bg-surface p-1 text-[14.5px] font-bold">
          <IntervalOption checked={interval === 'month'} onSelect={() => setBillingInterval('month')}>Mensual</IntervalOption>
          <IntervalOption checked={interval === 'year'} onSelect={() => setBillingInterval('year')}>
            Anual
            <span className={cn('ml-2 rounded-full px-2 py-0.5 text-[12px] font-extrabold', interval === 'year' ? 'bg-marker text-ink' : 'bg-ok-soft text-ok')}>
              Ahorrá {discount}%
            </span>
          </IntervalOption>
        </div>
        <p className="text-[13.5px] font-semibold text-muted">
          {interval === 'year' ? 'Pagando por año, el precio queda fijo durante 12 meses.' : 'Pagás mes a mes y cancelás cuando quieras.'}
        </p>
      </div>

      <div className="grid w-full grid-cols-1 items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {/* Gratis: para siempre, sin tarjeta. */}
        <article className="relative flex flex-col rounded-[22px] border-[1.5px] border-line-2 bg-surface p-7">
          <h3 className="text-[24px] tracking-[-0.03em]">{FREE_PLAN.name}</h3>
          <p className="mt-0.5 text-[14.5px] text-muted">{FREE_PLAN.tagline}</p>
          <Price amount={0} suffix="para siempre" />
          <p className="mt-2 min-h-10 text-[13px] font-semibold text-muted">Sin tarjeta</p>
          <ButtonLink href="/registro" size="lg" variant="secondary" className="mt-5 w-full">Empezá gratis</ButtonLink>
          <ul className="mt-7 flex flex-col gap-3 border-t border-line-2 pt-6 text-[14.5px]">
            {FREE_PLAN.features.map((f) => (
              <li key={f.label} className={cn('flex items-start gap-2.5 font-semibold', !f.available && 'text-faint')}>
                {f.available ? <Check className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={3} /> : <Lock className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />}
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
        </article>

        {PLANS.map((p) => {
          const monthly = monthlyPriceFor(p, 'month', 'ARS')
          const price = monthlyPriceFor(p, interval, 'ARS')
          return (
            <article key={p.id} className={cn('relative flex flex-col rounded-[22px] bg-surface p-7', p.highlighted ? 'hard' : 'border-[1.5px] border-line-2')}>
              {p.highlighted && (
                <span className="absolute -top-3.5 left-6 rounded-[8px] border-[1.5px] border-ink bg-marker px-2.5 py-1 text-[12px] font-extrabold whitespace-nowrap">
                  Recomendado: sin tope de avisos
                </span>
              )}
              <h3 className="text-[24px] tracking-[-0.03em]">{p.name}</h3>
              <p className="mt-0.5 text-[14.5px] text-muted">{p.tagline}</p>
              <Price amount={price} suffix="por mes" was={interval === 'year' ? monthly : null} />
              <p className="mt-2 min-h-10 text-[13px] leading-snug font-semibold text-muted">
                {interval === 'year'
                  ? <>Pagás {formatPlanPrice(yearlyTotalFor(p, 'ARS'), 'ARS')} por año.<br />Precio fijo por 12 meses.</>
                  : <>Se cobra todos los meses.<br />Cancelás cuando quieras.</>}
              </p>
              <ButtonLink href="/registro" size="lg" variant={p.highlighted ? 'primary' : 'secondary'} className="mt-5 w-full">
                Empezá gratis
              </ButtonLink>
              <p className="mt-2 text-center text-[12.5px] font-semibold text-muted">Te pasás a {p.name} cuando quieras, con Mercado Pago.</p>
              <ul className="mt-7 flex flex-col gap-3 border-t border-line-2 pt-6 text-[14.5px]">
                {/* Sólo lo que ya existe: lo "próximamente" confunde al elegir. */}
                {p.features.filter((f) => f.available).map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5 font-semibold">
                    <Check className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={3} />
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>

      <p className="text-[14px] font-semibold text-muted">Precios en pesos argentinos, sin impuestos. Los planes pagos se cancelan cuando quieras.</p>
    </div>
  )
}

/** "$ 15.120 por mes", con el precio mensual tachado al lado cuando se paga por año. */
function Price({ amount, suffix, was = null }: { amount: number; suffix: string; was?: number | null }) {
  return (
    <p className="mt-6 flex flex-wrap items-end gap-x-1.5" aria-label={`${formatPlanPrice(amount, 'ARS')} ${suffix}${was ? `, antes ${formatPlanPrice(was, 'ARS')}` : ''}`}>
      <span className="mb-2 text-[15px] font-bold text-muted" aria-hidden>$</span>
      <span className="money text-[46px] leading-none" aria-hidden>{formatPlanAmount(amount, 'ARS')}</span>
      <span className="mb-1.5 text-[14px] font-semibold text-muted" aria-hidden>{suffix}</span>
      {was && <s className="mb-1.5 text-[15px] font-bold text-faint" aria-hidden>${formatPlanAmount(was, 'ARS')}</s>}
    </p>
  )
}

function IntervalOption({ checked, onSelect, children }: { checked: boolean; onSelect: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" role="radio" aria-checked={checked} onClick={onSelect}
      className={cn('inline-flex items-center rounded-full px-4 py-2 transition-colors', checked ? 'bg-navy text-white' : 'text-muted hover:text-ink')}
    >
      {children}
    </button>
  )
}
