import { forwardRef, useId, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/* Campo de PrimerosPrecios: superficie crema, foco con borde naranja y halo. */
const control =
  'w-full h-12 rounded-[14px] border-[1.5px] border-[#ece4d8] bg-surface-2 px-3.5 text-[15px] font-semibold text-ink placeholder:font-medium placeholder:text-[#a99d8a] transition-[border-color,background-color,box-shadow] hover:border-line-2 focus:outline-none focus:border-brand focus:bg-surface focus:shadow-[0_0_0_4px_rgba(29,78,216,.13)] aria-[invalid=true]:border-danger-bright aria-[invalid=true]:bg-surface'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props }, ref,
) {
  return <input ref={ref} className={cn(control, className)} {...props} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props }, ref,
) {
  return (
    <select ref={ref} className={cn(control, 'cursor-pointer appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2316233b' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...props}>
      {children}
    </select>
  )
})

type FieldProps = {
  label: string
  hint?: string
  error?: string
  optional?: boolean
  /** Algo a la derecha del label, como "¿La olvidaste?". */
  aside?: React.ReactNode
  children: (props: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => React.ReactNode
}

/** Label + control + ayuda/error, accesible por defecto. */
export function Field({ label, hint, error, optional, aside, children }: FieldProps) {
  const id = useId()
  const descId = `${id}-desc`
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13.5px] font-bold text-ink">
          {label}
          {optional && <span className="ml-1.5 text-[12px] font-semibold text-faint">opcional</span>}
        </label>
        {aside}
      </div>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error || hint ? descId : undefined })}
      {(error || hint) && (
        <p id={descId} className={cn('text-[12.5px]', error ? 'font-semibold text-danger' : 'text-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
