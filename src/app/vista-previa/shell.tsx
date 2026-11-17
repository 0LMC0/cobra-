import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app/app-shell'

/** Marco del panel para las vistas previas. Sólo existe en desarrollo. */
export function PreviewShell({ path, children }: { path: string; children: React.ReactNode }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  return (
    <AppShell
      orgName="Estudio Martínez"
      isDemo
      email="ejemplo@estudiomartinez.example"
      role="owner"
      memberships={[{ orgId: 'ejemplo', name: 'Estudio Martínez', role: 'owner' }]}
      activeOrgId="ejemplo"
      previewPath={path}
    >
      {children}
    </AppShell>
  )
}
