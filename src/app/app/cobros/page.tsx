import type { Metadata } from 'next'
import { ChargesView } from '@/components/app/charges-view'
import { requireOrg } from '@/server/auth'
import { getOrgPlan, getWhatsAppQuota, listCharges } from '@/server/queries'
import { planIncludes } from '@/config/plans'
import { clearPromise, recordPayment, setPromise } from '@/server/actions/billing'
import { todayIn } from '@/domain/dates'
import { can } from '@/domain/roles'

export const metadata: Metadata = { title: 'Cobros' }

export default async function ChargesPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { org, role } = await requireOrg('viewer')
  const { ver } = await searchParams
  const today = todayIn(org.timezone)
  const [charges, plan] = await Promise.all([listCharges(org.id, today), getOrgPlan(org.id)])
  const wa = await getWhatsAppQuota(org.id, today, plan)
  return (
    <ChargesView
      charges={charges}
      view={ver === 'pagados' ? 'pagados' : 'pendientes'}
      today={today}
      businessName={org.name}
      payAction={recordPayment}
      canExport={can(role, 'reports.export')}
      exportLocked={!planIncludes(plan, 'csvExport')}
      whatsappLocked={wa.locked}
      whatsappRemaining={wa.remaining}
      promiseAction={setPromise}
      clearPromiseAction={clearPromise}
    />
  )
}
