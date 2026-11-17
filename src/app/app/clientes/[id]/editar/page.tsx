import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EditCustomerView } from '@/components/app/customers-views'
import { requireOrg } from '@/server/auth'
import { getCustomer } from '@/server/queries'
import { updateCustomer } from '@/server/actions/billing'
import { todayIn } from '@/domain/dates'

export const metadata: Metadata = { title: 'Editar cliente' }

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { org } = await requireOrg('operator')
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const data = await getCustomer(org.id, id, todayIn(org.timezone))
  if (!data) notFound()
  const c = data.customer
  return (
    <EditCustomerView
      action={updateCustomer}
      backHref={`/app/clientes/${c.id}`}
      customer={{
        id: c.id, name: c.name, email: c.email, phone: c.phone, contactName: c.contactName, taxId: c.taxId, notes: c.notes,
        whatsappOk: c.whatsappOk, remindersPaused: c.remindersPaused, optedOut: c.optedOut,
      }}
    />
  )
}
