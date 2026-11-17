'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { FormFeedback } from '@/components/forms/form-feedback'
import { resendConfirmation } from '@/server/actions/auth'
import { initialFormState } from '@/server/actions/form-state'

export function ResendForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendConfirmation, initialFormState)
  return (
    <form action={action} className="flex flex-col gap-3">
      <FormFeedback state={state} />
      <input type="hidden" name="email" value={email} />
      <Button type="submit" variant="secondary" loading={pending}>Reenviar email</Button>
    </form>
  )
}
