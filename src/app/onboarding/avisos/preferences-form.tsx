'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Card } from '@/components/ui/misc'
import { FormFeedback } from '@/components/forms/form-feedback'
import { saveOnboardingPreferences } from '@/server/actions/onboarding'
import { firstError, initialFormState } from '@/server/actions/form-state'
import { cn } from '@/lib/cn'

const DIGEST = [
  { value: 'daily', label: 'Todos los días', hint: 'Sólo los días que hay algo para mirar. Recomendado.' },
  { value: 'every_3_days', label: 'Cada 3 días', hint: 'Un repaso cada tanto.' },
  { value: 'weekly', label: 'Una vez por semana', hint: 'Todo junto, una vez.' },
  { value: 'off', label: 'No, gracias', hint: 'Entro a la app cuando quiero.' },
] as const

export function PreferencesForm({ defaultEmail, businessName }: { defaultEmail: string; businessName: string }) {
  const [state, action, pending] = useActionState(saveOnboardingPreferences, initialFormState)
  const [reminders, setReminders] = useState<'on' | 'off'>('on')
  const [frequency, setFrequency] = useState<string>('daily')

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      <FormFeedback state={state} />

      <Card hard className="flex flex-col gap-4 p-5 sm:p-7">
        <div>
          <p className="eyebrow">1 · A tus clientes</p>
          <h2 className="mt-2 text-[22px]">¿Querés que Cobra+ les avise por email cuando tienen que pagarte?</h2>
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">
            Les escribe con el nombre de {businessName}: 5 días antes de que venza, el día anterior, el día que vence y si se atrasa.
            Sólo días hábiles, y se corta apenas anotás el pago.
          </p>
        </div>
        <div role="radiogroup" aria-label="Avisos a tus clientes" className="grid gap-2.5 sm:grid-cols-2">
          <Choice name="reminders" value="on" checked={reminders === 'on'} onSelect={() => setReminders('on')} label="Sí, que avise sola" hint="Recomendado. Para eso está Cobra+." />
          <Choice name="reminders" value="off" checked={reminders === 'off'} onSelect={() => setReminders('off')} label="Todavía no" hint="Los prendés después, cuando quieras." />
        </div>
        {reminders === 'on' && (
          <Field label="Si tu cliente responde el email, ¿a dónde te llega?" error={firstError(state, 'replyTo')}>
            {(p) => <Input {...p} name="replyTo" type="email" inputMode="email" defaultValue={defaultEmail} placeholder="vos@tuempresa.com" />}
          </Field>
        )}
      </Card>

      <Card hard className="flex flex-col gap-4 p-5 sm:p-7">
        <div>
          <p className="eyebrow">2 · A vos</p>
          <h2 className="mt-2 text-[22px]">¿Cada cuánto querés tu resumen por email?</h2>
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">
            Te contamos quién te pagó, qué vence y quién está atrasado, así no tenés que entrar a revisar. Nunca los fines de semana.
          </p>
        </div>
        <div role="radiogroup" aria-label="Frecuencia del resumen" className="grid gap-2.5 sm:grid-cols-2">
          {DIGEST.map((o) => (
            <Choice key={o.value} name="frequency" value={o.value} checked={frequency === o.value} onSelect={() => setFrequency(o.value)} label={o.label} hint={o.hint} />
          ))}
        </div>
      </Card>

      <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto sm:self-start">
        {pending ? 'Guardando…' : 'Seguir'}
      </Button>
    </form>
  )
}

/** Opción grande, fácil de tocar en el celular. Es un radio de verdad: se envía con el formulario. */
function Choice({ name, value, checked, onSelect, label, hint }: { name: string; value: string; checked: boolean; onSelect: () => void; label: string; hint: string }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 rounded-[14px] p-4 transition-colors', checked ? 'bg-brand-soft ring-2 ring-brand' : 'bg-surface ring-1 ring-line-2 hover:ring-ink/30')}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="mt-0.5 size-[18px] shrink-0 accent-[var(--brand)]" />
      <span className="flex flex-col">
        <span className="text-[15px] font-bold">{label}</span>
        <span className="text-[13px] leading-snug text-muted">{hint}</span>
      </span>
    </label>
  )
}
