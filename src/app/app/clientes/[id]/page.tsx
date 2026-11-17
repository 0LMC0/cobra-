import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CustomerDetailView } from '@/components/app/customers-views'
import { requireOrg } from '@/server/auth'
import { getCustomer, getCustomerTimeline } from '@/server/queries'
import { clearPromise, createCharge, recordPayment, setCustomerArchived, setPromise } from '@/server/actions/billing'
import { todayIn } from '@/domain/dates'
import { isCurrency } from '@/domain/money'
import { hasRole } from '@/domain/roles'

export const metadata: Metadata = { title: 'Cliente' }

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nuevo?: string; guardado?: string }> }) {
  const { org, role } = await requireOrg('viewer')
  const { id } = await params
  const { nuevo, guardado } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const today = todayIn(org.timezone)
  const data = await getCustomer(org.id, id, today)
  if (!data) notFound()
  const timeline = await getCustomerTimeline(org.id, { id: data.customer.id, createdAt: data.customer.createdAt })
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
      justCreated={nuevo === '1'}
      justSaved={guardado === '1'}
    />
  )
}
