import { forwardRef, type ButtonHTMLAttributes } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'group/btn inline-flex items-center justify-center gap-2 font-display font-semibold tracking-[-0.01em] whitespace-nowrap transition-[background-color,box-shadow,color,transform] duration-150 active:scale-[0.98] disabled:opacity-55 disabled:pointer-events-none select-none [&>svg]:transition-transform [&>svg]:duration-150 hover:[&>svg:last-child]:translate-x-0.5'

/* Relieve suave: un brillo arriba y una sombra corta abajo. Sin bordes gruesos. */
const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-brand-ink shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_1px_2px_rgba(22,35,59,.18),0_6px_16px_-6px_rgba(29,78,216,.55)] hover:bg-brand-hover hover:shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_1px_2px_rgba(22,35,59,.18),0_10px_22px_-8px_rgba(29,78,216,.65)]',
  secondary:
    'bg-surface text-ink ring-1 ring-inset ring-line-2 shadow-[0_1px_2px_rgba(22,35,59,.06)] hover:bg-surface-2 hover:ring-ink/25',
  dark:
    'bg-navy text-white shadow-[inset_0_1px_0_rgba(255,255,255,.1),0_1px_2px_rgba(22,35,59,.25)] hover:bg-navy-2',
  ghost: 'text-ink hover:bg-surface-3',
  danger: 'bg-danger text-white shadow-[0_1px_2px_rgba(22,35,59,.18)] hover:bg-[#b02e33]',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 rounded-[10px] px-3.5 text-[13.5px]',
  md: 'h-11 rounded-[12px] px-5 text-[14.5px]',
  lg: 'h-[52px] rounded-[14px] px-6 text-[16px]',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
})

export function ButtonLink({
  href, variant = 'primary', size = 'md', className, children,
}: { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  )
}
