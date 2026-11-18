'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { FormFeedback } from '@/components/forms/form-feedback'
import { submitConsumerRequest, type ConsumerRequestState } from '@/server/actions/consumer'
import { firstError } from '@/server/actions/form-state'

/** Formulario del botón de arrepentimiento o de baja: sin iniciar sesión, con código de trámite al instante. */
export function ConsumerRequestForm({ kind }: { kind: 'arrepentimiento' | 'baja' }) {
  const [state, action, pending] = useActionState(submitConsumerRequest, {} as ConsumerRequestState)

  if (state.code) {
    return (
      <div className="flex flex-col gap-3 rounded-[18px] bg-ok-soft p-5 ring-1 ring-ok/30">
        <p className="text-[13px] font-bold tracking-wide text-ok uppercase">Código de trámite</p>
        <p className="money text-[32px] leading-none">{state.code}</p>
        <p className="text-[15px] leading-relaxed">{state.ok}</p>
      </div>
    )
  }
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormFeedback state={state} />
      <input type="hidden" name="kind" value={kind} />
      <Field label="Email con el que usás Cobra+" error={firstError(state, 'email')}>
        {(p) => <Input {...p} name="email" type="email" inputMode="email" autoComplete="email" required placeholder="vos@tuempresa.com" />}
      </Field>
      <Field label="Nombre y apellido" optional error={firstError(state, 'fullName')}>
        {(p) => <Input {...p} name="fullName" autoComplete="name" />}
      </Field>
      <Field label={kind === 'baja' ? '¿Algo que quieras contarnos?' : '¿Qué plan contrataste y cuándo?'} optional error={firstError(state, 'message')}>
        {(p) => <Input {...p} name="message" placeholder={kind === 'baja' ? 'Opcional' : 'Ej.: Starter mensual, el 15 de noviembre'} />}
      </Field>
      <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto sm:self-start">
        {kind === 'baja' ? 'Pedir la baja' : 'Me arrepiento de la compra'}
      </Button>
    </form>
  )
}
