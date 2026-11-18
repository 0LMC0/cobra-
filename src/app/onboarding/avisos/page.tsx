import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOrgContext } from '@/server/auth'
import { OnboardingShell } from '../shell'
import { PreferencesForm } from './preferences-form'

export const metadata: Metadata = { title: 'Tus avisos', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function OnboardingAvisosPage() {
  const ctx = await getOrgContext()
  if (!ctx) redirect('/onboarding')
  return (
    <OnboardingShell
      step={2}
      title="¿Cómo querés que trabaje Cobra+?"
      intro="Dos preguntas rápidas. Lo podés cambiar cuando quieras desde Configuración."
    >
      <PreferencesForm defaultEmail={ctx.email ?? ''} businessName={ctx.org.name} />
    </OnboardingShell>
  )
}
