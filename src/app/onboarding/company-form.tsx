'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'
import { Card } from '@/components/ui/misc'
import { FormFeedback } from '@/components/forms/form-feedback'
import { createOrganization } from '@/server/actions/organization'
import { firstError, initialFormState } from '@/server/actions/form-state'

const CURRENCIES = [
  ['ARS', 'Pesos argentinos (ARS)'], ['USD', 'Dólares (USD)'], ['UYU', 'Pesos uruguayos (UYU)'],
  ['CLP', 'Pesos chilenos (CLP)'], ['MXN', 'Pesos mexicanos (MXN)'], ['BRL', 'Reales (BRL)'],
  ['COP', 'Pesos colombianos (COP)'], ['PEN', 'Soles (PEN)'],
] as const

const TIMEZONES = [
  'America/Argentina/Buenos_Aires', 'America/Montevideo', 'America/Santiago', 'America/Sao_Paulo',
  'America/Bogota', 'America/Lima', 'America/Mexico_City',
]

/**
 * Sólo lo imprescindible: nombre y moneda. Zona horaria (la del navegador), frecuencia
 * mensual y email de contacto (el de la cuenta) se completan solos; se cambian en Configuración.
 */
export function CompanyForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, action, pending] = useActionState(createOrganization, initialFormState)
  const [tz, setTz] = useState('America/Argentina/Buenos_Aires')

  useEffect(() => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (TIMEZONES.includes(browserTz)) setTz(browserTz)
  }, [])

  return (
    <form action={action} noValidate>
      <Card hard className="flex flex-col gap-5 p-5 sm:p-7">
        <FormFeedback state={state} />
        <Field label="Nombre de tu empresa o marca" hint="Es el nombre que van a ver tus clientes en cada aviso." error={firstError(state, 'name')}>
          {(p) => <Input {...p} name="name" autoComplete="organization" required autoFocus placeholder="Ej.: Estudio Martínez" />}
        </Field>
        <Field label="¿En qué moneda cobrás?" hint="Si cobrás en otra moneda también, podés hacerlo; nunca se mezclan." error={firstError(state, 'currency')}>
          {(p) => (
            <Select {...p} name="currency" defaultValue="ARS">
              {CURRENCIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          )}
        </Field>
        <input type="hidden" name="timezone" value={tz} />
        <input type="hidden" name="billingFrequency" value="monthly" />
        <input type="hidden" name="contactEmail" value={defaultEmail} />
        <input type="hidden" name="country" value="AR" />
        <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto sm:self-start">
          {pending ? 'Creando…' : 'Seguir'}
        </Button>
      </Card>
    </form>
  )
}
