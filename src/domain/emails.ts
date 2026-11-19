import { formatDate, type IsoDate } from './dates'
import { formatMoneyClean, type CurrencyCode } from './money'
import type { Digest, DigestLine } from './digest'
import { EMAIL, button, detailsBox, emailLayout, escapeHtml, listBlock, mark, p } from './email-layout'

/**
 * Textos de los emails. Puros: devuelven asunto, texto plano y HTML. Todo lo
 * que viene de los datos se escapa antes de entrar al HTML.
 */
export type RenderedEmail = { subject: string; text: string; html: string }

export { escapeHtml }

const BLUE = EMAIL.blue
const INK = EMAIL.ink
const MUTED = EMAIL.muted

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
  /** Link de baja con un clic. Sin link, se pide responder el email. */
  unsubscribeUrl?: string | null
  /** "Ya pagué": el cliente avisa con un toque (link firmado). Sin link, se pide responder con el comprobante. */
  paidUrl?: string | null
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
  const paid = m.paidUrl
    ? `Si ya lo pagaste, avisale a ${m.businessName} con un toque: ${m.paidUrl}`
    : 'Si ya lo pagaste, respondé este email con el comprobante y listo. ¡Gracias!'
  const footerIntro = `Este aviso lo envía Cobra+ en nombre de ${m.businessName}. Si respondés, la respuesta le llega a ${m.businessName}.`
  const footer = m.unsubscribeUrl
    ? `${footerIntro} Si no querés recibir más recordatorios, desactivalos acá: ${m.unsubscribeUrl}`
    : `${footerIntro} Si no querés recibir más recordatorios, respondé este email y los desactivamos.`
  const footerHtml = p(`${escapeHtml(footerIntro)} ${m.unsubscribeUrl
    ? `¿No querés recibir más recordatorios? <a href="${escapeHtml(m.unsubscribeUrl)}" style="color:${MUTED};text-decoration:underline">Desactivalos acá</a>.`
    : 'Si no querés recibir más recordatorios, respondé este email y los desactivamos.'}`, { muted: true, size: 12.5 })

  const text = [greeting, '', body, ...(alias ? ['', alias] : []), '', paid, '', '—', footer].join('\n')
  const rows: [string, string][] = [
    ['Concepto', escapeHtml(Concept)],
    ['Importe', escapeHtml(amount)],
    ['Vence', escapeHtml(due)],
    ...(m.promisedFor && m.moment === 'promise' ? [['Prometiste pagar', escapeHtml(longDate(m.promisedFor))] as [string, string]] : []),
    ...(m.transferAlias ? [['Alias para transferir', mark(escapeHtml(m.transferAlias))] as [string, string]] : []),
  ]
  const html = emailLayout({
    preheader: escapeHtml(`${Concept} por ${amount} · ${m.businessName}`),
    header: { businessName: escapeHtml(m.businessName) },
    heading: escapeHtml(v.subject.replace(/ · .*/, '')),
    body: [
      p(escapeHtml(greeting)),
      p(escapeHtml(body)),
      detailsBox(rows),
      m.paidUrl
        ? `${p('¿Ya lo pagaste? Avisale con un toque:', { muted: true, size: 14 })}${button(m.paidUrl, 'Ya pagué', 'secondary')}`
        : p(escapeHtml(paid), { muted: true, size: 14 }),
    ].join('\n'),
    footer: footerHtml,
  })
  return { subject, text, html }
}

/* ───────────── Resumen para quien cobra ───────────── */

function lines(title: string, color: string, items: DigestLine[]): { text: string[]; html: string } {
  if (items.length === 0) return { text: [], html: '' }
  const text = [title, ...items.map((l) => `• ${l.customerName}: ${l.amount} (${l.concept}). ${l.note}.`), '']
  const html = listBlock(title, color, items.map((l) => ({ name: escapeHtml(l.customerName), amount: escapeHtml(l.amount), note: `${escapeHtml(l.concept)} · ${escapeHtml(l.note)}` })))
  return { text, html }
}

export function renderDigestEmail(d: Digest, opts: { firstName?: string | null; appUrl: string; settingsUrl: string }): RenderedEmail {
  const hello = opts.firstName ? `Hola ${opts.firstName}:` : 'Hola:'
  const intro = `Esto es lo que tenés para cobrar${d.totals.length ? ` (${d.totals.join(' y ')} en total)` : ''}.`
  const sections = [
    lines('Atrasados', EMAIL.danger, d.overdue),
    lines('Prometieron pagar', '#6a3df0', d.promises),
    lines('Vencen hoy', '#9a5b00', d.dueToday),
    lines('Vencen en los próximos días', EMAIL.blue, d.dueSoon),
  ]
  const footer = `Te llega porque tenés cobros para mirar. Podés cambiar cada cuánto lo recibís o apagarlo desde Configuración: ${opts.settingsUrl}`
  const text = [hello, '', intro, '', ...sections.flatMap((s) => s.text), `Entrá a Cobra+ para marcar quién pagó o avisarle por WhatsApp: ${opts.appUrl}`, '', '—', footer].join('\n')
  const html = emailLayout({
    preheader: escapeHtml(intro),
    header: 'cobra',
    heading: escapeHtml(d.subject),
    body: [
      p(escapeHtml(hello)),
      p(d.totals.length ? `Esto es lo que tenés para cobrar: ${mark(`<b>${escapeHtml(d.totals.join(' y '))}</b>`)} en total.` : escapeHtml(intro)),
      sections.map((s) => s.html).join(''),
      '<div style="height:18px"></div>',
      button(opts.appUrl, 'Abrir Cobra+'),
    ].join('\n'),
    footer: p(`Te llega porque tenés cobros para mirar. Podés cambiar cada cuánto lo recibís o apagarlo desde <a href="${escapeHtml(opts.settingsUrl)}" style="color:${BLUE}">Configuración</a>.`, { muted: true, size: 12.5 }),
  })
  return { subject: `${d.subject} · Cobra+`, text, html }
}
