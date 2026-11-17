import { forwardRef, type ButtonHTMLAttributes } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-display font-bold tracking-[-0.01em] whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-150 disabled:opacity-55 disabled:pointer-events-none select-none'

/* El botón de PrimerosPrecios: borde tinta + sombra dura que se hunde al apretar. */
const pressable =
  'border-2 border-[var(--line-strong)] shadow-[3px_3px_0_var(--shadow)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_var(--shadow)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--shadow)]'

const variants: Record<Variant, string> = {
  primary: `bg-brand text-brand-ink hover:bg-brand-hover ${pressable}`,
  secondary: `bg-surface text-ink ${pressable}`,
  dark: 'bg-navy text-white border-2 border-navy shadow-[3px_3px_0_var(--brand)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_var(--brand)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--brand)]',
  ghost: 'text-ink hover:bg-surface-3',
  danger: `bg-danger text-white ${pressable}`,
}

const sizes: Record<Size, string> = {
  sm: 'h-9 rounded-[10px] px-3.5 text-[13px]',
  md: 'h-11 rounded-[12px] px-5 text-[14px]',
  lg: 'h-[54px] rounded-[14px] px-7 text-[15.5px]',
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
