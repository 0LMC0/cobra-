import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CustomerDetailView } from '@/components/app/customers-views'
import { requireOrg } from '@/server/auth'
import { getCustomer, getCustomerTimeline, getOrgPlan } from '@/server/queries'
import { planIncludes } from '@/config/plans'
import { clearPromise, createCharge, recordPayment, setCustomerArchived, setPromise } from '@/server/actions/billing'
import { todayIn } from '@/domain/dates'
import { renderReminderEmail } from '@/domain/emails'
import { isCurrency } from '@/domain/money'
import { hasRole } from '@/domain/roles'
import { createClient } from '@/lib/supabase/server'
import { turnOnReminders } from '@/server/actions/reminder-settings'

export const metadata: Metadata = { title: 'Cliente' }

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nuevo?: string; guardado?: string; avisos?: string }> }) {
  const { org, role } = await requireOrg('viewer')
  const { id } = await params
  const { nuevo, guardado, avisos } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const today = todayIn(org.timezone)
  const data = await getCustomer(org.id, id, today)
  if (!data) notFound()
  const supabase = await createClient()
  const [timeline, plan, { data: sending }] = await Promise.all([
    getCustomerTimeline(org.id, { id: data.customer.id, createdAt: data.customer.createdAt }),
    getOrgPlan(org.id),
    supabase.from('organizations').select('reminders_enabled, transfer_alias').eq('id', org.id).maybeSingle(),
  ])
  // Vista previa del aviso: el cobro abierto más próximo, con el texto que le llegaría hoy.
  const next = data.charges.filter((c) => c.balanceMinor > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  const emailPreview = next && data.customer.email
    ? renderReminderEmail({
        moment: next.promisedFor && next.promisedFor >= today ? 'promise' : next.dueDate > today ? 'before' : next.dueDate === today ? 'due' : 'after',
        customerName: data.customer.name, contactName: data.customer.contactName, businessName: org.name,
        concept: next.concept, amountMinor: next.balanceMinor, currency: next.currency, dueDate: next.dueDate,
        promisedFor: next.promisedFor, transferAlias: (sending?.transfer_alias as string | null) ?? null, unsubscribeUrl: '#',
      })
    : null
  // Avisos apagados con cobros cargados: es el momento de ofrecer prenderlos.
  const offerReminders = !sending?.reminders_enabled && data.charges.length > 0 && hasRole(role, 'admin')
  return (
    <CustomerDetailView
      customer={data.customer}
      charges={data.charges}
      today={today}
      businessName={org.name}
      defaultCurrency={isCurrency(org.currency) ? org.currency : 'ARS'}
      chargeAction={createCharge}
      payAction={recordPayment}
      promiseAction={setPromise}
      clearPromiseAction={clearPromise}
      archiveAction={setCustomerArchived}
      editHref={`/app/clientes/${data.customer.id}/editar`}
      canEdit={hasRole(role, 'operator')}
      timeline={timeline}
      timeZone={org.timezone}
      whatsappLocked={!planIncludes(plan, 'whatsapp')}
      justCreated={nuevo === '1'}
      justSaved={guardado === '1'}
      turnOnRemindersAction={offerReminders ? turnOnReminders : undefined}
      remindersJustOn={avisos === '1' && !!sending?.reminders_enabled}
      emailPreview={emailPreview ? { subject: emailPreview.subject, html: emailPreview.html, from: `${org.name} vía Cobra+` } : null}
    />
  )
}
