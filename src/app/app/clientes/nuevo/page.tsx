import type { Metadata } from 'next'
import { NewCustomerView } from '@/components/app/customers-views'
import { requireOrg } from '@/server/auth'
import { customerLimitReached } from '@/server/queries'
import { createCustomer } from '@/server/actions/billing'

export const metadata: Metadata = { title: 'Nuevo cliente' }

export default async function NewCustomerPage({ searchParams }: { searchParams: Promise<{ primero?: string }> }) {
  const { org } = await requireOrg('operator')
  const limit = await customerLimitReached(org.id)
  const { primero } = await searchParams
  return <NewCustomerView action={createCustomer} limitReached={limit} firstTime={primero === '1'} />
}
