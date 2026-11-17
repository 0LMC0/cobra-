import { formatDate, type IsoDate } from './dates'
import { formatMoneyClean, type CurrencyCode } from './money'
import type { Digest, DigestLine } from './digest'

/**
 * Textos de los emails. Puros: devuelven asunto, texto plano y HTML. Todo lo
 * que viene de los datos se escapa antes de entrar al HTML.
 */
export type RenderedEmail = { subject: string; text: string; html: string }

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const BLUE = '#1d4ed8'
const INK = '#16233b'
const MUTED = '#5f6b82'

function layout(opts: { heading: string; paragraphs: string[]; box?: string; footer: string; cta?: { href: string; label: string } }): string {
  const p = opts.paragraphs.map((t) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.55;color:${INK}">${t}</p>`).join('')
  const box = opts.box ? `<div style="margin:6px 0 18px;padding:14px 16px;border-radius:12px;background:#f4f7ff;border:1px solid #dbe4fb">${opts.box}</div>` : ''
  const cta = opts.cta
    ? `<p style="margin:18px 0 6px"><a href="${escapeHtml(opts.cta.href)}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:${BLUE};color:#ffffff;font-weight:700;font-size:15px;text-decoration:none">${escapeHtml(opts.cta.label)}</a></p>`
    : ''
  return `<!doctype html><html lang="es"><body style="margin:0;padding:24px 12px;background:#fbf7f1;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e3d8c8">
<tr><td style="padding:26px 26px 8px"><h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;color:${INK}">${opts.heading}</h1>${p}${box}${cta}</td></tr>
<tr><td style="padding:14px 26px 22px;border-top:1px solid #efe7dc;font-size:12.5px;line-height:1.5;color:${MUTED}">${opts.footer}</td></tr>
</table></td></tr></table></body></html>`
}

/* ───────────── Recordatorio al cliente ───────────── */

export type ReminderMoment = 'before' | 'due' | 'after' | 'final' | 'promise'

export type ReminderEmailInput = {
  moment: ReminderMoment
  customerName: string
  contactName?: string | null
  businessName: string
  concept: string
  amountMinor: number
  currency: CurrencyCode
  dueDate: IsoDate
  promisedFor?: IsoDate | null
  transferAlias?: string | null
}

const longDate = (d: IsoDate) => formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' })

export function renderReminderEmail(m: ReminderEmailInput): RenderedEmail {
  const who = m.contactName?.trim() ? m.contactName.trim().split(/\s+/)[0]! : m.customerName.trim()
  const amount = formatMoneyClean(m.amountMinor, m.currency)
  const due = longDate(m.dueDate)
  const concept = m.concept.trim()
  const Concept = concept[0]!.toUpperCase() + concept.slice(1)

  const variants: Record<ReminderMoment, { subject: string; line: string }> = {
    before: { subject: `${Concept}: vence el ${formatDate(m.dueDate, { day: 'numeric', month: 'long' })}`, line: `te recordamos que ${concept} por ${amount} vence el ${due}.` },
    due: { subject: `${Concept}: vence hoy`, line: `hoy ${due} vence ${concept} por ${amount}.` },
    after: { subject: `${Concept}: quedó pendiente`, line: `${concept} por ${amount} venció el ${due} y todavía no lo vemos acreditado.` },
    final: { subject: `${Concept} sigue pendiente`, line: `${concept} por ${amount} sigue pendiente desde el ${due}. ¿Nos avisás cuándo lo podés pagar?` },
    promise: { subject: `${Concept}: ¿pudiste pagarlo?`, line: `quedamos en que ${concept} por ${amount} se pagaba ${m.promisedFor ? `el ${longDate(m.promisedFor)}` : 'en estos días'}. ¿Pudiste hacerlo?` },
  }
  const v = variants[m.moment]
  const subject = `${v.subject} · ${m.businessName}`
  const greeting = `Hola ${who}:`
  const body = `Te escribimos de ${m.businessName}: ${v.line}`
  const alias = m.transferAlias ? `Podés transferir al alias ${m.transferAlias}.` : null
  const paid = 'Si ya lo pagaste, respondé este email con el comprobante y listo. ¡Gracias!'
  const footer = `Este aviso lo envía Cobra+ en nombre de ${m.businessName}. Si no querés recibir más recordatorios, respondé este email y los desactivamos.`

  const text = [greeting, '', body, ...(alias ? ['', alias] : []), '', paid, '', '—', footer].join('\n')
  const html = layout({
    heading: escapeHtml(v.subject.replace(/ · .*/, '')),
    paragraphs: [escapeHtml(greeting), escapeHtml(body), escapeHtml(paid)],
    box: `<p style="margin:0;font-size:15px;color:${INK}"><b>${escapeHtml(Concept)}</b><br>${escapeHtml(amount)} · vence el ${escapeHtml(due)}${alias ? `<br>${escapeHtml(alias)}` : ''}</p>`,
    footer: escapeHtml(footer),
  })
  return { subject, text, html }
}

/* ───────────── Resumen para quien cobra ───────────── */

function lines(title: string, items: DigestLine[]): { text: string[]; html: string } {
  if (items.length === 0) return { text: [], html: '' }
  const text = [title, ...items.map((l) => `• ${l.customerName}: ${l.amount} (${l.concept}). ${l.note}.`), '']
  const html = `<p style="margin:16px 0 6px;font-size:14px;font-weight:700;color:${INK}">${escapeHtml(title)}</p><ul style="margin:0;padding-left:18px">${items
    .map((l) => `<li style="margin:0 0 6px;font-size:15px;line-height:1.45;color:${INK}"><b>${escapeHtml(l.customerName)}</b>: ${escapeHtml(l.amount)} <span style="color:${MUTED}">(${escapeHtml(l.concept)}). ${escapeHtml(l.note)}.</span></li>`)
    .join('')}</ul>`
  return { text, html }
}

export function renderDigestEmail(d: Digest, opts: { firstName?: string | null; appUrl: string; settingsUrl: string }): RenderedEmail {
  const hello = opts.firstName ? `Hola ${opts.firstName}:` : 'Hola:'
  const intro = `Esto es lo que tenés para cobrar${d.totals.length ? ` (${d.totals.join(' y ')} en total)` : ''}.`
  const sections = [
    lines('Atrasados', d.overdue),
    lines('Prometieron pagar', d.promises),
    lines('Vencen hoy', d.dueToday),
    lines('Vencen en los próximos días', d.dueSoon),
  ]
  const footer = `Te llega porque tenés cobros para mirar. Podés cambiar cada cuánto lo recibís o apagarlo desde Configuración: ${opts.settingsUrl}`
  const text = [hello, '', intro, '', ...sections.flatMap((s) => s.text), `Entrá a Cobra+ para marcar quién pagó o avisarle por WhatsApp: ${opts.appUrl}`, '', '—', footer].join('\n')
  const html = layout({
    heading: escapeHtml(d.subject),
    paragraphs: [escapeHtml(hello), escapeHtml(intro)],
    box: sections.map((s) => s.html).join(''),
    cta: { href: opts.appUrl, label: 'Abrir Cobra+' },
    footer: `Te llega porque tenés cobros para mirar. Podés cambiar cada cuánto lo recibís o apagarlo desde <a href="${escapeHtml(opts.settingsUrl)}" style="color:${BLUE}">Configuración</a>.`,
  })
  return { subject: `${d.subject} · Cobra+`, text, html }
}
