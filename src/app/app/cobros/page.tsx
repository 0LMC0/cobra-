import type { Metadata } from 'next'
import { ChargesView } from '@/components/app/charges-view'
import { requireOrg } from '@/server/auth'
import { listCharges } from '@/server/queries'
import { recordPayment } from '@/server/actions/billing'
import { todayIn } from '@/domain/dates'

export const metadata: Metadata = { title: 'Cobros' }

export default async function ChargesPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { org } = await requireOrg('viewer')
  const { ver } = await searchParams
  const today = todayIn(org.timezone)
  const charges = await listCharges(org.id, today)
  return (
    <ChargesView
      charges={charges}
      view={ver === 'pagados' ? 'pagados' : 'pendientes'}
      today={today}
      businessName={org.name}
      payAction={recordPayment}
    />
  )
}
