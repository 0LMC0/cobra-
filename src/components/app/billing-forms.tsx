'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'
import { FormFeedback } from '@/components/forms/form-feedback'
import { PAYMENT_METHODS } from '@/domain/forms'
import { SUPPORTED_CURRENCIES, toInputString, type CurrencyCode } from '@/domain/money'
import { firstError, initialFormState, type FormState } from '@/server/actions/form-state'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

/* ───────────── Cliente nuevo ───────────── */

export function CustomerForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, initialFormState)
  const [phone, setPhone] = useState('')
  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormFeedback state={state} />
      <Field label="Nombre del cliente" hint="La persona o la empresa a la que le cobrás." error={firstError(state, 'name')}>
        {(p) => <Input {...p} name="name" placeholder="Ej.: Estudio Rivas" required autoFocus />}
      </Field>
      <Field label="Email" hint="Ahí le llegan los avisos automáticos." error={firstError(state, 'email')}>
        {(p) => <Input {...p} name="email" type="email" inputMode="email" placeholder="marina@estudiorivas.com" autoComplete="off" />}
      </Field>
      <div className="flex flex-col gap-2.5">
        <Field label="Celular" optional hint="Con código de área. Ej.: 11 2345-6789." error={firstError(state, 'phone')}>
          {(p) => <Input {...p} name="phone" type="tel" inputMode="tel" placeholder="11 2345-6789" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} />}
        </Field>
        {phone && (
          <label className="flex items-start gap-3 rounded-[14px] bg-surface p-3 text-[14px] leading-snug ring-1 ring-line-2">
            <input type="checkbox" name="whatsappOk" defaultChecked className="mt-0.5 size-[18px] shrink-0 accent-[#25d366]" />
            <span><b className="font-bold">Le puedo escribir por WhatsApp.</b> Te aparece el botón para avisarle con un toque.</span>
          </label>
        )}
      </div>
      <details className="group rounded-[14px] ring-1 ring-line-2 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[14.5px] font-bold">
          Más datos <span className="text-[13px] font-normal text-muted group-open:hidden">contacto, CUIT, notas · opcional</span>
        </summary>
        <div className="grid grid-cols-1 gap-5 px-4 pb-4">
          <Field label="Persona de contacto" optional hint="Para saludarla por su nombre en los avisos." error={firstError(state, 'contactName')}>
            {(p) => <Input {...p} name="contactName" placeholder="Ej.: Marina Pérez" autoComplete="off" />}
          </Field>
          <Field label="CUIT" optional error={firstError(state, 'taxId')}>
            {(p) => <Input {...p} name="taxId" inputMode="numeric" placeholder="30-12345678-9" autoComplete="off" />}
          </Field>
          <Field label="Notas" optional error={firstError(state, 'notes')}>
            {(p) => <Input {...p} name="notes" placeholder="Algo que te sirva recordar" autoComplete="off" />}
          </Field>
        </div>
      </details>
      <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto sm:self-start">{pending ? 'Guardando…' : 'Guardar cliente'}</Button>
    </form>
  )
}

/* ───────────── Cobro nuevo ───────────── */

export function ChargeForm({ action, customerId, defaultCurrency, defaultDueDate }: { action: Action; customerId: string; defaultCurrency: CurrencyCode; defaultDueDate: string }) {
  const [state, formAction, pending] = useActionState(action, initialFormState)
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => { if (state.ok) formRef.current?.reset() }, [state])
  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
      <FormFeedback state={state} />
      <input type="hidden" name="customerId" value={customerId} />
      <Field label="Qué le cobrás" error={firstError(state, 'concept')}>
        {(p) => <Input {...p} name="concept" placeholder="Ej.: Cuota de noviembre" required />}
      </Field>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Importe" error={firstError(state, 'amount')}>
          {(p) => <Input {...p} name="amount" inputMode="decimal" placeholder="150.000" required />}
        </Field>
        <Field label="Moneda" error={firstError(state, 'currency')}>
          {(p) => (
            <Select {...p} name="currency" defaultValue={defaultCurrency} className="w-[96px]">
              {SUPPORTED_CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          )}
        </Field>
      </div>
      <Field label="Vence el" error={firstError(state, 'dueDate')}>
        {(p) => <Input {...p} name="dueDate" type="date" defaultValue={defaultDueDate} required />}
      </Field>
      <label className="flex items-start gap-3 rounded-[14px] bg-surface-2 p-3 text-[14px] leading-snug ring-1 ring-line-2">
        <input type="checkbox" name="repeatMonthly" className="mt-0.5 size-[18px] shrink-0 accent-[var(--brand)]" />
        <span><b className="font-bold">Se repite todos los meses.</b> Cobra+ arma solo el cobro del mes siguiente.</span>
      </label>
      <Button type="submit" size="lg" loading={pending} className="w-full">{pending ? 'Creando…' : 'Crear cobro'}</Button>
    </form>
  )
}

/* ───────────── "Pagó": registrar un pago ───────────── */

export function PayButton({ action, chargeId, balanceMinor, currency, today }: { action: Action; chargeId: string; balanceMinor: number; currency: CurrencyCode; today: string }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(action, initialFormState)
  // Una clave por formulario: si se aprieta dos veces, el pago no se duplica.
  const [key] = useState(() => crypto.randomUUID())

  if (state.ok) {
    return <p role="status" className="flex items-center gap-1.5 text-[13.5px] font-bold text-ok"><Check className="size-4" strokeWidth={3} />{state.ok}</p>
  }
  if (!open) {
    return (
      <Button type="button" variant="secondary" size="md" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <Check className="size-4 text-ok" strokeWidth={3} /> Pagó
      </Button>
    )
  }
  return (
    <form action={formAction} className="flex w-full flex-col gap-4 rounded-[16px] bg-surface-2 p-4 ring-1 ring-line-2" noValidate>
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold">Registrar pago</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cancelar" className="grid size-8 place-items-center rounded-[8px] text-muted hover:bg-surface-3"><X className="size-4" /></button>
      </div>
      <FormFeedback state={state} />
      <input type="hidden" name="chargeId" value={chargeId} />
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="balanceMinor" value={balanceMinor} />
      <input type="hidden" name="idempotencyKey" value={key} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label={`Cuánto pagó (${currency})`} hint="Si pagó una parte, poné sólo eso." error={firstError(state, 'amount')}>
          {(p) => <Input {...p} name="amount" inputMode="decimal" defaultValue={toInputString(balanceMinor, currency)} required autoFocus />}
        </Field>
        <Field label="Cuándo" error={firstError(state, 'paidOn')}>
          {(p) => <Input {...p} name="paidOn" type="date" defaultValue={today} max={today} required />}
        </Field>
        <Field label="Cómo" error={firstError(state, 'method')}>
          {(p) => (
            <Select {...p} name="method" defaultValue="transfer">
              {Object.entries(PAYMENT_METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          )}
        </Field>
      </div>
      <details className="text-[14px]">
        <summary className="cursor-pointer font-bold text-muted">Agregar referencia (opcional)</summary>
        <div className="mt-3">
          <Field label="Referencia" optional hint="Número de operación o lo que te sirva para encontrarlo." error={firstError(state, 'reference')}>
            {(p) => <Input {...p} name="reference" autoComplete="off" />}
          </Field>
        </div>
      </details>
      <Button type="submit" size="md" loading={pending} className="self-start">{pending ? 'Guardando…' : 'Registrar pago'}</Button>
    </form>
  )
}
