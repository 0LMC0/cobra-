import Link from 'next/link'
import { FileText, Users } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { isCollectible } from '@/domain/charge-status'
import type { ChargeListItem } from '@/server/queries'
import type { FormState } from '@/server/actions/form-state'
import { PayButton, PromiseButton } from './billing-forms'
import { ChargeSummary } from './billing-ui'
import { momentFor } from './customers-views'
import { WhatsAppButton } from './whatsapp-button'
import { cn } from '@/lib/cn'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

/** Todos los cobros en un solo lugar: lo que falta cobrar arriba, lo atrasado primero. */
export function ChargesView({
  charges, view, today, businessName, transferAlias, payAction, promiseAction, clearPromiseAction, hrefBase = '/app',
}: {
  charges: ChargeListItem[]
  view: 'pendientes' | 'pagados'
  today: string
  businessName: string
  transferAlias?: string | null
  payAction: Action
  promiseAction?: Action
  clearPromiseAction?: Action
  hrefBase?: string
}) {
  const pending = charges
    .filter((c) => isCollectible(c.status))
    .sort((a, b) => Number(b.status === 'overdue') - Number(a.status === 'overdue') || a.dueDate.localeCompare(b.dueDate))
  const paid = charges.filter((c) => !isCollectible(c.status)).sort((a, b) => b.dueDate.localeCompare(a.dueDate))
  const list = view === 'pagados' ? paid : pending
  const overdue = pending.filter((c) => c.status === 'overdue').length

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[34px] sm:text-[40px]">Cobros</h1>
        <p className="text-[14.5px] text-muted">
          {charges.length === 0
            ? 'Todavía no creaste ninguno.'
            : pending.length === 0
              ? 'Nadie te debe nada.'
              : `${pending.length} para cobrar${overdue ? ` · ${overdue} atrasado${overdue === 1 ? '' : 's'}` : ''}`}
        </p>
      </header>

      {charges.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-[22px] border-2 border-dashed border-line-2 px-6 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-[18px] bg-brand-soft text-brand-text"><FileText className="size-6" /></span>
          <h2 className="text-[19px] tracking-[-0.02em]">Los cobros se crean desde cada cliente</h2>
          <p className="max-w-sm text-[14.5px] text-muted">Entrá a un cliente y poné cuánto te paga y cuándo vence.</p>
          <ButtonLink href={`${hrefBase}/clientes`} size="lg" className="mt-2"><Users className="size-4" /> Ir a clientes</ButtonLink>
        </section>
      ) : (
        <>
          <nav aria-label="Filtrar cobros" className="flex gap-1.5 self-start rounded-full bg-surface p-1 ring-1 ring-line-2">
            {([['pendientes', `Para cobrar (${pending.length})`], ['pagados', `Pagados (${paid.length})`]] as const).map(([v, label]) => (
              <Link
                key={v}
                href={v === 'pendientes' ? `${hrefBase}/cobros` : `${hrefBase}/cobros?ver=pagados`}
                aria-current={view === v ? 'page' : undefined}
                className={cn('rounded-full px-4 py-2 text-[14px] font-bold', view === v ? 'bg-brand text-white' : 'text-muted hover:text-ink')}
              >
                {label}
              </Link>
            ))}
          </nav>

          {list.length === 0 ? (
            <p className="rounded-[16px] bg-ok-soft px-4 py-3 text-[14.5px] font-semibold text-ok">
              {view === 'pagados' ? 'Todavía no registraste pagos.' : 'Nadie te debe nada. Bien ahí.'}
            </p>
          ) : (
            <ul className="overflow-hidden rounded-[22px] bg-surface ring-1 ring-line-2">
              {list.map((c) => (
                <li key={c.id} className="flex flex-col gap-3 border-b border-line px-5 py-4 last:border-b-0 sm:px-6">
                  <Link href={`${hrefBase}/clientes/${c.customerId}`} className="w-fit text-[13px] font-bold text-brand-text hover:underline">{c.customerName}</Link>
                  <ChargeSummary charge={c} />
                  {view === 'pendientes' && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <PayButton action={payAction} chargeId={c.id} balanceMinor={c.balanceMinor} currency={c.currency} today={today} />
                    {promiseAction && clearPromiseAction && <PromiseButton action={promiseAction} clearAction={clearPromiseAction} chargeId={c.id} promisedFor={c.promisedFor} today={today} />}
                      {c.customerWhatsapp && (
                        <WhatsAppButton
                          phone={c.customerWhatsapp}
                          message={{
                            moment: momentFor(c, today), customerName: c.customerName, contactName: c.customerContact, businessName,
                            concept: c.concept, amountMinor: c.balanceMinor, currency: c.currency, dueDate: c.dueDate, promisedFor: c.promisedFor, transferAlias,
                          }}
                          className="w-full sm:w-auto"
                        />
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
