'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { FormFeedback } from '@/components/forms/form-feedback'
import { signUp } from '@/server/actions/auth'
import { firstError, initialFormState } from '@/server/actions/form-state'

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initialFormState)
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormFeedback state={state} />
      <Field label="Tu nombre" error={firstError(state, 'fullName')}>
        {(p) => <Input {...p} name="fullName" autoComplete="name" required autoFocus />}
      </Field>
      <Field label="Email de trabajo" error={firstError(state, 'email')}>
        {(p) => <Input {...p} name="email" type="email" autoComplete="email" inputMode="email" required />}
      </Field>
      <Field label="Contraseña" hint="Mínimo 10 caracteres, con letras y números." error={firstError(state, 'password')}>
        {(p) => <Input {...p} name="password" type="password" autoComplete="new-password" required minLength={10} />}
      </Field>
      <label className="flex items-start gap-2.5 text-[13px] text-muted">
        <input type="checkbox" name="terms" className="mt-0.5 size-4 accent-[var(--brand)]" required />
        <span>
          Acepto los <Link href="/legal/terminos" className="text-ink underline">Términos</Link> y la{' '}
          <Link href="/legal/privacidad" className="text-ink underline">Política de privacidad</Link>.
        </span>
      </label>
      {firstError(state, 'terms') && <p className="-mt-2 text-[12.5px] text-danger">{firstError(state, 'terms')}</p>}
      <Button type="submit" size="lg" loading={pending}>Crear cuenta</Button>
    </form>
  )
}
