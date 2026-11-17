'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'
import { Card } from '@/components/ui/misc'
import { FormFeedback } from '@/components/forms/form-feedback'
import { createOrganization } from '@/server/actions/organization'
import { firstError, initialFormState } from '@/server/actions/form-state'
import { FREQUENCY_LABEL } from '@/domain/dates'

const INDUSTRIES = [
  'Agencia de marketing', 'Estudio contable', 'Estudio de diseño', 'Mantenimiento', 'Servicio técnico',
  'Consultoría', 'Limpieza', 'Servicios B2B', 'Profesional independiente', 'Otro',
]

const CURRENCIES = [
  ['ARS', 'Peso argentino (ARS)'], ['USD', 'Dólar estadounidense (USD)'], ['UYU', 'Peso uruguayo (UYU)'],
  ['CLP', 'Peso chileno (CLP)'], ['MXN', 'Peso mexicano (MXN)'], ['BRL', 'Real (BRL)'],
  ['COP', 'Peso colombiano (COP)'], ['PEN', 'Sol (PEN)'],
] as const

const TIMEZONES = [
  ['America/Argentina/Buenos_Aires', 'Argentina (GMT−3)'],
  ['America/Montevideo', 'Uruguay (GMT−3)'],
  ['America/Santiago', 'Chile'],
  ['America/Sao_Paulo', 'Brasil (São Paulo)'],
  ['America/Bogota', 'Colombia (GMT−5)'],
  ['America/Lima', 'Perú (GMT−5)'],
  ['America/Mexico_City', 'México (CDMX)'],
] as const

export function CompanyForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, action, pending] = useActionState(createOrganization, initialFormState)
  const [tz, setTz] = useState<string>('America/Argentina/Buenos_Aires')

  // Sugerimos la zona del navegador si está en la lista.
  useEffect(() => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (TIMEZONES.some(([v]) => v === browserTz)) setTz(browserTz)
  }, [])

  return (
    <form action={action} noValidate>
      <Card hard className="flex flex-col gap-5 p-5 sm:p-7">
        <FormFeedback state={state} />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nombre de la empresa" error={firstError(state, 'name')}>
              {(p) => <Input {...p} name="name" autoComplete="organization" required autoFocus placeholder="Ej.: Estudio Martínez" />}
            </Field>
          </div>
          <Field label="Rubro" optional error={firstError(state, 'industry')}>
            {(p) => (
              <Select {...p} name="industry" defaultValue="">
                <option value="">Elegí un rubro</option>
                {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
              </Select>
            )}
          </Field>
          <Field label="¿Cada cuánto cobrás normalmente?" error={firstError(state, 'billingFrequency')}>
            {(p) => (
              <Select {...p} name="billingFrequency" defaultValue="monthly">
                {Object.entries(FREQUENCY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Moneda principal" hint="Podés cobrar en otras monedas; nunca se mezclan." error={firstError(state, 'currency')}>
            {(p) => (
              <Select {...p} name="currency" defaultValue="ARS">
                {CURRENCIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Zona horaria" hint="Define qué es “hoy” para tus vencimientos." error={firstError(state, 'timezone')}>
            {(p) => (
              <Select {...p} name="timezone" value={tz} onChange={(e) => setTz(e.target.value)}>
                {TIMEZONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Email de contacto" optional hint="Aparece como respuesta en tus recordatorios." error={firstError(state, 'contactEmail')}>
            {(p) => <Input {...p} name="contactEmail" type="email" defaultValue={defaultEmail} autoComplete="email" />}
          </Field>
          <Field label="Teléfono" optional error={firstError(state, 'contactPhone')}>
            {(p) => <Input {...p} name="contactPhone" type="tel" autoComplete="tel" placeholder="+54 11 ..." />}
          </Field>
        </div>
        <input type="hidden" name="country" value="AR" />
        <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-muted">Vas a quedar como dueño/a de la empresa en Cobra+.</p>
          <Button type="submit" size="lg" loading={pending}>Crear empresa y seguir</Button>
        </div>
      </Card>
    </form>
  )
}
