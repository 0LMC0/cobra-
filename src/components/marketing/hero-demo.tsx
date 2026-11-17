'use client'

import { useState } from 'react'
import { Check, MousePointerClick, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Demo interactiva del panel con DATOS DE EJEMPLO (rotulada como tal):
 * marcás que un cliente pagó → cae el sello → los totales se recalculan.
 */
type Tone = 'danger' | 'warn' | 'neutral'
type Row = {
  id: string
  initials: string
  name: string
  amount: number // pesos
  status: string
  tone: Tone
  overdue: boolean
}

const ROWS: Row[] = [
  { id: 'rivas', initials: 'ER', name: 'Estudio Rivas', amount: 150_000, status: 'Atrasado 4 días', tone: 'danger', overdue: true },
  { id: 'norte', initials: 'CN', name: 'Clínica Norte', amount: 320_000, status: 'Vence mañana', tone: 'warn', overdue: false },
  { id: 'sol', initials: 'PS', name: 'Panadería Sol', amount: 95_000, status: 'Vence el 27/11', tone: 'neutral', overdue: false },
  { id: 'delta', initials: 'GD', name: 'Grupo Delta', amount: 480_000, status: '', tone: 'neutral', overdue: false },
]

const INITIAL_PAID = new Set(['delta'])
const COLLECTED_BEFORE = 5_635_500 // cobrado antes en el mes (ejemplo)

const statusCls: Record<Tone, string> = {
  danger: 'text-danger',
  warn: 'text-warn',
  neutral: 'text-muted',
}
const ars = (pesos: number) => '$ ' + new Intl.NumberFormat('es-AR').format(pesos)

export function PanelDemo() {
  const [paid, setPaid] = useState<Set<string>>(() => new Set(INITIAL_PAID))
  const [justPaid, setJustPaid] = useState<string | null>(null)

  const unpaid = ROWS.filter((r) => !paid.has(r.id))
  const toCollect = unpaid.reduce((a, r) => a + r.amount, 0)
  const overdue = unpaid.filter((r) => r.overdue).reduce((a, r) => a + r.amount, 0)
  const collected = COLLECTED_BEFORE + ROWS.filter((r) => paid.has(r.id)).reduce((a, r) => a + r.amount, 0)

  function markPaid(id: string) {
    setPaid((p) => new Set(p).add(id))
    setJustPaid(id)
  }
  function reset() {
    setPaid(new Set(INITIAL_PAID))
    setJustPaid(null)
  }
  const touched = paid.size > INITIAL_PAID.size

  return (
    <div className="hard mx-auto w-full max-w-[560px] overflow-hidden rounded-[26px] bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <p className="text-[17px] font-extrabold tracking-[-0.01em]">Tus cobros de noviembre</p>
        <span className="rounded-full bg-marker px-2.5 py-1 text-[11.5px] font-extrabold">Ejemplo</span>
      </div>

      {/* totales */}
      <dl className="grid grid-cols-3 divide-x divide-line border-b border-line" aria-live="polite">
        <Kpi label="Falta cobrar" value={toCollect} valueClass="text-ink" />
        <Kpi label="Ya cobraste" value={collected} valueClass="text-ok" />
        <Kpi label="Atrasado" value={overdue} valueClass={overdue > 0 ? 'text-danger' : 'text-ok'} />
      </dl>

      {/* clientes */}
      <ul>
        {ROWS.map((r) => {
          const isPaid = paid.has(r.id)
          return (
            <li key={r.id} className="relative flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-3 text-[12px] font-extrabold text-muted">{r.initials}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold">{r.name}</p>
                <p className={cn('truncate text-[13px] font-semibold', isPaid ? 'text-ok' : statusCls[r.tone])}>{isPaid ? 'Pagó' : r.status}</p>
              </div>
              <span className={cn('money shrink-0 text-[15.5px]', isPaid && 'text-faint line-through decoration-2')}>{ars(r.amount)}</span>
              {isPaid ? (
                <span
                  className={cn('stamp pointer-events-none shrink-0 text-[11px]', justPaid === r.id ? 'stamp-now' : 'stamp-in')}
                  style={justPaid === r.id ? undefined : { animationDelay: '0.6s' }}
                  aria-label="Pagado"
                >
                  Pagado
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => markPaid(r.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-[9px] px-2.5 py-1 text-[12.5px] font-bold ring-1 ring-inset ring-line-2 bg-surface shadow-[0_1px_2px_rgba(22,35,59,.06)] transition-colors hover:bg-surface-2 hover:ring-ink/25 active:scale-[0.97]"
                  aria-label={`Marcar como pagado: ${r.name}`}
                >
                  <Check className="size-3 text-ok" strokeWidth={3.5} /> Pagó
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 bg-brand-soft px-4 py-3.5 sm:px-5">
        <p className="flex items-center gap-2 text-[14px] font-bold">
          {touched ? (
            <><Check className="size-4 text-ok" strokeWidth={3} /> Listo: los totales ya cambiaron.</>
          ) : (
            <><MousePointerClick className="size-4 text-brand-d" /> Probalo: tocá “Pagó” en un cliente</>
          )}
        </p>
        {touched && (
          <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-[13px] font-bold text-muted hover:text-ink">
            <RotateCcw className="size-3.5" /> Reiniciar
          </button>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value, valueClass }: { label: string; value: number; valueClass: string }) {
  return (
    <div className="px-3 py-3.5 sm:px-5">
      <dt className="text-[11.5px] font-bold text-muted sm:text-[12.5px]">{label}</dt>
      <dd className={cn('money mt-0.5 text-[13.5px] whitespace-nowrap transition-colors sm:text-[19px]', valueClass)}>{ars(value)}</dd>
    </div>
  )
}
