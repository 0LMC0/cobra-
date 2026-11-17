import { Mail } from 'lucide-react'
import { formatMoneyClean as formatMoney, type CurrencyCode } from '@/domain/money'
import type { IsoDate } from '@/domain/dates'
import type { WhatsAppMoment } from '@/domain/whatsapp'
import { WhatsAppButton } from './whatsapp-button'
import { cn } from '@/lib/cn'

export type TodayReminder = {
  id: string
  customerName: string
  contactName?: string | null
  phone: string | null
  concept: string
  amountMinor: number
  currency: CurrencyCode
  dueDate: IsoDate
  moment: WhatsAppMoment
  /** El email automático de hoy (ya salió o sale hoy). */
  emailSent: boolean
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
        <p className="text-[13.5px] text-muted">El email sale solo. Por WhatsApp lo mandás vos con un toque: se abre con el mensaje escrito.</p>
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
                <p className={cn('mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold', r.emailSent ? 'text-ok' : 'text-faint')}>
                  <Mail className="size-3.5" /> {r.emailSent ? 'Email enviado' : 'Sin email cargado'}
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
