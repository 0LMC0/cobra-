import type { Metadata } from 'next'
import { NewCustomerView } from '@/components/app/customers-views'
import { requireOrg } from '@/server/auth'
import { createCustomer } from '@/server/actions/billing'

export const metadata: Metadata = { title: 'Nuevo cliente' }

export default async function NewCustomerPage() {
  await requireOrg('operator')
  return <NewCustomerView action={createCustomer} />
}
