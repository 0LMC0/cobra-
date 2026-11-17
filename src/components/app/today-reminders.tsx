import { Mail } from 'lucide-react'
import { formatMoneyClean as formatMoney, type CurrencyCode } from '@/domain/money'
import type { EmailStatus, HomeReminder } from '@/domain/home'
import type { WhatsAppMoment } from '@/domain/whatsapp'
import { WhatsAppButton } from './whatsapp-button'
import { cn } from '@/lib/cn'

export type TodayReminder = HomeReminder

const EMAIL_LABEL: Record<EmailStatus, { text: string; cls: string }> = {
  sent: { text: 'El email ya salió', cls: 'text-ok' },
  today: { text: 'El email sale hoy', cls: 'text-muted' },
  off: { text: 'Avisos por email apagados', cls: 'text-faint' },
  none: { text: 'No tiene email cargado', cls: 'text-faint' },
}

const MOMENT_LABEL: Record<WhatsAppMoment, { text: string; cls: string }> = {
  before: { text: 'Vence pronto', cls: 'bg-info-soft text-info' },
  due: { text: 'Vence hoy', cls: 'bg-warn-soft text-warn' },
  after: { text: 'Atrasado', cls: 'bg-danger-soft text-danger' },
  final: { text: 'Último aviso', cls: 'bg-danger-soft text-danger' },
  promise: { text: 'Prometió pagar', cls: 'bg-purple-soft text-purple' },
}

/**
 * Los avisos de hoy. El email sale solo; el WhatsApp lo manda quien cobra
 * con un toque, desde su propio teléfono.
 */
export function TodayReminders({ items, businessName, transferAlias }: { items: TodayReminder[]; businessName: string; transferAlias?: string | null }) {
  if (items.length === 0) return null
  return (
    <section aria-labelledby="today-title" className="overflow-hidden rounded-[22px] bg-surface ring-1 ring-line-2">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h2 id="today-title" className="text-[19px] tracking-[-0.02em]">Para avisar hoy</h2>
        <p className="text-[13.5px] text-muted">El email sale solo. Por WhatsApp lo mandás vos con un toque, con el mensaje ya escrito.</p>
      </div>
      <ul>
        {items.map((r) => {
          const tag = MOMENT_LABEL[r.moment]
          return (
            <li key={r.id} className="flex flex-col gap-3 border-b border-line px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:px-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15.5px] font-bold">{r.customerName}</p>
                  <span className={cn('rounded-full px-2 py-0.5 text-[11.5px] font-bold', tag.cls)}>{tag.text}</span>
                </div>
                <p className="mt-0.5 text-[13.5px] text-muted">
                  <span className="money text-ink">{formatMoney(r.amountMinor, r.currency)}</span> · {r.concept}
                </p>
                <p className={cn('mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold', EMAIL_LABEL[r.emailStatus].cls)}>
                  <Mail className="size-3.5" /> {EMAIL_LABEL[r.emailStatus].text}
                </p>
              </div>
              <WhatsAppButton
                phone={r.phone}
                message={{
                  moment: r.moment,
                  customerName: r.customerName,
                  contactName: r.contactName,
                  businessName,
                  concept: r.concept,
                  amountMinor: r.amountMinor,
                  currency: r.currency,
                  dueDate: r.dueDate,
                  transferAlias,
                }}
                className="w-full sm:w-auto"
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
