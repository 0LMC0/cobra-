import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { Logo } from '@/components/ui/misc'
import { ROLE_LABEL, type OrgRole } from '@/domain/roles'
import { signOut } from '@/server/actions/auth'
import { NAV } from './nav'
import { OrgSwitcher } from './org-switcher'
import { NavLink } from './nav-link'

type Props = {
  children: React.ReactNode
  orgName: string
  isDemo: boolean
  email: string
  role: OrgRole
  memberships: { orgId: string; name: string; role: OrgRole }[]
  activeOrgId: string
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'C'
}

export function AppShell({ children, orgName, isDemo, email, role, memberships, activeOrgId }: Props) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      {/* Barra lateral azul, como el panel de PrimerosPrecios */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-navy p-4 text-white lg:flex">
        <div className="flex h-14 items-center px-2"><Link href="/app" aria-label="Inicio"><Logo withBy light /></Link></div>

        <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-white/[.07] p-3 ring-1 ring-white/10">
          <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-brand font-display text-[14px] font-black text-ink">{initials(orgName)}</span>
          <div className="min-w-0 flex-1">
            {memberships.length > 1 ? (
              <OrgSwitcher memberships={memberships} activeOrgId={activeOrgId} />
            ) : (
              <p className="truncate text-[14px] font-bold">{orgName}</p>
            )}
            <p className="text-[12px] text-white/60">{ROLE_LABEL[role]}</p>
          </div>
        </div>

        <nav aria-label="Principal" className="mt-5 flex flex-1 flex-col gap-1">
          {NAV.map((item) => <NavLink key={item.href} item={item} />)}
        </nav>

        <div className="flex items-center gap-2 border-t border-white/10 pt-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-marker text-[13px] font-extrabold uppercase text-ink">
            {email.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/70" title={email}>{email}</span>
          <form action={signOut}>
            <button type="submit" className="grid size-9 place-items-center rounded-[10px] text-white/70 hover:bg-white/10 hover:text-white" aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </aside>

      <div className="grid-paper flex min-w-0 flex-col pb-24 lg:pb-0">
        {isDemo && (
          <div className="bg-marker px-4 py-2 text-center text-[13px] font-bold text-ink">
            Modo demostración: los datos de esta empresa son de ejemplo y no son reales.
          </div>
        )}
        {/* Header mobile */}
        <header className="flex h-16 items-center justify-between gap-3 bg-navy px-4 text-white lg:hidden">
          <Link href="/app" aria-label="Inicio"><Logo withWord={false} light /></Link>
          <p className="min-w-0 flex-1 truncate text-center text-[14.5px] font-bold">{orgName}</p>
          <form action={signOut}>
            <button type="submit" className="grid size-10 place-items-center rounded-[10px] text-white/75" aria-label="Cerrar sesión">
              <LogOut className="size-4" />
            </button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>

      {/* Barra inferior mobile */}
      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 gap-1 border-t border-line bg-surface px-2 pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(23,34,56,.08)] lg:hidden">
        {NAV.filter((i) => i.mobile).map((item) => <NavLink key={item.href} item={item} compact />)}
      </nav>
    </div>
  )
}
