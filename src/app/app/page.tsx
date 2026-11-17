import type { Metadata } from 'next'
import { HomeView } from '@/components/app/home-view'
import { requireOrg } from '@/server/auth'
import { formatDate, todayIn } from '@/domain/dates'

export const metadata: Metadata = { title: 'Inicio' }

export default async function AppHome() {
  const { org } = await requireOrg('viewer')
  const today = todayIn(org.timezone)
  return (
    <HomeView
      dateLabel={formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}
      onboardingStep={org.onboarding_step}
      currency={org.currency}
    />
  )
}
