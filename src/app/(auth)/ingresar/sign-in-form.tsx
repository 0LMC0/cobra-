'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { PasswordInput } from '@/components/ui/password-input'
import { FormFeedback } from '@/components/forms/form-feedback'
import { signIn } from '@/server/actions/auth'
import { firstError, initialFormState } from '@/server/actions/form-state'

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, initialFormState)
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormFeedback state={state} />
      {next && <input type="hidden" name="siguiente" value={next} />}
      <Field label="Email" error={firstError(state, 'email')}>
        {(p) => <Input {...p} name="email" type="email" autoComplete="email" inputMode="email" placeholder="vos@tuempresa.com" required autoFocus />}
      </Field>
      <Field
        label="Contraseña"
        error={firstError(state, 'password')}
        aside={<Link href="/recuperar" className="text-[13px] font-semibold text-muted underline-offset-2 hover:text-ink hover:underline">¿La olvidaste?</Link>}
      >
        {(p) => <PasswordInput {...p} name="password" autoComplete="current-password" required />}
      </Field>
      <Button type="submit" size="lg" loading={pending} className="mt-1 w-full">
        {pending ? 'Ingresando…' : <>Ingresar <ArrowRight className="size-4" /></>}
      </Button>
    </form>
  )
}
