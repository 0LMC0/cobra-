import {
  Archive, ArchiveRestore, Ban, Bell, BellOff, CalendarClock, CalendarX, Check, FileText, Mail, MailWarning,
  PenLine, Repeat, RotateCcw, UserPlus, XCircle, type LucideIcon,
} from 'lucide-react'
import { formatEventTime, type TimelineEvent, type TimelineKind } from '@/domain/timeline'
import { cn } from '@/lib/cn'

const LOOK: Record<TimelineKind, { icon: LucideIcon; cls: string }> = {
  created: { icon: UserPlus, cls: 'bg-brand-soft text-brand-text' },
  charge: { icon: FileText, cls: 'bg-surface-3 text-ink' },
  generated: { icon: Repeat, cls: 'bg-surface-3 text-ink' },
  payment: { icon: Check, cls: 'bg-ok-soft text-ok' },
  payment_voided: { icon: XCircle, cls: 'bg-danger-soft text-danger' },
  reminder: { icon: Mail, cls: 'bg-info-soft text-info' },
  reminder_failed: { icon: MailWarning, cls: 'bg-danger-soft text-danger' },
  promise: { icon: CalendarClock, cls: 'bg-purple-soft text-purple' },
  promise_cleared: { icon: CalendarX, cls: 'bg-surface-3 text-muted' },
  charge_cancelled: { icon: Ban, cls: 'bg-surface-3 text-muted' },
  charge_reopened: { icon: RotateCcw, cls: 'bg-surface-3 text-ink' },
  charge_updated: { icon: PenLine, cls: 'bg-surface-3 text-ink' },
  edited: { icon: PenLine, cls: 'bg-surface-3 text-ink' },
  archived: { icon: Archive, cls: 'bg-surface-3 text-muted' },
  restored: { icon: ArchiveRestore, cls: 'bg-brand-soft text-brand-text' },
  opted_out: { icon: BellOff, cls: 'bg-warn-soft text-warn' },
  opted_in: { icon: Bell, cls: 'bg-brand-soft text-brand-text' },
  paused: { icon: BellOff, cls: 'bg-surface-3 text-muted' },
  resumed: { icon: Bell, cls: 'bg-brand-soft text-brand-text' },
}

const VISIBLE = 8

function Item({ e, timeZone }: { e: TimelineEvent; timeZone: string }) {
  const { icon: Icon, cls } = LOOK[e.kind]
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {/* línea que une los puntos */}
      <span aria-hidden className="absolute top-9 bottom-0 left-[17px] w-px bg-line-2 group-last:hidden" />
      <span className={cn('relative grid size-9 shrink-0 place-items-center rounded-full', cls)}><Icon className="size-4" /></span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-[14.5px] leading-snug font-semibold">{e.title}</p>
        {e.detail && <p className="text-[13.5px] leading-snug text-muted">{e.detail}</p>}
        <p className="mt-0.5 text-[12px] font-semibold text-faint">
          <time dateTime={e.at}>{formatEventTime(e.at, timeZone)}</time>
        </p>
      </div>
    </li>
  )
}

/** Historial del cliente: lo más nuevo arriba; lo viejo, plegado. */
export function CustomerTimeline({ events, timeZone }: { events: TimelineEvent[]; timeZone: string }) {
  const first = events.slice(0, VISIBLE)
  const rest = events.slice(VISIBLE)
  return (
    <section aria-labelledby="history-title" className="rounded-[22px] bg-surface p-5 ring-1 ring-line-2 sm:p-6">
      <h2 id="history-title" className="text-[19px] tracking-[-0.02em]">Historial</h2>
      <p className="mb-5 text-[13.5px] text-muted">Todo lo que pasó con este cliente: cobros, pagos, avisos y cambios.</p>
      <ol>
        {first.map((e) => <Item key={e.id} e={e} timeZone={timeZone} />)}
      </ol>
      {rest.length > 0 && (
        <details className="mt-5">
          <summary className="cursor-pointer text-[14px] font-bold text-muted hover:text-ink">
            Ver {rest.length === 1 ? '1 movimiento más' : `${rest.length} movimientos más`}
          </summary>
          <ol className="mt-5">
            {rest.map((e) => <Item key={e.id} e={e} timeZone={timeZone} />)}
          </ol>
        </details>
      )}
    </section>
  )
}
