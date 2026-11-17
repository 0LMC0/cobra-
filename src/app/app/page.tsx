import type { Metadata } from 'next'
import { HomeView } from '@/components/app/home-view'
import { requireOrg } from '@/server/auth'
import { formatDate, todayIn } from '@/domain/dates'
import { getHomeData, getPlanUsage } from '@/server/queries'
import { PlanUsageCard } from '@/components/app/plan-usage'
import type { CurrencyCode } from '@/domain/money'

export const metadata: Metadata = { title: 'Inicio' }

export default async function AppHome() {
  const { org } = await requireOrg('viewer')
  const today = todayIn(org.timezone)
  const currency = org.currency as CurrencyCode
  const [home, usage] = await Promise.all([getHomeData(org.id, currency, today), getPlanUsage(org.id, today)])
  // En Gratis, avisar cuando se está por terminar el cupo del mes (o ya se terminó).
  const nearLimit = usage.limit !== null && usage.used >= usage.limit - 2
  return (
    <div className="flex flex-col gap-6">
    {nearLimit && <PlanUsageCard usage={usage} compact />}
    <HomeView
      dateLabel={formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}
      onboardingStep={org.onboarding_step}
      currency={currency}
      businessName={org.name}
      transferAlias={home.transferAlias}
      totals={home.totals}
      todayReminders={home.reminders}
    />
    </div>
  )
}
