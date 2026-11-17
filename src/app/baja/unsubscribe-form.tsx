'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { FormFeedback } from '@/components/forms/form-feedback'
import { initialFormState } from '@/server/actions/form-state'
import { confirmUnsubscribe } from '@/server/actions/unsubscribe'

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(confirmUnsubscribe, initialFormState)
  if (state.ok) return <FormFeedback state={state} />
  return (
    <form action={action} className="flex flex-col gap-3">
      <FormFeedback state={state} />
      <input type="hidden" name="t" value={token} />
      <Button type="submit" size="lg" loading={pending} className="w-full">{pending ? 'Guardando…' : 'Sí, no quiero más avisos'}</Button>
    </form>
  )
}
