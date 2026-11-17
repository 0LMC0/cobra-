import Link from 'next/link'
import { ChevronRight, Mail, Repeat } from 'lucide-react'
import type { ChargeStatus } from '@/domain/charge-status'
import { STATUS_LABEL } from '@/domain/charge-status'
import { formatDate } from '@/domain/dates'
import { formatMoneyClean as formatMoney } from '@/domain/money'
import type { ChargeView, CustomerView } from '@/server/queries'
import { WhatsAppIcon } from './whatsapp-button'
import { cn } from '@/lib/cn'

/** Piezas de presentación de clientes y cobros. Sin datos de servidor: reciben todo por props. */

const STATUS_CLS: Record<ChargeStatus, string> = {
  overdue: 'bg-danger-soft text-danger',
  partially_paid: 'bg-purple-soft text-purple',
  due_soon: 'bg-warn-soft text-warn',
  pending: 'bg-info-soft text-info',
  paid: 'bg-ok-soft text-ok',
  draft: 'bg-surface-3 text-muted',
  cancelled: 'bg-surface-3 text-muted',
}

export function StatusBadge({ status }: { status: ChargeStatus }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-bold whitespace-nowrap', STATUS_CLS[status])}>{STATUS_LABEL[status]}</span>
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}

export function Owed({ owed, className }: { owed: CustomerView['owed']; className?: string }) {
  if (owed.length === 0) return <span className={cn('text-[14px] font-semibold text-ok', className)}>Al día</span>
  return (
    <span className={cn('flex flex-col items-end', className)}>
      {owed.map((o) => (
        <span key={o.currency} className="money text-[15.5px]">{formatMoney(o.balanceMinor, o.currency)}</span>
      ))}
    </span>
  )
}

export function CustomersTable({ customers, hrefBase = '/app/clientes' }: { customers: CustomerView[]; hrefBase?: string }) {
  return (
    <ul className="overflow-hidden rounded-[20px] bg-surface ring-1 ring-line-2">
      {customers.map((c) => (
        <li key={c.id} className="border-b border-line last:border-b-0">
          <Link href={`${hrefBase}/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 sm:px-5">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-extrabold text-brand-text">{initials(c.name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15.5px] font-bold">{c.name}</p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-muted">
                {c.email && <span className="inline-flex items-center gap-1"><Mail className="size-3.5" />Email</span>}
                {c.whatsappNumber && <span className="inline-flex items-center gap-1"><WhatsAppIcon className="size-3.5" />WhatsApp</span>}
                {c.overdueCount > 0 && <span className="font-bold text-danger">{c.overdueCount === 1 ? '1 cobro vencido' : `${c.overdueCount} cobros vencidos`}</span>}
              </p>
            </div>
            <Owed owed={c.owed} />
            <ChevronRight aria-hidden className="size-4 shrink-0 text-faint" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function ChargeSummary({ charge }: { charge: ChargeView }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[15.5px] font-bold">{charge.concept}</p>
        <StatusBadge status={charge.status} />
        {charge.recurring && <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted"><Repeat className="size-3.5" />Todos los meses</span>}
      </div>
      <p className="mt-0.5 text-[13.5px] text-muted">
        Vence el {formatDate(charge.dueDate, { day: 'numeric', month: 'long' })}
        {charge.promisedFor && <> · prometió pagar el {formatDate(charge.promisedFor, { day: 'numeric', month: 'long' })}</>}
      </p>
      <p className="mt-1 text-[14px]">
        {charge.balanceMinor === 0 ? (
          <span className="text-muted">Pagó <span className="money text-ink">{formatMoney(charge.amountMinor, charge.currency)}</span></span>
        ) : (
          <>
            <span className="money">{formatMoney(charge.balanceMinor, charge.currency)}</span>
            {charge.paidMinor > 0 && (
              <span className="text-muted"> de {formatMoney(charge.amountMinor, charge.currency)} · ya pagó {formatMoney(charge.paidMinor, charge.currency)}</span>
            )}
          </>
        )}
      </p>
    </div>
  )
}
