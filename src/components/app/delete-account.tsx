'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { FormFeedback } from '@/components/forms/form-feedback'
import { deleteAccount } from '@/server/actions/account'
import { firstError, initialFormState } from '@/server/actions/form-state'

/** Borrar la cuenta: escondido detrás de un botón y con "BORRAR" escrito a mano, porque no se puede deshacer. */
export function DeleteAccount({ soleOwnerOf }: { soleOwnerOf: string[] }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(deleteAccount, initialFormState)

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-fit text-[14px] font-semibold text-muted underline-offset-4 hover:text-danger hover:underline">
        Borrar mi cuenta
      </button>
    )
  }
  return (
    <form action={action} className="flex flex-col gap-4 rounded-[18px] bg-danger-soft/60 p-5 ring-1 ring-danger/30">
      <FormFeedback state={state} />
      <div className="flex flex-col gap-2 text-[14.5px] leading-relaxed">
        <p className="font-bold">¿Borrar tu cuenta de Cobra+? No se puede deshacer.</p>
        {soleOwnerOf.length > 0 ? (
          <p>
            Se borran también {soleOwnerOf.length === 1 ? 'la empresa' : 'las empresas'} <b>{soleOwnerOf.join(', ')}</b> con todos sus clientes, cobros, pagos e historial,
            y se cancela tu plan si tenés uno. Si querés guardar algo, descargalo antes.
          </p>
        ) : (
          <p>Se borra tu usuario. Las empresas que tienen otra persona dueña siguen funcionando sin vos.</p>
        )}
        <p className="text-muted">Tus clientes no reciben más avisos.</p>
      </div>
      <Field label="Para confirmar, escribí BORRAR" error={firstError(state, 'confirm')}>
        {(p) => <Input {...p} name="confirm" autoComplete="off" placeholder="BORRAR" />}
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="dark" size="md" loading={pending}>Borrar mi cuenta para siempre</Button>
        <Button type="button" variant="secondary" size="md" onClick={() => setOpen(false)}>Volver</Button>
      </div>
    </form>
  )
}
