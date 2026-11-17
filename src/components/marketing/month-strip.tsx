'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, BellOff, Check, Mail, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * El mes de UN cliente (ejemplo), día por día. Se reproduce solo cuando
 * entra en pantalla y después se puede tocar el día en que paga: los
 * avisos posteriores al pago dejan de mandarse.
 */
const DAYS = 21 // del 1 al 21 de noviembre de 2026 (el 1 es domingo)
const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const DUE = 10
const AMOUNT = '$ 150.000'
const REMINDERS: { day: number; text: string }[] = [
  { day: 5, text: '“Tu cuota vence en 5 días”' },
  { day: 9, text: '“Tu cuota vence mañana”' },
  { day: 10, text: '“Hoy vence tu cuota”' },
  { day: 13, text: '“Tu cuota está vencida”' },
  { day: 17, text: '“Tu cuota sigue vencida”' },
]
const LATE_DAY = 18

type Event =
  | { day: number; kind: 'sent' | 'cancelled'; text: string }
  | { day: number; kind: 'paid' }
  | { day: number; kind: 'late' }

function eventsFor(payDay: number | null): Event[] {
  const list: Event[] = REMINDERS.map((r) => ({
    day: r.day,
    kind: payDay !== null && r.day > payDay ? 'cancelled' : 'sent',
    text: r.text,
  }))
  if (payDay !== null) list.push({ day: payDay, kind: 'paid' })
  else list.push({ day: LATE_DAY, kind: 'late' })
  // el pago va después de un aviso del mismo día (el aviso salió a la mañana)
  return list.sort((a, b) => a.day - b.day || (a.kind === 'paid' ? 1 : -1))
}

