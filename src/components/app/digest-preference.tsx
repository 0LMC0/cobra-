'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { FormFeedback } from '@/components/forms/form-feedback'
import { DIGEST_FREQUENCY_LABEL, type DigestFrequency } from '@/domain/digest'
import { initialFormState, type FormState } from '@/server/actions/form-state'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

/** Cada cuánto le llega a esta persona el resumen de quién está para cobrar. */
export function DigestPreferenceForm({ action, current }: { action: Action; current: DigestFrequency }) {
  const [state, formAction, pending] = useActionState(action, initialFormState)
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormFeedback state={state} />
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Frecuencia del resumen</legend>
        {(Object.keys(DIGEST_FREQUENCY_LABEL) as DigestFrequency[]).map((f) => (
          <label key={f} className="flex cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14.5px] font-semibold ring-1 ring-line-2 has-[:checked]:bg-brand-soft has-[:checked]:ring-brand">
            <input type="radio" name="frequency" value={f} defaultChecked={f === current} className="size-4 accent-[var(--brand)]" />
            {DIGEST_FREQUENCY_LABEL[f]}
          </label>
        ))}
      </fieldset>
      <Button type="submit" variant="secondary" loading={pending} className="self-start">Guardar</Button>
    </form>
  )
}
