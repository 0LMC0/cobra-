'use client'

import { startTransition, useActionState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Card } from '@/components/ui/misc'
import { FormFeedback } from '@/components/forms/form-feedback'
import { createFirstCustomerAndCharge } from '@/server/actions/billing'
import { firstError, initialFormState } from '@/server/actions/form-state'

/** Paso 3: a quién le cobrás, cuánto y cuándo. Cliente y cobro en un solo envío. */
export function FirstChargeForm({ currency, defaultDueDate }: { currency: string; defaultDueDate: string }) {
  const [state, action, pending] = useActionState(createFirstCustomerAndCharge, initialFormState)
  const err = (k: string) => firstError(state, k)

  // Se envía a mano para que React no vacíe los campos si vuelve un error.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(() => action(data))
  }

  return (
    <form action={action} onSubmit={onSubmit} noValidate>
      <Card hard className="flex flex-col gap-5 p-5 sm:p-7">
        <FormFeedback state={state} />
        <input type="hidden" name="currency" value={currency} />
        <input type="hidden" name="whatsappOk" value="on" />
        <p className="eyebrow">Tu cliente</p>
        <Field label="¿A quién le cobrás?" hint="La persona o la empresa." error={err('name')}>
          {(p) => <Input {...p} name="name" required autoFocus placeholder="Ej.: Estudio Rivas" />}
        </Field>
        <Field label="Su email" hint="Ahí le llegan los avisos." error={err('email')}>
          {(p) => <Input {...p} name="email" type="email" inputMode="email" autoComplete="off" placeholder="marina@estudiorivas.com" />}
        </Field>
        <Field label="Su celular" optional hint="Para avisarle también por WhatsApp con un toque." error={err('phone')}>
          {(p) => <Input {...p} name="phone" type="tel" inputMode="tel" autoComplete="off" placeholder="11 2345-6789" />}
        </Field>

        <p className="eyebrow mt-2">Lo que te paga</p>
        <Field label="¿Qué le cobrás?" error={err('concept')}>
          {(p) => <Input {...p} name="concept" defaultValue="Abono mensual" />}
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="¿Cuánto?" error={err('amount')}>
            {(p) => <Input {...p} name="amount" inputMode="decimal" placeholder="150.000" />}
          </Field>
          <Field label="¿Cuándo vence?" error={err('dueDate')}>
            {(p) => <Input {...p} name="dueDate" type="date" defaultValue={defaultDueDate} />}
          </Field>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-[14px] bg-surface-2 p-3.5 text-[14.5px] leading-snug ring-1 ring-line-2">
          <input type="checkbox" name="repeatMonthly" defaultChecked className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]" />
          <span><b className="font-bold">Me paga todos los meses.</b> Cobra+ arma solo el cobro del mes siguiente.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-[14px] bg-brand-soft p-3.5 text-[14.5px] leading-snug ring-1 ring-brand/30">
          <input type="checkbox" name="autoReminders" defaultChecked className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]" />
          <span><b className="font-bold">Que Cobra+ le avise por email.</b> 5 días antes, el día anterior, el día que vence y si se atrasa.</span>
        </label>
        <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto sm:self-start">
          {pending ? 'Guardando…' : <>Listo, empezar a cobrar <ArrowRight className="size-4" /></>}
        </Button>
      </Card>
    </form>
  )
}
