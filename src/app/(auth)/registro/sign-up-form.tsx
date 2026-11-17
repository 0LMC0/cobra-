'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { PasswordInput } from '@/components/ui/password-input'
import { FormFeedback } from '@/components/forms/form-feedback'
import { signUp } from '@/server/actions/auth'
import { firstError, initialFormState } from '@/server/actions/form-state'

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initialFormState)
  const termsError = firstError(state, 'terms')
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormFeedback state={state} />
      <Field label="Tu nombre" error={firstError(state, 'fullName')}>
        {(p) => <Input {...p} name="fullName" autoComplete="name" placeholder="Nombre y apellido" required autoFocus />}
      </Field>
      <Field label="Email" hint="Te mandamos un link para confirmarlo." error={firstError(state, 'email')}>
        {(p) => <Input {...p} name="email" type="email" autoComplete="email" inputMode="email" placeholder="vos@tuempresa.com" required />}
      </Field>
      <Field label="Contraseña" error={firstError(state, 'password')}>
        {(p) => <PasswordInput {...p} name="password" autoComplete="new-password" required minLength={10} showRules />}
      </Field>
      <div className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer items-start gap-3 text-[13.5px] leading-snug text-muted">
          <input
            type="checkbox"
            name="terms"
            required
            aria-invalid={termsError ? true : undefined}
            className="mt-px size-[18px] shrink-0 cursor-pointer accent-[var(--brand)]"
          />
          <span>
            Acepto los <Link href="/legal/terminos" className="font-semibold text-ink underline underline-offset-2">Términos</Link> y la{' '}
            <Link href="/legal/privacidad" className="font-semibold text-ink underline underline-offset-2">Política de privacidad</Link>.
          </span>
        </label>
        {termsError && <p className="text-[12.5px] font-semibold text-danger">{termsError}</p>}
      </div>
      <Button type="submit" size="lg" loading={pending} className="w-full">
        {pending ? 'Creando tu cuenta…' : <>Crear cuenta <ArrowRight className="size-4" /></>}
      </Button>
    </form>
  )
}
