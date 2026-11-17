'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { FormFeedback } from '@/components/forms/form-feedback'
import { updatePassword } from '@/server/actions/auth'
import { firstError, initialFormState } from '@/server/actions/form-state'

export default function NewPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, initialFormState)
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-extrabold leading-tight">Elegí una contraseña nueva</h1>
        <p className="text-sm text-muted">Mínimo 10 caracteres, con letras y números.</p>
      </div>
      <form action={action} className="flex flex-col gap-4" noValidate>
        <FormFeedback state={state} />
        <Field label="Contraseña nueva" error={firstError(state, 'password')}>
          {(p) => <Input {...p} name="password" type="password" autoComplete="new-password" required autoFocus />}
        </Field>
        <Field label="Repetila" error={firstError(state, 'confirm')}>
          {(p) => <Input {...p} name="confirm" type="password" autoComplete="new-password" required />}
        </Field>
        <Button type="submit" size="lg" loading={pending}>Guardar y entrar</Button>
      </form>
    </>
  )
}
