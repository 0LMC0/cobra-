import type { Metadata } from 'next'
import { requireOrg } from '@/server/auth'
import { AppShell } from '@/components/app/app-shell'

export const metadata: Metadata = { robots: { index: false, follow: false } }
// Siempre por request: depende de la sesión. Nunca prerenderizar.
export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrg('viewer')
  return (
    <AppShell
      orgName={ctx.org.name}
      isDemo={ctx.org.is_demo}
      email={ctx.email}
      role={ctx.role}
      memberships={ctx.memberships}
      activeOrgId={ctx.org.id}
    >
      {children}
    </AppShell>
  )
}
