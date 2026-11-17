'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { PasswordInput } from '@/components/ui/password-input'
import { FormFeedback } from '@/components/forms/form-feedback'
import { updatePassword } from '@/server/actions/auth'
import { firstError, initialFormState } from '@/server/actions/form-state'

export default function NewPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, initialFormState)
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-[30px]">Elegí una contraseña nueva</h1>
        <p className="text-[14.5px] text-muted">Después entrás directo a tu cuenta.</p>
      </div>
      <form action={action} className="flex flex-col gap-5" noValidate>
        <FormFeedback state={state} />
        <Field label="Contraseña nueva" error={firstError(state, 'password')}>
          {(p) => <PasswordInput {...p} name="password" autoComplete="new-password" required autoFocus showRules />}
        </Field>
        <Field label="Repetila" error={firstError(state, 'confirm')}>
          {(p) => <PasswordInput {...p} name="confirm" autoComplete="new-password" required />}
        </Field>
        <Button type="submit" size="lg" loading={pending} className="w-full">
          {pending ? 'Guardando…' : 'Guardar y entrar'}
        </Button>
      </form>
    </>
  )
}
