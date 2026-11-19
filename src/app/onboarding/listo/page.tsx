import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ArrowRight, Plus } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { formatDate, todayIn, type IsoDate } from '@/domain/dates'
import { renderReminderEmail } from '@/domain/emails'
import type { CurrencyCode } from '@/domain/money'
import { createClient } from '@/lib/supabase/server'
import { getOrgContext } from '@/server/auth'
import { OnboardingShell } from '../shell'

export const metadata: Metadata = { title: '¡Listo!', robots: { index: false } }
export const dynamic = 'force-dynamic'

/** Cierre del onboarding: el aviso real que le va a llegar a su cliente. */
export default async function OnboardingDonePage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const ctx = await getOrgContext()
  if (!ctx) redirect('/onboarding')
  const { cliente = '' } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(cliente)) redirect('/app')

  const supabase = await createClient()
  const [{ data: customer }, { data: charge }, { data: org }] = await Promise.all([
    supabase.from('customers').select('id, name, contact_name, email').eq('org_id', ctx.org.id).eq('id', cliente).maybeSingle(),
    supabase.from('charges').select('concept, amount_minor, currency, due_date').eq('org_id', ctx.org.id).eq('customer_id', cliente).order('due_date').limit(1).maybeSingle(),
    supabase.from('organizations').select('reminders_enabled, transfer_alias').eq('id', ctx.org.id).maybeSingle(),
  ])
  if (!customer || !charge) redirect(`/app/clientes/${cliente}`)

  const today = todayIn(ctx.org.timezone)
  const due = charge.due_date as IsoDate
  const email = renderReminderEmail({
    moment: due > today ? 'before' : due === today ? 'due' : 'after',
    customerName: customer.name as string, contactName: customer.contact_name as string | null, businessName: ctx.org.name,
    concept: charge.concept as string, amountMinor: Number(charge.amount_minor), currency: charge.currency as CurrencyCode, dueDate: due,
    transferAlias: (org?.transfer_alias as string | null) ?? null, unsubscribeUrl: '#', paidUrl: '#',
  })
  const on = Boolean(org?.reminders_enabled) && Boolean(customer.email)

  return (
    <OnboardingShell
      step={4}
      wide
      title={on ? '¡Listo! Cobra+ ya está trabajando' : '¡Listo! Tu primer cobro está cargado'}
      intro={on
        ? <>Así le va a llegar el aviso a <b className="text-ink">{customer.name}</b>, antes del {formatDate(due, { day: 'numeric', month: 'long' })}. Vos no tenés que hacer nada más.</>
        : <>Cuando prendas los avisos, así le va a llegar a <b className="text-ink">{customer.name}</b>. {customer.email ? '' : 'Cargale un email para que Cobra+ le pueda escribir.'}</>}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <div className="overflow-hidden rounded-[22px] ring-1 ring-line-2">
          <div className="border-b border-line bg-surface px-4 py-3 text-[13px]">
            <p><span className="text-muted">De:</span> <b>{ctx.org.name} vía Cobra+</b></p>
            <p><span className="text-muted">Asunto:</span> <b>{email.subject}</b></p>
          </div>
          <iframe title="El aviso que le llega a tu cliente" srcDoc={email.html} sandbox="" className="h-[560px] w-full bg-[#fbf7f1]" />
        </div>
        <div className="flex flex-col gap-3">
          <ButtonLink href="/app" size="lg" className="w-full">Ir a mi panel <ArrowRight className="size-4" /></ButtonLink>
          <ButtonLink href="/app/clientes/nuevo" size="lg" variant="secondary" className="w-full"><Plus className="size-4" /> Cargar otro cliente</ButtonLink>
          <p className="text-[13px] leading-relaxed text-muted">
            Todo se cambia después: los avisos y tu resumen en Configuración, y cada cliente desde su ficha.
          </p>
        </div>
      </div>
    </OnboardingShell>
  )
}