export function MonthStrip() {
  const [payDay, setPayDay] = useState<number | null>(12)
  const [cursor, setCursor] = useState(DAYS)
  const timer = useRef<number | undefined>(undefined)
  const payRef = useRef(payDay)
  useEffect(() => { payRef.current = payDay }, [payDay])

  const play = useCallback(() => {
    window.clearTimeout(timer.current)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCursor(DAYS)
      return
    }
    let c = 0
    setCursor(0)
    const tick = () => {
      c += 1
      setCursor(c)
      const isEvent = eventsFor(payRef.current).some((e) => e.day === c)
      if (c < DAYS) timer.current = window.setTimeout(tick, isEvent ? 1300 : 180)
    }
    timer.current = window.setTimeout(tick, 600)
  }, [])

  // Arranca cuando la tarjeta entra en pantalla (una sola vez).
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        play()
        io.disconnect()
      }
    }, { threshold: 0.45 })
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearTimeout(timer.current)
    }
  }, [play])

  function choose(day: number | null) {
    window.clearTimeout(timer.current)
    setPayDay(day)
    setCursor(DAYS)
  }

  const events = eventsFor(payDay)
  const sent = events.filter((e) => e.kind === 'sent').length
  const cancelled = events.filter((e) => e.kind === 'cancelled').length
  const done = cursor >= DAYS
  const current = [...events].reverse().find((e) => e.day <= cursor)

  return (
    <div ref={root} className="hard overflow-hidden rounded-[28px] bg-surface">
      {/* el cliente */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-4 sm:px-7 sm:py-5">
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-[14px] font-extrabold text-brand-text">ER</span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-extrabold tracking-[-0.01em]">Estudio Rivas</p>
          <p className="text-[14px] text-muted">Te paga <b className="font-bold text-ink">{AMOUNT}</b> por mes · vence el <b className="font-bold text-ink">día 10</b></p>
        </div>
        <span className="rounded-full bg-marker px-2.5 py-1 text-[11.5px] font-extrabold">Ejemplo</span>
      </div>

      {/* la tira de días */}
      <div className="px-3 pt-8 pb-5 sm:px-6">
        <ol className="grid grid-cols-7 gap-1.5 lg:grid-cols-[repeat(21,minmax(0,1fr))] lg:gap-1">
          {Array.from({ length: DAYS }, (_, i) => {
            const d = i + 1
            const reached = d <= cursor
            const rem = events.find((e) => e.day === d && (e.kind === 'sent' || e.kind === 'cancelled'))
            const isPay = payDay === d
            return (
              <li key={d} className="relative">
                <button
                  type="button"
                  onClick={() => choose(d)}
                  aria-pressed={isPay}
                  aria-label={`Día ${d}: elegir que te paga este día`}
                  className={cn(
                    'flex w-full flex-col items-center gap-1.5 rounded-[12px] py-2 transition-[opacity,background-color] duration-300',
                    reached ? 'opacity-100' : 'opacity-25',
                    isPay ? 'bg-ok-soft' : 'hover:bg-surface-3',
                  )}
                >
                  <span className="text-[10.5px] font-bold text-faint">{WEEKDAYS[i % 7]}</span>
                  <span className={cn('money grid size-8 place-items-center rounded-full text-[16px] leading-none', d === DUE && 'ring-[2.5px] ring-danger-bright')}>{d}</span>
                  <span className="grid size-6 place-items-center">
                    {isPay ? (
                      <span className="grid size-6 place-items-center rounded-full bg-ok-bright text-ink"><Check className="size-3.5" strokeWidth={3.5} /></span>
                    ) : rem?.kind === 'sent' ? (
                      <span className="grid size-6 place-items-center rounded-full bg-brand text-ink"><Mail className="size-3.5" /></span>
                    ) : rem?.kind === 'cancelled' ? (
                      <span className="grid size-6 place-items-center rounded-full border-2 border-dashed border-line-2 text-faint"><BellOff className="size-3" /></span>
                    ) : payDay === null && d === LATE_DAY ? (
                      <span className="grid size-6 place-items-center rounded-full bg-danger-bright text-white"><AlertTriangle className="size-3" strokeWidth={3} /></span>
                    ) : null}
                  </span>
                </button>
                {isPay && reached && (
                  <span className="stamp stamp-now pointer-events-none absolute -top-5 left-1/2 z-10 -translate-x-1/2 text-[10px]">Pagado</span>
                )}
              </li>
            )
          })}
        </ol>

        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[12.5px] font-semibold text-muted">
          <Legend className="bg-brand text-ink" icon={<Mail className="size-2.5" />}>COBRA mandó un email</Legend>
          <Legend className="bg-ok-bright text-ink" icon={<Check className="size-2.5" strokeWidth={4} />}>Te pagó</Legend>
          <Legend className="border-[1.5px] border-dashed border-line-2 text-faint" icon={<BellOff className="size-2.5" />}>Email que ya no se manda</Legend>
          <span className="inline-flex items-center gap-1.5"><span className="size-3.5 rounded-full ring-2 ring-danger-bright" />Día que vence</span>
        </p>
      </div>

      {/* qué está pasando, en una frase */}
      <div className="flex flex-col gap-3 border-t border-line bg-brand-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <p className="min-h-[3rem] text-[16px] leading-snug font-bold sm:min-h-0 sm:text-[17px]" aria-live="polite">
          {done ? (
            payDay === null
              ? `No pagó. COBRA le mandó los ${sent} avisos y lo ves en rojo en tu panel.`
              : sent === 0
                ? `Pagó el día ${payDay}, antes del primer aviso. COBRA no le mandó nada.`
                : `Pagó el día ${payDay}. COBRA mandó ${sent} ${sent === 1 ? 'email' : 'emails'}${cancelled ? ` y canceló ${cancelled === 1 ? 'el que faltaba' : `los ${cancelled} que faltaban`}` : ''}. Vos no escribiste ninguno.`
          ) : !current ? (
            'Empieza el mes…'
          ) : current.kind === 'sent' ? (
            <>Día {current.day}: COBRA le manda un email. <span className="font-semibold text-muted">{current.text}</span></>
          ) : current.kind === 'paid' ? (
            <>Día {current.day}: te pagó {AMOUNT}.</>
          ) : current.kind === 'cancelled' ? (
            <>Día {current.day}: este email ya no se manda, porque pagó.</>
          ) : (
            <>Día {current.day}: sigue sin pagar. Lo ves en rojo en tu panel.</>
          )}
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => choose(payDay === null ? 12 : null)}
            className="rounded-[10px] px-3 py-1.5 text-[13px] font-bold ring-1 ring-inset ring-line-2 bg-surface shadow-[0_1px_2px_rgba(22,35,59,.06)] transition-colors hover:bg-surface-2 hover:ring-ink/25 active:scale-[0.97]"
          >
            {payDay === null ? 'Que pague el 12' : '¿Y si no paga?'}
          </button>
          <button type="button" onClick={play} className="inline-flex items-center gap-1 rounded-[10px] px-2 py-1.5 text-[13px] font-bold text-muted hover:text-ink">
            <RotateCcw className="size-3.5" /> Ver de nuevo
          </button>
        </div>
      </div>
    </div>
  )
}

function Legend({ className, icon, children }: { className: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('grid size-4 place-items-center rounded-full', className)}>{icon}</span>
      {children}
    </span>
  )
}
