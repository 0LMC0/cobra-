import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Tarjeta blanca redondeada. `hard` = protagonista (borde tinta + sombra dura). */
export function Card({ className, children, hard }: { className?: string; children: React.ReactNode; hard?: boolean }) {
  return (
    <div className={cn('rounded-[22px] bg-surface', hard ? 'hard' : 'soft', className)}>
      {children}
    </div>
  )
}

type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info' | 'brand'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-muted',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  brand: 'bg-brand-soft text-brand-text',
}

/** Pastilla de estado. */
export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] leading-none font-extrabold whitespace-nowrap', tones[tone], className)}>
      {children}
    </span>
  )
}

const alertIcon = { ok: CheckCircle2, warn: AlertTriangle, danger: XCircle, info: Info } as const

export function Alert({ tone = 'info', title, children }: { tone?: keyof typeof alertIcon; title?: string; children?: React.ReactNode }) {
  const Icon = alertIcon[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-[14px] border-l-4 border-current px-4 py-3 text-[13.5px]', tones[tone])}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex flex-col gap-0.5">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className="text-ink/80">{children}</div>}
      </div>
    </div>
  )
}

export function EmptyState({
  icon: Icon, title, children, action,
}: { icon: React.ComponentType<{ className?: string }>; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[22px] border-2 border-dashed border-line-2 bg-surface/70 px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-[18px] bg-brand-soft text-brand-d">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-1 text-[18px]">{title}</h3>
      {children && <p className="max-w-md text-[14.5px] text-muted">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Ícono en baldosa de color, como en el sistema de PrimerosPrecios. */
const tileTones = {
  brand: 'bg-brand-soft text-brand-d',
  ok: 'bg-ok-soft text-ok',
  info: 'bg-info-soft text-info',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  purple: 'bg-purple-soft text-purple',
  navy: 'bg-navy text-white',
  solid: 'bg-brand text-brand-ink',
} as const
export type TileTone = keyof typeof tileTones

export function IconTile({
  icon: Icon, tone = 'brand', size = 'md', className,
}: { icon: React.ComponentType<{ className?: string }>; tone?: TileTone; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dims = { sm: 'size-8 rounded-[10px] [&>svg]:size-4', md: 'size-11 rounded-[14px] [&>svg]:size-5', lg: 'size-14 rounded-[18px] [&>svg]:size-6' }[size]
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center', dims, tileTones[tone], className)}>
      <Icon />
    </span>
  )
}

/** Las dos flechas de PrimerosPrecios. */
export function PPMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 320 808 676" className={className} aria-hidden fill="currentColor">
      <path d="M 292.066406 527.515625 L 292.933594 994.714844 L 184.230469 995.832031 L 184.230469 527.515625 L 78.460938 634.550781 L 0.746094 558.464844 L 238.148438 321.195312 L 474.765625 557.683594 L 399.277344 634.6875 Z M 730.191406 681.496094 L 624.421875 788.527344 L 624.421875 320.214844 L 515.71875 321.332031 L 516.585938 788.523438 L 409.367188 681.355469 L 333.882812 758.359375 L 570.503906 994.847656 L 807.90625 757.578125 Z" />
    </svg>
  )
}

/** Firma "by PrimerosPrecios". */
export function ByPP({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10.5px] font-semibold', light ? 'text-white/65' : 'text-muted', className)}>
      by
      <span className={cn('inline-flex items-center gap-1 font-display text-[11px] font-bold tracking-[-0.01em]', light ? 'text-white' : 'text-ink')}>
        <PPMark className="h-[9px] w-auto text-pp" />PrimerosPrecios
      </span>
    </span>
  )
}

/**
 * Marca Cobra+: el logo dibujado a mano. Azul sobre fondo claro y blanco
 * sobre el azul tinta. Sin palabra (withWord=false) queda el ícono: la "C"
 * con el "+" sobre azul.
 */
export const BRAND_BLUE = '#1d4ed8'

export function Logo({
  className, withWord = true, withBy = false, light = false,
}: { className?: string; withWord?: boolean; withBy?: boolean; light?: boolean }) {
  if (!withWord) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/icon.png" alt="Cobra+" width={36} height={36} className={cn('size-9 shrink-0 rounded-[10px]', className)} />
    )
  }
  return (
    <span className={cn('inline-flex flex-col items-start leading-none', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={light ? '/brand/cobra-plus-white-sm.png' : '/brand/cobra-plus-blue-sm.png'}
        alt="Cobra+"
        width={102}
        height={32}
        className="h-8 w-auto"
      />
      {withBy && <ByPP className="byline mt-1" light={light} />}
    </span>
  )
}
