import { ArrowRight, Check, Clock, Mail, MinusCircle, X } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ───────────────────────── Cinta de excusas ───────────────────────── */

const EXCUSES = [
  'Mañana te transfiero',
  '¿Me pasás el alias de nuevo?',
  'Se me pasó, perdón',
  'Ya te pagué, fijate bien',
  'El lunes sin falta',
  'Estoy esperando que me paguen a mí',
  'No me llegó la factura',
  'Te pago la semana que viene, prometido',
  '¿Cuánto era?',
  'Ahí te mandé el comprobante (no mandó nada)',
]

/** Las excusas de siempre, como globos de chat: se entiende al toque. */
export function ExcuseBubbles() {
  return (
    <div className="reveal flex flex-col items-center gap-4">
      <p className="text-[15px] font-bold text-muted">Lo que te contestan cuando les pedís que paguen:</p>
      <ul className="flex max-w-4xl flex-wrap justify-center gap-2.5">
        {EXCUSES.slice(0, 8).map((e, i) => (
          <li
            key={e}
            className="rounded-[18px] rounded-bl-[4px] bg-surface px-4 py-2.5 text-[15px] font-semibold shadow-[var(--shadow-soft)] ring-1 ring-line"
            style={{ rotate: `${(i % 3) - 1}deg` }}
          >
            {e}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─────────────────────── Libreta vs. Cobra+ ─────────────────────── */

const LIBRETA: { text: string; style?: string }[] = [
  { text: 'Rivas — 150 mil (nov) ¿pagó??' },
  { text: 'Clínica N. 320.000 → “el lunes”', style: 'line-through decoration-2' },
  { text: 'Clínica N. → dijo el otro lunes' },
  { text: 'Panadería me pasó 50… o 60?' },
  { text: 'Delta ✓ (creo)' },
  { text: 'LLAMAR A TODOS EL VIERNES!!', style: 'font-bold' },
]

const SHEET = [
  { name: 'Estudio Rivas', detail: 'Vencido hace 4 días · 2 avisos enviados', amount: '150.000', icon: Clock, tile: 'bg-danger-soft text-danger' },
  { name: 'Clínica Norte', detail: 'Vence mañana · aviso programado 10:00', amount: '320.000', icon: Mail, tile: 'bg-warn-soft text-warn' },
  { name: 'Panadería Sol', detail: 'Pagó $ 50.000 el 08/11 · saldo $ 45.000', amount: '95.000', icon: MinusCircle, tile: 'bg-info-soft text-info' },
  { name: 'Grupo Delta', detail: 'Pagado el 12/11 · avisos frenados', amount: '480.000', icon: Check, tile: 'bg-ok-soft text-ok' },
]

export function LibretaVsCobra() {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
      {/* Antes: la libreta */}
      <div className="reveal flex flex-col items-center gap-5">
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-3 px-3.5 py-1.5 text-[13px] font-bold text-muted">
          <X className="size-3.5 text-danger" strokeWidth={3} /> Así se lleva hoy: anotado a mano
        </span>
        <figure className="relative w-full max-w-[460px] rotate-[-1.5deg]">
          <span aria-hidden className="absolute -top-3 left-1/2 z-10 h-7 w-28 -translate-x-1/2 rotate-[3deg] bg-[#e9dfc4]/85 shadow-sm" />
          <div className="ruled rounded-[6px] border border-black/10 pt-10 pr-6 pb-6 pl-[66px] shadow-[0_22px_44px_-20px_rgba(22,35,59,.45)]">
            <ul className="birome text-[25px] leading-[36px]">
              {LIBRETA.map((l, i) => (
                <li key={i} className={l.style}>{l.text}</li>
              ))}
            </ul>
          </div>
          <figcaption className="sr-only">Una libreta con deudas anotadas a mano, tachones y dudas.</figcaption>
        </figure>
      </div>

      <span aria-hidden className="hard-sm mx-auto grid size-12 rotate-90 place-items-center rounded-full bg-brand text-ink lg:rotate-0">
        <ArrowRight className="size-5" strokeWidth={2.75} />
      </span>

      {/* Ahora: Cobra+ */}
      <div className="reveal flex flex-col items-center gap-5">
        <span className="inline-flex items-center gap-2 rounded-full bg-ok-soft px-3.5 py-1.5 text-[13px] font-bold text-ok">
          <Check className="size-3.5" strokeWidth={3} /> Lo mismo, en Cobra+
        </span>
        <figure className="soft w-full max-w-[460px] overflow-hidden rounded-[24px] bg-surface">
          <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-3">
            <span className="dots" aria-hidden><i /><i /><i /></span>
            <span className="rounded-full bg-marker px-2.5 py-0.5 text-[11px] font-extrabold">Ejemplo</span>
          </div>
          <ul>
            {SHEET.map(({ name, detail, amount, icon: Icon, tile }) => (
              <li key={name} className="flex items-center gap-3 border-b border-line px-5 py-3.5 last:border-b-0">
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-[11px]', tile)}><Icon className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-bold">{name}</p>
                  <p className="text-[12.5px] text-muted">{detail}</p>
                </div>
                <span className="money shrink-0 text-[14.5px]">$ {amount}</span>
              </li>
            ))}
          </ul>
          <figcaption className="sr-only">La misma información en Cobra+: estado exacto, avisos enviados y saldos.</figcaption>
        </figure>
      </div>
    </div>
  )
}

/* ─────────────────── Lo que le llega a tu cliente ─────────────────── */

function V({ children }: { children: React.ReactNode }) {
  return <span className="rounded-[4px] bg-[#fff3c4] px-0.5 underline decoration-brand decoration-dotted decoration-2 underline-offset-[3px]">{children}</span>
}

export function EmailPreview() {
  return (
    <figure className="w-full overflow-hidden rounded-[20px] bg-surface text-ink">
      <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-3">
        <span className="text-[13px] font-extrabold">Lo recibe tu cliente</span>
        <span className="rounded-full bg-marker px-2.5 py-0.5 text-[11px] font-extrabold">Ejemplo</span>
      </div>
      <dl className="grid grid-cols-[64px_1fr] gap-y-1.5 border-b border-line px-5 py-4 text-[13.5px]">
        <dt className="font-bold text-faint">De</dt>
        <dd><V>Estudio Martínez</V> <span className="text-muted">vía Cobra+</span></dd>
        <dt className="font-bold text-faint">Para</dt>
        <dd><V>Panadería Sol</V></dd>
        <dt className="font-bold text-faint">Asunto</dt>
        <dd className="font-bold">Tu cuota de <V>noviembre</V> vence el <V>27/11</V></dd>
      </dl>
      <div className="flex flex-col gap-3 px-5 py-5 text-[15px] leading-relaxed">
        <p>Hola <V>Laura</V>, ¿cómo estás?</p>
        <p>
          Te escribimos de <V>Estudio Martínez</V> para recordarte que la cuota de <V>Gestión de redes – noviembre</V> por{' '}
          <V><span className="num font-bold">$ 95.000</span></V> vence el <V>viernes 27 de noviembre</V>.
        </p>
        <div className="rounded-[12px] border border-line-2 bg-surface-2 px-3.5 py-3 text-[14px]">
          <p className="text-[12px] font-extrabold text-muted">Datos para transferir</p>
          <p className="mt-0.5">Alias: <V><span className="font-bold">estudio.martinez</span></V></p>
          <p>A nombre de: <V>Estudio Martínez</V></p>
        </div>
        <p className="text-muted">¿Ya pagaste? Respondé este email con el comprobante. ¡Gracias!</p>
      </div>
      <figcaption className="flex items-center gap-2 border-t border-dashed border-line-2 bg-surface-2 px-5 py-3 text-[12.5px] font-semibold text-muted">
        <span className="inline-block h-3 w-5 rounded-[3px] bg-[#fff3c4] underline decoration-brand decoration-dotted" aria-hidden />
        Lo marcado lo completa Cobra+ con los datos de cada cobro.
      </figcaption>
    </figure>
  )
}

/* ─────────────────── El resumen que te llega a vos ─────────────────── */

const DIGEST = [
  { dot: 'bg-ok-bright', cls: 'text-ok', label: 'Ayer te pagó', who: 'Grupo Delta', note: 'Consultoría · noviembre', amount: '480.000' },
  { dot: 'bg-warn-bright', cls: 'text-warn', label: 'Vence hoy', who: 'Clínica Norte', note: 'Ya le avisamos esta mañana', amount: '320.000' },
  { dot: 'bg-danger-bright', cls: 'text-danger', label: 'Atrasado 4 días', who: 'Estudio Rivas', note: '2 avisos enviados, sin respuesta', amount: '150.000' },
]

export function DigestPreview() {
  return (
    <figure className="w-full overflow-hidden rounded-[20px] bg-surface text-ink">
      <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-3">
        <span className="text-[13px] font-extrabold">Lo recibís vos</span>
        <span className="rounded-full bg-marker px-2.5 py-0.5 text-[11px] font-extrabold">Ejemplo</span>
      </div>
      <dl className="grid grid-cols-[64px_1fr] gap-y-1.5 border-b border-line px-5 py-4 text-[13.5px]">
        <dt className="font-bold text-faint">De</dt>
        <dd>Cobra+</dd>
        <dt className="font-bold text-faint">Para</dt>
        <dd>Vos y quien lleve tu administración</dd>
        <dt className="font-bold text-faint">Asunto</dt>
        <dd className="font-bold">Tu resumen de hoy: 1 cobro vence y 1 está atrasado</dd>
      </dl>
      <div className="px-5 py-5">
        <p className="text-[15px] leading-relaxed">Buen día. Esto pasó con tus cobros:</p>
        <ul className="mt-3 flex flex-col divide-y divide-line border-y border-line">
          {DIGEST.map((d) => (
            <li key={d.who} className="flex items-center gap-3 py-3">
              <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', d.dot)} />
              <div className="min-w-0 flex-1 leading-snug">
                <p className={cn('text-[12.5px] font-extrabold', d.cls)}>{d.label}</p>
                <p className="truncate text-[15px] font-bold">{d.who}</p>
                <p className="truncate text-[13px] text-muted">{d.note}</p>
              </div>
              <span className="money shrink-0 text-[15px]">$ {d.amount}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="border-t border-dashed border-line-2 bg-surface-2 px-5 py-3 text-[12.5px] font-semibold text-muted">
        Llega sólo los días que hay novedades. No hace falta entrar a la app.
      </figcaption>
    </figure>
  )
}

/* ─────────────── Lo que pasa de verdad cuando cobrás ─────────────── */

const CASES = [
  { who: 'Tu cliente dice', says: 'Mañana te transfiero.', tag: 'Promesa de pago', does: 'Anotás el día que te prometió. Cobra+ no le escribe hasta entonces y, si no pagó, retoma sola.', mine: false },
  { who: 'Tu cliente dice', says: 'Ya te pagué, fijate.', tag: 'Comprobante', does: 'Responde el email con el comprobante y te llega a vos. Lo marcás como pagado y no recibe más avisos.', mine: false },
  { who: 'Tu cliente dice', says: 'Yo los mails ni los abro.', tag: 'WhatsApp con un toque', does: 'Cobra+ te deja el mensaje de WhatsApp ya escrito. Lo mandás desde tu teléfono con un toque.', mine: false },
  { who: 'Vos pensás', says: 'Me da cosa reclamarle.', tag: 'Vos tenés el control', does: 'El aviso sale amable, a tiempo y con tu firma. Podés leerlo antes de que salga y pausar a quien quieras.', mine: true },
]

export function HumanCases() {
  return (
    <ul className="border-t-2 border-ink">
      {CASES.map((c) => (
        <li key={c.says} className="grid gap-4 border-b border-line-2 py-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-center md:gap-10">
          <div className="flex flex-col items-start gap-1.5">
            <span className="text-[12.5px] font-extrabold text-muted">{c.who}</span>
            <p
              className={cn(
                'max-w-full rounded-[18px] border-[1.5px] border-ink px-4 py-2.5 font-display text-[19px] leading-snug font-bold tracking-[-0.02em]',
                c.mine ? 'rounded-br-[4px] bg-brand-soft' : 'rounded-bl-[4px] bg-surface',
              )}
            >
              “{c.says}”
            </p>
          </div>
          <div>
            <p className="text-[12.5px] font-extrabold text-brand-text">{c.tag}</p>
            <p className="mt-1 text-[16.5px] leading-relaxed">{c.does}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
