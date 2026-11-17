import type { Metadata } from 'next'
import { HomeView } from '@/components/app/home-view'
import { requireOrg } from '@/server/auth'
import { formatDate, todayIn } from '@/domain/dates'
import { getHomeData } from '@/server/queries'
import type { CurrencyCode } from '@/domain/money'

export const metadata: Metadata = { title: 'Inicio' }

export default async function AppHome() {
  const { org } = await requireOrg('viewer')
  const today = todayIn(org.timezone)
  const currency = org.currency as CurrencyCode
  const home = await getHomeData(org.id, currency, today)
  return (
    <HomeView
      dateLabel={formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}
      onboardingStep={org.onboarding_step}
      currency={currency}
      businessName={org.name}
      transferAlias={home.transferAlias}
      totals={home.totals}
      todayReminders={home.reminders}
    />
  )
}
