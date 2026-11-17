'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { FormFeedback } from '@/components/forms/form-feedback'
import { signIn } from '@/server/actions/auth'
import { firstError, initialFormState } from '@/server/actions/form-state'

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, initialFormState)
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormFeedback state={state} />
      {next && <input type="hidden" name="siguiente" value={next} />}
      <Field label="Email" error={firstError(state, 'email')}>
        {(p) => <Input {...p} name="email" type="email" autoComplete="email" inputMode="email" required autoFocus />}
      </Field>
      <Field label="Contraseña" error={firstError(state, 'password')}>
        {(p) => <Input {...p} name="password" type="password" autoComplete="current-password" required />}
      </Field>
      <div className="-mt-1 text-right">
        <Link href="/recuperar" className="text-[13px] text-muted hover:text-ink hover:underline">Olvidé mi contraseña</Link>
      </div>
      <Button type="submit" size="lg" loading={pending}>Ingresar</Button>
    </form>
  )
}
