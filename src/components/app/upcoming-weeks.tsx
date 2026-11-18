import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import type { UpcomingWeek } from '@/domain/home'
import { formatMoneyClean, type CurrencyCode } from '@/domain/money'

/**
 * Lo que vence en las próximas 4 semanas: cuánta plata te entra y cuándo.
 * Cada semana muestra su total (por moneda) y una barra con el peso de la moneda
 * principal; se abre para ver quién paga.
 */
export function UpcomingWeeks({ weeks, currency }: { weeks: UpcomingWeek[]; currency: CurrencyCode }) {
  const main = (w: UpcomingWeek) => w.totals.find((t) => t.currency === currency)?.minor ?? 0
  const max = Math.max(...weeks.map(main), 1)
  const fmt = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })
  const day = (d: string) => fmt.format(new Date(`${d}T12:00:00Z`)).replace('.', '')
  const empty = weeks.every((w) => w.items.length === 0)

  return (
    <section aria-labelledby="vence-title" className="rounded-[22px] bg-surface p-5 ring-1 ring-line-2 sm:p-6">
      <h2 id="vence-title" className="text-[17px] font-bold">Lo que vence en las próximas semanas</h2>
      <p className="text-[13px] text-muted">Cuánta plata te entra y cuándo. Si alguien prometió pagar otro día, cuenta esa fecha.</p>

      {empty ? (
        <p className="mt-4 rounded-[14px] bg-surface-2 px-4 py-3 text-[14px] text-muted">No vence nada en las próximas 4 semanas.</p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-line">
          {weeks.map((w) => (
            <li key={w.from}>
              <details className="group [&_summary::-webkit-details-marker]:hidden" open={w.label === 'Esta semana' && w.items.length > 0 && w.items.length <= 5}>
                <summary className={`flex list-none items-center gap-3 py-3 ${w.items.length ? 'cursor-pointer' : 'cursor-default'}`}>
                  <div className="w-[9.5rem] shrink-0 sm:w-[11rem]">
                    <p className="text-[14.5px] font-bold">{w.label}</p>
                    <p className="text-[12.5px] text-muted">
                      {w.items.length === 0 ? 'Nada' : `${w.items.length} ${w.items.length === 1 ? 'cobro' : 'cobros'}`}
                    </p>
                  </div>
                  <div className="hidden h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3 sm:block" aria-hidden>
                    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round((main(w) / max) * 100)}%` }} />
                  </div>
                  <div className="ml-auto text-right">
                    {w.totals.length === 0
                      ? <p className="money text-[16px] text-faint">—</p>
                      : w.totals.map((t) => <p key={t.currency} className="money text-[16px] leading-tight">{formatMoneyClean(t.minor, t.currency)}</p>)}
                  </div>
                  {w.items.length > 0 && <ChevronDown aria-hidden className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />}
                </summary>
                {w.items.length > 0 && (
                  <ul className="mb-3 flex flex-col gap-1 rounded-[14px] bg-surface-2 p-2">
                    {w.items.map((i) => (
                      <li key={i.chargeId}>
                        <Link href={`/app/clientes/${i.customerId}`} className="flex items-center gap-3 rounded-[10px] px-2.5 py-2 hover:bg-surface">
                          <span className="w-14 shrink-0 text-[12.5px] font-semibold text-muted first-letter:uppercase">{day(i.date)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-bold">{i.customerName}</span>
                            <span className="block truncate text-[12.5px] text-muted">{i.concept}{i.promised && ' · prometió pagar'}</span>
                          </span>
                          <span className="money shrink-0 text-[14px]">{formatMoneyClean(i.balanceMinor, i.currency)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
