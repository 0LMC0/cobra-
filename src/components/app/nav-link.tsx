'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { NAV } from './nav'

/**
 * Recibe sólo el href: los íconos son componentes y no pueden pasar del
 * servidor al cliente como props, así que el ítem se busca acá.
 */
export function NavLink({ href, compact, pathOverride }: { href: string; compact?: boolean; pathOverride?: string }) {
  const item = NAV.find((i) => i.href === href)
  const currentPath = usePathname()
  const pathname = pathOverride ?? currentPath
  if (!item) return null
  const active = item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href)
  const Icon = item.icon

  // Barra inferior del celular (fondo blanco).
  if (compact) {
    const cls = cn(
      'flex flex-col items-center gap-1 rounded-[12px] py-2 text-[11px] font-bold',
      active ? 'bg-brand-soft text-brand-text' : 'text-muted',
      !item.ready && 'opacity-45',
    )
    return item.ready ? (
      <Link href={item.href} className={cls} aria-current={active ? 'page' : undefined}>
        <Icon className="size-5" />{item.label}
      </Link>
    ) : (
      <span className={cls} aria-disabled="true" title="Próximamente"><Icon className="size-5" />{item.label}</span>
    )
  }

  // Barra lateral azul: el activo va en naranja, como en PrimerosPrecios.
  const cls = cn(
    'flex h-11 items-center gap-3 rounded-[12px] px-3 text-[14px] font-bold transition-colors',
    active ? 'bg-brand text-ink shadow-[inset_0_1px_0_rgba(255,255,255,.3)]' : 'text-white/75 hover:bg-white/10 hover:text-white',
  )
  if (!item.ready) {
    return (
      <span className="flex h-11 cursor-default items-center gap-3 rounded-[12px] px-3 text-[14px] font-bold text-white/40" aria-disabled="true">
        <Icon className="size-[18px]" />
        <span className="flex-1">{item.label}</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-extrabold text-white/60">Pronto</span>
      </span>
    )
  }
  return (
    <Link href={item.href} className={cls} aria-current={active ? 'page' : undefined}>
      <Icon className="size-[18px]" />{item.label}
    </Link>
  )
}
