'use client'

import { useState } from 'react'
import type { MonthBar } from '@/domain/home'
import { formatMoneyClean, type CurrencyCode } from '@/domain/money'
import { cn } from '@/lib/cn'

/**
 * Cobrado por mes, últimos 6 meses. Una sola serie (sin leyenda: el título la nombra),
 * barras finas con punta redondeada, el mes actual destacado y su valor escrito;
 * el resto se lee al pasar el mouse o tocar. Debajo, la misma info como tabla para lectores de pantalla.
 */
export function CollectedChart({ bars, currency }: { bars: MonthBar[]; currency: CurrencyCode }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...bars.map((b) => b.collectedMinor), 1)
  const current = bars[bars.length - 1]
  const previous = bars.slice(0, -1).filter((b) => b.collectedMinor > 0)
  const avg = previous.length ? Math.round(previous.reduce((s, b) => s + b.collectedMinor, 0) / previous.length) : null
  const shown = hover ?? bars.length - 1
  const H = 132

  return (
    <section aria-labelledby="cobrado-title" className="rounded-[22px] bg-surface p-5 ring-1 ring-line-2 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="cobrado-title" className="text-[17px] font-bold">Cobrado por mes</h2>
          <p className="text-[13px] text-muted">Pagos que anotaste, en {currency}. Últimos 6 meses.</p>
        </div>
        <div className="text-right" aria-live="polite">
          <p className="money text-[22px] leading-none">{formatMoneyClean(bars[shown].collectedMinor, currency)}</p>
          <p className="mt-1 text-[12.5px] font-semibold text-muted first-letter:uppercase">
            {bars[shown].current ? 'este mes' : bars[shown].label}
            {bars[shown].current && avg !== null && (
              <> · promedio anterior {formatMoneyClean(avg, currency)}</>
            )}
          </p>
        </div>
      </div>

      <div className="relative mt-5" style={{ height: H + 24 }} onMouseLeave={() => setHover(null)}>
        {/* Línea base y una guía tenue a la mitad: recesivas. */}
        <div aria-hidden className="absolute inset-x-0 border-t border-line" style={{ top: H }} />
        <div aria-hidden className="absolute inset-x-0 border-t border-dashed border-line/70" style={{ top: H / 2 }} />
        <div className="absolute inset-x-0 top-0 grid h-full grid-cols-6 gap-2 sm:gap-4">
          {bars.map((b, i) => {
            const h = b.collectedMinor > 0 ? Math.max(4, Math.round((b.collectedMinor / max) * (H - 8))) : 0
            const active = shown === i
            return (
              <button
                key={b.month}
                type="button"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={() => setHover(i)}
                aria-label={`${b.label}: ${formatMoneyClean(b.collectedMinor, currency)}`}
                className="group relative flex h-full flex-col items-center justify-end rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span className="flex w-full justify-center" style={{ height: H }}>
                  <span className="mt-auto flex w-full max-w-[34px] items-end justify-center">
                    <span
                      className={cn(
                        'block w-full rounded-t-[4px] transition-colors',
                        b.current ? 'bg-brand' : active ? 'bg-brand/70' : 'bg-brand/35',
                      )}
                      style={{ height: h }}
                    />
                  </span>
                </span>
                <span className={cn('mt-2 text-[12px] font-semibold first-letter:uppercase', b.current ? 'text-ink' : 'text-muted')}>{b.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {current.collectedMinor === 0 && avg === null && (
        <p className="mt-3 text-[13px] text-muted">Cuando anotes pagos con “Pagó”, vas a ver acá cuánto cobrás cada mes.</p>
      )}

      <table className="sr-only">
        <caption>Cobrado por mes en {currency}</caption>
        <tbody>
          {bars.map((b) => (
            <tr key={b.month}><th scope="row">{b.label}</th><td>{formatMoneyClean(b.collectedMinor, currency)}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
