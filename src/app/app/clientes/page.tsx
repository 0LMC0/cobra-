import type { Metadata } from 'next'
import { CustomersListView } from '@/components/app/customers-views'
import { requireOrg } from '@/server/auth'
import { countArchivedCustomers, listCustomers } from '@/server/queries'
import { todayIn } from '@/domain/dates'
import { filterCustomers, parseCustomerView } from '@/domain/customer-filter'
import { hasRole } from '@/domain/roles'

export const metadata: Metadata = { title: 'Clientes' }

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; ver?: string }> }) {
  const { org, role } = await requireOrg('viewer')
  const { q: rawQ, ver } = await searchParams
  const view = parseCustomerView(ver)
  const q = (rawQ ?? '').trim().slice(0, 80)
  const today = todayIn(org.timezone)
  const active = view === 'archivados' ? null : await listCustomers(org.id, today)
  const pool = active ?? (await listCustomers(org.id, today, { archived: true }))
  const customers = filterCustomers(pool, { q, view: view === 'archivados' ? 'todos' : view })
  // Si no quedan activos, igual hay que poder llegar a los archivados.
  const archivedCount = active && active.length === 0 ? await countArchivedCustomers(org.id) : undefined
  return (
    <CustomersListView
      customers={customers}
      q={q}
      view={view}
      activeCount={active?.length}
      archivedCount={archivedCount}
      canEdit={hasRole(role, 'operator')}
      exportHref="/app/exportar/clientes"
    />
  )
}
