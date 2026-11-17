'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { FormFeedback } from '@/components/forms/form-feedback'
import { requestPasswordReset } from '@/server/actions/auth'
import { firstError, initialFormState } from '@/server/actions/form-state'

export default function RecoverPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialFormState)
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-extrabold leading-tight">Recuperá tu acceso</h1>
        <p className="text-sm text-muted">Te mandamos un link para crear una contraseña nueva.</p>
      </div>
      <form action={action} className="flex flex-col gap-4" noValidate>
        <FormFeedback state={state} />
        <Field label="Email" error={firstError(state, 'email')}>
          {(p) => <Input {...p} name="email" type="email" autoComplete="email" required autoFocus />}
        </Field>
        <Button type="submit" size="lg" loading={pending}>Enviar link</Button>
      </form>
      <Link href="/ingresar" className="text-center text-[13px] text-muted hover:text-ink hover:underline">Volver a ingresar</Link>
    </>
  )
}
