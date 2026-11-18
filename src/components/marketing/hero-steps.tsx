import { BellOff, Check, Mail } from 'lucide-react'
import { Logo } from '@/components/ui/misc'
import { cn } from '@/lib/cn'

/**
 * El hero: Cobra+ contada en 4 pasos, los 4 a la vista y cada uno con su
 * pantalla de EJEMPLO. En escritorio es una tira de izquierda a derecha;
 * en celular, una línea de tiempo de arriba hacia abajo.
 */
const STEPS = [
  { title: 'Cargás a tu cliente', text: 'Nombre, email, cuánto te paga y cuándo vence. Una sola vez.', Screen: ScreenForm },
  { title: 'Cobra+ le avisa por vos', text: 'Por email, sola. Y desde Starter, también te deja el WhatsApp escrito.', Screen: ScreenReminder },
  { title: 'Te paga a vos y lo marcás', text: 'La plata va a tu cuenta. Marcás “Pagó” y Cobra+ no le escribe más.', Screen: ScreenPaid },
  { title: 'A vos también te avisa', text: 'Te llega un resumen: quién pagó, qué vence hoy y quién se atrasó.', Screen: ScreenDigest },
] as const

export function HeroSteps() {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="eyebrow font-sans">Funciona así, en 4 pasos</h2>
        <p className="rounded-full bg-marker px-2.5 py-1 text-[11.5px] font-extrabold">Las pantallas son de ejemplo</p>
      </div>

      <ol className="grid grid-cols-1 gap-y-9 lg:grid-cols-4 lg:gap-x-5">
        {STEPS.map((s, i) => {
          const Screen = s.Screen
          return (
            <li
              key={s.title}
              className="intro relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 lg:block"
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              {/* la línea que une un paso con el siguiente */}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-11 -bottom-8 left-[19px] border-l-2 border-dashed border-ink/25 lg:top-[19px] lg:right-[-20px] lg:bottom-auto lg:left-11 lg:border-t-2 lg:border-l-0"
                />
              )}
              <span className="relative z-10 grid size-10 place-items-center rounded-full bg-brand font-display text-[17px] font-black text-white ring-4 ring-bg">
                {i + 1}
              </span>
              <div className="min-w-0 lg:mt-3.5">
                <h3 className="text-[18.5px] tracking-[-0.02em]">{s.title}</h3>
                <p className="mt-1 text-[14.5px] leading-snug text-muted lg:min-h-[2.75em]">{s.text}</p>
                <div className="mt-3.5 max-w-[440px] rounded-[18px] border-[1.5px] border-ink bg-surface p-3.5 lg:h-[236px] lg:max-w-none">
                  {/* en celular la pantalla se ve un 12 % más grande */}
                  <div className="h-full max-lg:[zoom:1.12]"><Screen /></div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ───────────── 1. El formulario ───────────── */

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border-[1.5px] border-[#ece4d8] bg-surface-2 px-2.5 py-1.5">
      <p className="text-[10.5px] leading-tight font-bold text-muted">{label}</p>
      <p className="truncate text-[13.5px] leading-snug font-bold">{value}</p>
    </div>
  )
}

function ScreenForm() {
  return (
    <div className="flex h-full flex-col gap-1.5">
      <p className="text-[12.5px] font-extrabold">Nuevo cliente</p>
      <MiniField label="Cliente" value="Estudio Rivas" />
      <MiniField label="Email" value="marina@estudiorivas.example" />
      <div className="grid grid-cols-2 gap-1.5">
        <MiniField label="Te paga" value="$ 150.000" />
        <MiniField label="Vence" value="Día 10" />
      </div>
      {/* dibujo de un botón: no es un control real */}
      <div aria-hidden className="mt-auto flex h-8 items-center justify-center gap-1.5 rounded-[9px] bg-brand font-display text-[12.5px] font-bold text-white">
        <Check className="size-3.5" strokeWidth={3} /> Guardar
      </div>
    </div>
  )
}

/* ───────────── 2. El email que recibe tu cliente ───────────── */

function MailHead({ icon, from, to }: { icon: React.ReactNode; from: string; to: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-line pb-2.5">
      {icon}
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[13px] font-extrabold">{from}</p>
        <p className="truncate text-[11.5px] text-muted">{to}</p>
      </div>
    </div>
  )
}

function ScreenReminder() {
  return (
    <div className="flex h-full flex-col">
      <MailHead
        icon={<span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white"><Mail className="size-4" /></span>}
        from="Tu empresa"
        to="Para: Marina, de Estudio Rivas"
      />
      <p className="mt-2.5 text-[14px] leading-snug font-extrabold">Tu cuota vence el martes 10</p>
      <p className="mt-1 text-[13px] leading-snug text-muted">
        Hola Marina: te recordamos que la cuota de noviembre por <b className="font-bold text-ink">$ 150.000</b> vence el martes 10.
      </p>
      <p className="mt-auto flex items-center gap-1.5 pt-2 text-[11.5px] font-extrabold text-ok">
        <Check className="size-3.5" strokeWidth={3.5} /> Lo mandó Cobra+, no vos
      </p>
    </div>
  )
}

/* ───────────── 3. Te paga y lo marcás ───────────── */

function ScreenPaid() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-[11.5px] font-extrabold text-brand-text">ER</span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13px] font-extrabold">Estudio Rivas</p>
          <p className="money text-[13.5px]">$ 150.000</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center py-3.5">
        <span className="stamp text-[17px]">Pagado</span>
      </div>
      <div className="border-t border-dashed border-line-2 pt-2">
        <p className="text-[11px] font-extrabold text-muted">Avisos que ya no se mandan</p>
        <ul className="mt-1 flex flex-col gap-0.5 text-[12.5px] font-semibold text-faint">
          {['Aviso de atraso', 'Segundo aviso'].map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <BellOff className="size-3 shrink-0" /> <span className="line-through">{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ───────────── 4. El resumen que te llega a vos ───────────── */

const DIGEST = [
  { dot: 'bg-ok-bright', cls: 'text-ok', label: 'Ayer te pagó', who: 'Grupo Delta', amount: '$ 480.000' },
  { dot: 'bg-warn-bright', cls: 'text-warn', label: 'Vence hoy', who: 'Clínica Norte', amount: '$ 320.000' },
  { dot: 'bg-danger-bright', cls: 'text-danger', label: 'Atrasado 4 días', who: 'Estudio Rivas', amount: '$ 150.000' },
]

function ScreenDigest() {
  return (
    <div className="flex h-full flex-col">
      <MailHead
        icon={<Logo withWord={false} className="size-8 rounded-full" />}
        from="Cobra+"
        to="Para: vos"
      />
      <p className="mt-2.5 text-[14px] leading-snug font-extrabold">Tu resumen de hoy</p>
      <ul className="mt-1 flex flex-col divide-y divide-line">
        {DIGEST.map((d) => (
          <li key={d.who} className="flex items-center gap-2 py-1.5">
            <span aria-hidden className={cn('size-2 shrink-0 rounded-full', d.dot)} />
            <div className="min-w-0 flex-1 leading-tight">
              <p className={cn('text-[11px] font-extrabold', d.cls)}>{d.label}</p>
              <p className="truncate text-[12.5px] font-bold">{d.who}</p>
            </div>
            <span className="money shrink-0 text-[12.5px]">{d.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
