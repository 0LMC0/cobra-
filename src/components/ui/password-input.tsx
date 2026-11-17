'use client'

import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Check, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/field'
import { cn } from '@/lib/cn'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Muestra los requisitos de una contraseña nueva y los tilda mientras se escribe. */
  showRules?: boolean
}

/** Las mismas reglas que valida el servidor (src/server/actions/auth.ts). */
export const PASSWORD_RULES = [
  { label: '10 caracteres o más', test: (v: string) => v.length >= 10 },
  { label: 'Una letra', test: (v: string) => /[a-zA-Z]/.test(v) },
  { label: 'Un número', test: (v: string) => /\d/.test(v) },
] as const

export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { showRules, className, onChange, ...props }, ref,
) {
  const [visible, setVisible] = useState(false)
  const [value, setValue] = useState('')
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-12', className)}
          onChange={(e) => {
            setValue(e.target.value)
            onChange?.(e)
          }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-[10px] text-muted transition-colors hover:bg-surface-3 hover:text-ink"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
      {showRules && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] font-semibold" aria-label="Requisitos de la contraseña">
          {PASSWORD_RULES.map((r) => {
            const ok = r.test(value)
            return (
              <li key={r.label} className={cn('flex items-center gap-1.5 transition-colors', ok ? 'text-ok' : 'text-faint')}>
                <span className={cn('grid size-4 place-items-center rounded-full transition-colors', ok ? 'bg-ok-bright text-white' : 'bg-surface-3')}>
                  {ok && <Check className="size-2.5" strokeWidth={4} />}
                </span>
                {r.label}
                <span className="sr-only">{ok ? '(cumplido)' : '(falta)'}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
})
