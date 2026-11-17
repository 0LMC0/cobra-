import type { Metadata } from 'next'
import { CustomersListView } from '@/components/app/customers-views'
import { requireOrg } from '@/server/auth'
import { listCustomers } from '@/server/queries'
import { todayIn } from '@/domain/dates'

export const metadata: Metadata = { title: 'Clientes' }

export default async function CustomersPage() {
  const { org } = await requireOrg('viewer')
  const customers = await listCustomers(org.id, todayIn(org.timezone))
  return <CustomersListView customers={customers} />
}
