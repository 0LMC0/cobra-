'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { FormFeedback } from '@/components/forms/form-feedback'
import { firstError, initialFormState, type FormState } from '@/server/actions/form-state'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

export function ReminderSettingsForm({ action, enabled, transferAlias, replyTo, canEdit }: {
  action: Action; enabled: boolean; transferAlias: string | null; replyTo: string | null; canEdit: boolean
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState)
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormFeedback state={state} />
      <fieldset disabled={!canEdit} className="flex flex-col gap-5 disabled:opacity-60">
        <label className="flex cursor-pointer items-start gap-3 rounded-[14px] p-3.5 ring-1 ring-line-2 has-[:checked]:bg-brand-soft has-[:checked]:ring-brand">
          <input type="checkbox" name="enabled" defaultChecked={enabled} className="mt-0.5 size-[18px] shrink-0 accent-[var(--brand)]" />
          <span className="text-[14.5px] leading-snug">
            <b className="font-bold">Avisarle por email a mis clientes.</b> 5 días antes, el día anterior, el día que vence, y si se atrasa a los 3 y a los 7 días.
            Sólo días hábiles. Cuando registrás el pago, se frena.
          </span>
        </label>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Email donde te responden" hint="Si tu cliente contesta el aviso, le llega a este email." error={firstError(state, 'replyTo')}>
            {(p) => <Input {...p} name="replyTo" type="email" inputMode="email" defaultValue={replyTo ?? ''} placeholder="cobranzas@tuempresa.com" />}
          </Field>
          <Field label="Alias para transferir" optional hint="Aparece en cada aviso para que te paguen más rápido." error={firstError(state, 'transferAlias')}>
            {(p) => <Input {...p} name="transferAlias" defaultValue={transferAlias ?? ''} placeholder="tuempresa.mp" autoComplete="off" />}
          </Field>
        </div>
      </fieldset>
      {canEdit ? (
        <Button type="submit" loading={pending} className="self-start">{pending ? 'Guardando…' : 'Guardar'}</Button>
      ) : (
        <p className="text-[13px] text-muted">Sólo administración puede cambiar esto.</p>
      )}
    </form>
  )
}
