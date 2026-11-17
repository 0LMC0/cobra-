import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Plus, UserPlus } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Alert } from '@/components/ui/misc'
import { isCollectible } from '@/domain/charge-status'
import type { CurrencyCode } from '@/domain/money'
import type { WhatsAppMoment } from '@/domain/whatsapp'
import type { ChargeView, CustomerView } from '@/server/queries'
import type { FormState } from '@/server/actions/form-state'
import { ChargeForm, CustomerForm, PayButton, PromiseButton } from './billing-forms'
import { ChargeSummary, CustomersTable, Owed, initials } from './billing-ui'
import { WhatsAppButton } from './whatsapp-button'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

/* ───────────── Lista de clientes ───────────── */

export function CustomersListView({ customers, newHref = '/app/clientes/nuevo', hrefBase }: { customers: CustomerView[]; newHref?: string; hrefBase?: string }) {
  const withDebt = customers.filter((c) => c.owed.length > 0).length
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] sm:text-[40px]">Clientes</h1>
          <p className="text-[14.5px] text-muted">
            {customers.length === 0 ? 'Todavía no cargaste ninguno.' : `${customers.length} ${customers.length === 1 ? 'cliente' : 'clientes'} · ${withDebt} con saldo pendiente`}
          </p>
        </div>
        {customers.length > 0 && (
          <ButtonLink href={newHref}><Plus className="size-4" /> Nuevo cliente</ButtonLink>
        )}
      </header>

      {customers.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-[22px] border-2 border-dashed border-line-2 px-6 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-[18px] bg-brand-soft text-brand-text"><UserPlus className="size-6" /></span>
          <h2 className="text-[19px] tracking-[-0.02em]">Cargá tu primer cliente</h2>
          <p className="max-w-sm text-[14.5px] text-muted">Con su email o su celular, Cobra+ le puede recordar que te pague.</p>
          <ButtonLink href={newHref} size="lg" className="mt-2"><Plus className="size-4" /> Nuevo cliente</ButtonLink>
        </section>
      ) : (
        <CustomersTable customers={customers} hrefBase={hrefBase} />
      )}
    </div>
  )
}

/* ───────────── Cliente nuevo ───────────── */

export function NewCustomerView({ action, backHref = '/app/clientes' }: { action: Action; backHref?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link href={backHref} className="inline-flex w-fit items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" /> Clientes</Link>
      <header>
        <h1 className="text-[32px] sm:text-[38px]">Nuevo cliente</h1>
        <p className="text-[14.5px] text-muted">Con un email o un celular alcanza para empezar. Lo demás lo completás cuando quieras.</p>
      </header>
      <section className="rounded-[22px] bg-surface p-5 ring-1 ring-line-2 sm:p-7">
        <CustomerForm action={action} />
      </section>
    </div>
  )
}

/* ───────────── Ficha del cliente ───────────── */

export function momentFor(c: ChargeView, today: string): WhatsAppMoment {
  if (c.promisedFor) return 'promise'
  if (c.status === 'overdue') return 'after'
  if (c.dueDate === today) return 'due'
  return 'before'
}

export function CustomerDetailView({
  customer, charges, today, businessName, transferAlias, defaultCurrency, chargeAction, payAction, promiseAction, clearPromiseAction, justCreated, backHref = '/app/clientes',
}: {
  customer: CustomerView
  charges: ChargeView[]
  today: string
  businessName: string
  transferAlias?: string | null
  defaultCurrency: CurrencyCode
  chargeAction: Action
  payAction: Action
  promiseAction?: Action
  clearPromiseAction?: Action
  justCreated?: boolean
  backHref?: string
}) {
  const open = charges.filter((c) => isCollectible(c.status))
  const settled = charges.filter((c) => !isCollectible(c.status))

  return (
    <div className="flex flex-col gap-6">
      <Link href={backHref} className="inline-flex w-fit items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" /> Clientes</Link>

      {customer.optedOut && (
        <Alert tone="warn" title="Se dio de baja de los avisos">
          Pidió no recibir más recordatorios automáticos por email. Podés seguir escribiéndole por WhatsApp o como prefieras.
        </Alert>
      )}

      {justCreated && <Alert tone="ok" title="Cliente guardado">Ahora creale su primer cobro: con eso Cobra+ ya sabe cuándo avisarle.</Alert>}

      <header className="flex flex-wrap items-center gap-4">
        <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-soft text-[18px] font-extrabold text-brand-text">{initials(customer.name)}</span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] sm:text-[34px]">{customer.name}</h1>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-muted">
            {customer.contactName && <span>{customer.contactName}</span>}
            {customer.email && <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" />{customer.email}</span>}
            {customer.phone && <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5" />{customer.phone}</span>}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-semibold text-muted">Debe</p>
          <Owed owed={customer.owed} className="items-end text-[20px]" />
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section aria-labelledby="open-title" className="overflow-hidden rounded-[22px] bg-surface ring-1 ring-line-2">
          <h2 id="open-title" className="border-b border-line px-5 py-4 text-[19px] tracking-[-0.02em] sm:px-6">Para cobrar</h2>
          {open.length === 0 ? (
            <p className="px-5 py-8 text-center text-[14.5px] text-muted sm:px-6">No tiene nada pendiente. Creale un cobro desde el formulario.</p>
          ) : (
            <ul>
              {open.map((c) => (
                <li key={c.id} className="flex flex-col gap-3 border-b border-line px-5 py-4 last:border-b-0 sm:px-6">
                  <ChargeSummary charge={c} />
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <PayButton action={payAction} chargeId={c.id} balanceMinor={c.balanceMinor} currency={c.currency} today={today} />
                    {promiseAction && clearPromiseAction && <PromiseButton action={promiseAction} clearAction={clearPromiseAction} chargeId={c.id} promisedFor={c.promisedFor} today={today} />}
                    {customer.whatsappOk && (
                      <WhatsAppButton
                        phone={customer.whatsappNumber ? `+${customer.whatsappNumber}` : null}
                        message={{
                          moment: momentFor(c, today), customerName: customer.name, contactName: customer.contactName, businessName,
                          concept: c.concept, amountMinor: c.balanceMinor, currency: c.currency, dueDate: c.dueDate, promisedFor: c.promisedFor, transferAlias,
                        }}
                        className="w-full sm:w-auto"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {settled.length > 0 && (
            <details className="border-t border-line">
              <summary className="cursor-pointer px-5 py-3.5 text-[14px] font-bold text-muted hover:text-ink sm:px-6">Pagados ({settled.length})</summary>
              <ul>
                {settled.map((c) => (
                  <li key={c.id} className="border-t border-line px-5 py-3.5 sm:px-6"><ChargeSummary charge={c} /></li>
                ))}
              </ul>
            </details>
          )}
        </section>

        <aside aria-labelledby="new-charge-title" className="rounded-[22px] bg-surface p-5 ring-1 ring-line-2 sm:p-6">
          <h2 id="new-charge-title" className="mb-4 text-[19px] tracking-[-0.02em]">Nuevo cobro</h2>
          <ChargeForm action={chargeAction} customerId={customer.id} defaultCurrency={defaultCurrency} defaultDueDate={today} />
        </aside>
      </div>
    </div>
  )
}
