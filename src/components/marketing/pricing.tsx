'use client'

import { useState } from 'react'
import { Check, Clock3, Lock } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import {
  ANNUAL_DISCOUNT, FREE_PLAN, PLANS, formatPlanAmount, formatPlanPrice, monthlyPriceFor, yearlyTotalFor,
  type BillingInterval, type Currency,
} from '@/config/plans'
import { cn } from '@/lib/cn'

const CURRENCIES: { id: Currency; label: string }[] = [
  { id: 'ARS', label: 'Pesos' },
  { id: 'USD', label: 'Dólares' },
]

export function Pricing() {
  // Arranca en pesos: es lo que espera ver quien cobra en Argentina.
  const [currency, setCurrency] = useState<Currency>('ARS')
  const [interval, setBillingInterval] = useState<BillingInterval>('month')
  const symbol = currency === 'ARS' ? '$' : 'US$'

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Moneda">
          {CURRENCIES.map((c) => (
            <SegmentedOption key={c.id} checked={currency === c.id} onSelect={() => setCurrency(c.id)}>
              {c.label} <span className={cn('ml-1 text-[11.5px] font-extrabold', currency === c.id ? 'text-white/70' : 'text-faint')}>{c.id}</span>
            </SegmentedOption>
          ))}
        </Segmented>
        <Segmented label="Frecuencia de pago">
          <SegmentedOption checked={interval === 'month'} onSelect={() => setBillingInterval('month')}>Pago mensual</SegmentedOption>
          <SegmentedOption checked={interval === 'year'} onSelect={() => setBillingInterval('year')}>
            Pago anual{' '}
            <span className={cn('ml-1 rounded-[6px] px-1.5 py-0.5 text-[11.5px] font-extrabold', interval === 'year' ? 'bg-marker text-ink' : 'bg-brand-soft text-brand-text')}>
              −{ANNUAL_DISCOUNT * 100}%
            </span>
          </SegmentedOption>
        </Segmented>
      </div>

      <div className="grid w-full grid-cols-1 items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {/* Gratis: para siempre, sin tarjeta. */}
        <article className="relative flex flex-col rounded-[22px] border-[1.5px] border-line-2 bg-surface p-7">
          <h3 className="text-[24px] tracking-[-0.03em]">{FREE_PLAN.name}</h3>
          <p className="mt-0.5 text-[14.5px] text-muted">{FREE_PLAN.tagline}</p>
          <p className="mt-6 flex flex-wrap items-end gap-x-1.5" aria-label="Gratis, para siempre">
            <span className="mb-2 text-[15px] font-bold text-muted" aria-hidden>{symbol}</span>
            <span className={cn('money leading-none', currency === 'ARS' ? 'text-[46px]' : 'text-[54px]')} aria-hidden>0</span>
            <span className="mb-1.5 text-[14px] font-semibold text-muted" aria-hidden>para siempre</span>
          </p>
          <p className="mt-2 min-h-5 text-[13px] font-semibold text-muted">Sin tarjeta</p>
          <ButtonLink href="/registro" size="lg" variant="secondary" className="mt-6 w-full">Empezá gratis</ButtonLink>
          <ul className="mt-7 flex flex-col gap-3 border-t border-line-2 pt-6 text-[14.5px]">
            {FREE_PLAN.features.map((f) => (
              <li key={f.label} className={cn('flex items-start gap-2.5 font-semibold', !f.available && 'text-faint')}>
                {f.available
                  ? <Check className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={3} />
                  : <Lock className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />}
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
        </article>

        {PLANS.map((p) => {
          const price = monthlyPriceFor(p, interval, currency)
          return (
            <article
              key={p.id}
              className={cn(
                'relative flex flex-col rounded-[22px] bg-surface p-7',
                p.highlighted ? 'hard' : 'border-[1.5px] border-line-2',
              )}
            >
              {p.highlighted && (
                <span className="absolute -top-3.5 left-6 rounded-[8px] border-[1.5px] border-ink bg-marker px-2.5 py-1 text-[12px] font-extrabold whitespace-nowrap">
                  Recomendado: sin tope de avisos
                </span>
              )}
              <h3 className="text-[24px] tracking-[-0.03em]">{p.name}</h3>
              <p className="mt-0.5 text-[14.5px] text-muted">{p.tagline}</p>
              <p className="mt-6 flex flex-wrap items-end gap-x-1.5" aria-label={`${formatPlanPrice(price, currency)} por mes`}>
                <span className="mb-2 text-[15px] font-bold text-muted" aria-hidden>{symbol}</span>
                <span className={cn('money leading-none', currency === 'ARS' ? 'text-[46px]' : 'text-[54px]')} aria-hidden>{formatPlanAmount(price, currency)}</span>
                <span className="mb-1.5 text-[14px] font-semibold text-muted" aria-hidden>por mes</span>
              </p>
              <p className="mt-2 min-h-5 text-[13px] font-semibold text-muted">
                {interval === 'year' ? `${formatPlanPrice(yearlyTotalFor(p, currency), currency)} por año, en un pago` : 'Se paga mes a mes'}
              </p>
              <ButtonLink href="/registro" size="lg" variant={p.highlighted ? 'primary' : 'secondary'} className="mt-6 w-full">
                Empezá gratis
              </ButtonLink>
              <p className="mt-2 text-center text-[12.5px] font-semibold text-muted">Te pasás a {p.name} con Mercado Pago (muy pronto).</p>
              <ul className="mt-7 flex flex-col gap-3 border-t border-line-2 pt-6 text-[14.5px]">
                {p.features.map((f) => (
                  <li key={f.label} className={cn('flex items-start gap-2.5 font-semibold', !f.available && 'text-faint')}>
                    {f.available
                      ? <Check className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={3} />
                      : <Clock3 className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />}
                    <span>{f.label}{!f.available && <span className="ml-1.5 text-[12.5px] font-bold">(próximamente)</span>}</span>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>

      <p className="text-[14px] font-semibold text-muted">
        Los planes pagos se cancelan cuando quieras. Precios en {currency === 'ARS' ? 'pesos argentinos' : 'dólares estadounidenses'}, sin impuestos.
      </p>
    </div>
  )
}

function Segmented({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[14px] border-[1.5px] border-ink bg-surface p-1 text-[14px] font-bold">
      {children}
    </div>
  )
}

function SegmentedOption({ checked, onSelect, children }: { checked: boolean; onSelect: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" role="radio" aria-checked={checked} onClick={onSelect}
      className={cn('rounded-[10px] px-3.5 py-2 transition-colors', checked ? 'bg-navy text-white' : 'text-muted hover:text-ink')}
    >
      {children}
    </button>
  )
}
