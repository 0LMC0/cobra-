import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { OnboardingShell } from './shell'
import { getOrgContext, requireUser } from '@/server/auth'
import { CompanyForm } from './company-form'

export const metadata: Metadata = { title: 'Configurá tu empresa', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ nueva?: string }> }) {
  const user = await requireUser()
  const { nueva } = await searchParams
  const ctx = await getOrgContext()
  // Ya tiene empresa y no pidió crear otra: al panel.
  if (ctx && nueva !== '1') redirect('/app')

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0]

  return (
    <OnboardingShell
      step={1}
      title={firstName ? `Hola, ${firstName}. ¿Cómo se llama tu empresa?` : '¿Cómo se llama tu empresa?'}
      intro="Bienvenido a Cobra+. Son 3 pasos y te lleva 2 minutos. Primero, el nombre que van a ver tus clientes en cada aviso."
    >
      <CompanyForm defaultEmail={user.email ?? ''} />
    </OnboardingShell>
  )
}
