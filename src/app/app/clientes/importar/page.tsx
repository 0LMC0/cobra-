import type { Metadata } from 'next'
import { ImportCustomersView } from '@/components/app/import-customers'
import { ACTIVE_CUSTOMERS, PLAN_NAME } from '@/config/plans'
import { createClient } from '@/lib/supabase/server'
import { importCustomers } from '@/server/actions/billing'
import { requireOrg } from '@/server/auth'
import { getOrgPlan } from '@/server/queries'

export const metadata: Metadata = { title: 'Importar clientes' }

export default async function ImportCustomersPage() {
  const { org } = await requireOrg('operator')
  const supabase = await createClient()
  const [{ data }, plan] = await Promise.all([
    supabase.from('customers').select('email, tax_id, status').eq('org_id', org.id),
    getOrgPlan(org.id),
  ])
  const list = data ?? []
  const active = list.filter((c) => c.status === 'active').length
  return (
    <ImportCustomersView
      action={importCustomers}
      existing={{
        emails: list.filter((c) => c.status === 'active' && c.email).map((c) => c.email as string),
        taxIds: list.filter((c) => c.tax_id).map((c) => c.tax_id as string),
      }}
      room={ACTIVE_CUSTOMERS[plan] - active}
      planName={PLAN_NAME[plan]}
    />
  )
}
