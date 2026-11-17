'use client'

import { useId, useState } from 'react'
import { Clock3, Hourglass, MessageCircle, Users } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * "¿Cuántas horas se te van persiguiendo pagos?" Con los números de cada
 * persona: no presenta estadísticas, sólo multiplica lo que vos cargás.
 */
type Key = 'clients' | 'late' | 'messages' | 'minutes'
type Input = { key: Key; label: string; min: number; max: number; step: number; suffix: string; icon: typeof Users; tile: string }

const INPUTS: Input[] = [
  { key: 'clients', label: 'Clientes que te pagan por mes', min: 5, max: 200, step: 5, suffix: '', icon: Users, tile: 'bg-brand-soft text-brand-d' },
  { key: 'late', label: 'De cada 10, ¿cuántos pagan tarde?', min: 0, max: 10, step: 1, suffix: ' de 10', icon: Hourglass, tile: 'bg-danger-soft text-danger' },
  { key: 'messages', label: 'Mensajes hasta que pagan', min: 1, max: 8, step: 1, suffix: '', icon: MessageCircle, tile: 'bg-info-soft text-info' },
  { key: 'minutes', label: 'Minutos por mensaje (buscar el chat, escribir, chequear)', min: 1, max: 15, step: 1, suffix: ' min', icon: Clock3, tile: 'bg-ok-soft text-ok' },
]

export function ChaseCalculator() {
  const id = useId()
  const [v, setV] = useState<Record<Key, number>>({ clients: 40, late: 3, messages: 3, minutes: 5 })

  const lateClients = Math.round((v.clients * v.late) / 10)
  const messagesPerMonth = lateClients * v.messages
  const hoursMonth = (messagesPerMonth * v.minutes) / 60
  const hoursYear = hoursMonth * 12
  const fmt = (n: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(n)

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div className="soft flex flex-col gap-7 rounded-[26px] bg-surface p-6 sm:p-8">
        <p className="eyebrow">Tus números · movelos</p>
        {INPUTS.map((inp) => {
          const fill = ((v[inp.key] - inp.min) / (inp.max - inp.min)) * 100
          const Icon = inp.icon
          return (
            <div key={inp.key} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor={`${id}-${inp.key}`} className="flex items-center gap-3 text-[15px] font-bold">
                  <span className={cn('grid size-9 shrink-0 place-items-center rounded-[11px]', inp.tile)} aria-hidden><Icon className="size-4" /></span>
                  {inp.label}
                </label>
                <output htmlFor={`${id}-${inp.key}`} className="money shrink-0 rounded-[10px] bg-surface-3 px-2.5 py-1 text-[17px]">{v[inp.key]}{inp.suffix}</output>
              </div>
              <input
                id={`${id}-${inp.key}`}
                type="range"
                min={inp.min}
                max={inp.max}
                step={inp.step}
                value={v[inp.key]}
                onChange={(e) => setV((s) => ({ ...s, [inp.key]: Number(e.target.value) }))}
                className="range w-full"
                style={{ '--fill': `${fill}%` } as React.CSSProperties}
              />
            </div>
          )
        })}
      </div>

      {/* resultado, como la tarjeta de resultado del toolkit */}
      <div className="hard flex flex-col overflow-hidden rounded-[26px] bg-surface" aria-live="polite">
        <div className="flex items-center justify-between bg-navy px-6 py-4 text-white">
          <p className="label">Tu costo de perseguir</p>
          <span className="text-[12px] font-semibold text-white/70">con tus números</span>
        </div>
        <div className="flex flex-1 flex-col gap-5 p-6">
          <div className="flex flex-col divide-y divide-line text-[14.5px]">
            <Line k="Clientes que pagan tarde" v={`${lateClients} por mes`} />
            <Line k="Mensajes que mandás" v={`${messagesPerMonth} por mes`} />
            <Line k="Tiempo por mes" v={`${fmt(hoursMonth)} h`} />
          </div>
          <div className="mt-auto rounded-[18px] bg-brand-soft p-5">
            <p className="text-[14px] font-bold text-brand-text">Se te van al año</p>
            <p className="money text-[52px] leading-none sm:text-[60px]">{fmt(hoursYear)} <span className="text-[28px]">horas</span></p>
            <p className="mt-3 text-[14px] text-ink/80">
              {hoursYear >= 8
                ? <>Son <b className="text-ink">{fmt(hoursYear / 8)} jornadas</b> de 8 horas escribiendo el mismo mensaje. Cobra+ los manda solo.</>
                : <>Poco tiempo, pero igual es tiempo tuyo. Cobra+ los manda solo.</>}
            </p>
          </div>
          <p className="text-[12px] text-muted">Calculado sólo con los números que cargaste. No es una estadística.</p>
        </div>
      </div>
    </div>
  )
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <span className="text-muted">{k}</span>
      <span className="num font-extrabold">{v}</span>
    </div>
  )
}
