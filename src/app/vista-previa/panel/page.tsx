import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app/app-shell'
import { HomeView } from '@/components/app/home-view'

/**
 * Vista previa del panel con datos de ejemplo, SÓLO en desarrollo: sirve para
 * revisar el diseño sin Supabase. En producción responde 404.
 */
export const metadata: Metadata = { title: 'Vista previa del panel', robots: { index: false, follow: false } }

export default function PanelPreview() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return (
    <AppShell
      orgName="Estudio Martínez"
      isDemo
      email="ejemplo@estudiomartinez.example"
      role="owner"
      memberships={[{ orgId: 'ejemplo', name: 'Estudio Martínez', role: 'owner' }]}
      activeOrgId="ejemplo"
      previewPath="/app"
    >
      <HomeView dateLabel="martes, 17 de noviembre" onboardingStep="first_customer" currency="ARS" />
    </AppShell>
  )
}
