import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CustomerDetailView } from '@/components/app/customers-views'
import { requireOrg } from '@/server/auth'
import { getCustomer } from '@/server/queries'
import { createCharge, recordPayment } from '@/server/actions/billing'
import { todayIn } from '@/domain/dates'
import { isCurrency } from '@/domain/money'

export const metadata: Metadata = { title: 'Cliente' }

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nuevo?: string }> }) {
  const { org } = await requireOrg('viewer')
  const { id } = await params
  const { nuevo } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const today = todayIn(org.timezone)
  const data = await getCustomer(org.id, id, today)
  if (!data) notFound()
  return (
    <CustomerDetailView
      customer={data.customer}
      charges={data.charges}
      today={today}
      businessName={org.name}
      defaultCurrency={isCurrency(org.currency) ? org.currency : 'ARS'}
      chargeAction={createCharge}
      payAction={recordPayment}
      justCreated={nuevo === '1'}
    />
  )
}
