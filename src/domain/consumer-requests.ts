import { button, emailLayout, escapeHtml, p } from './email-layout'

/** Botón de arrepentimiento y botón de baja (Disp. 954/2025). Textos y códigos, puros. */
export type ConsumerRequestKind = 'arrepentimiento' | 'baja'

// Sin letras que se confunden (0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Código de trámite que se le da a la persona: "CB-7K2Q9M". */
export function requestCode(random: Uint8Array): string {
  let s = ''
  for (let i = 0; i < 6; i++) s += ALPHABET[random[i]! % ALPHABET.length]
  return `CB-${s}`
}

export const KIND_LABEL: Record<ConsumerRequestKind, string> = {
  arrepentimiento: 'Arrepentimiento',
  baja: 'Baja del servicio',
}

type Email = { subject: string; text: string; html: string }

function wrap(title: string, paragraphs: string[], cta?: { href: string; label: string }): Email {
  const html = emailLayout({
    preheader: escapeHtml(paragraphs[0] ?? title),
    header: 'cobra',
    heading: escapeHtml(title),
    body: paragraphs.map((t) => p(escapeHtml(t))).join('') + (cta ? button(cta.href, cta.label) : ''),
    footer: p('Este email es por un trámite que se pidió en cobra.primerosprecios.com con tu dirección.', { muted: true, size: 12.5 }),
  })
  const text = [title, '', ...paragraphs, ...(cta ? ['', `${cta.label}: ${cta.href}`] : [])].join('\n')
  return { subject: title, text, html }
}

/** Lo que le llega a quien pidió el trámite, con su código. */
export function receiptEmail(kind: ConsumerRequestKind, code: string, confirmUrl?: string): Email {
  if (kind === 'baja') {
    return wrap(`Confirmá la baja de Cobra+ · trámite ${code}`, [
      `Recibimos tu pedido de baja. Tu código de trámite es ${code}.`,
      'Para que nadie pueda dar de baja tu cuenta en tu nombre, confirmalo tocando el botón. Al confirmar, cancelamos la renovación de tu plan pago: no se te cobra más.',
      'Si no lo pediste vos, ignorá este email y no pasa nada.',
    ], confirmUrl ? { href: confirmUrl, label: 'Confirmar la baja' } : undefined)
  }
  return wrap(`Recibimos tu arrepentimiento · trámite ${code}`, [
    `Recibimos tu pedido de arrepentimiento. Tu código de trámite es ${code}.`,
    'Si contrataste un plan en los últimos 10 días, te devolvemos el dinero por el mismo medio de pago y cancelamos la renovación. Te escribimos a este email para confirmarlo.',
    'Guardá este código por si necesitás consultarnos.',
  ])
}

/** Aviso interno para PrimerosPrecios. */
export function ownerNotice(kind: ConsumerRequestKind, code: string, email: string, name: string | null, message: string | null): Email {
  return wrap(`[Cobra+] ${KIND_LABEL[kind]} · ${code}`, [
    `Tipo: ${KIND_LABEL[kind]}`,
    `Email: ${email}`,
    `Nombre: ${name ?? '—'}`,
    `Mensaje: ${message ?? '—'}`,
    kind === 'arrepentimiento'
      ? 'Revisá si contrató en los últimos 10 días y devolvé el pago desde Mercado Pago. Después cancelá su renovación.'
      : 'Si la persona confirma desde su email, Cobra+ cancela solo la renovación de sus planes y te avisa.',
  ])
}

/** Resultado de la baja ya confirmada. */
export function bajaDoneEmail(code: string, cancelled: number): Email {
  return wrap(`Listo: diste de baja Cobra+ · trámite ${code}`, cancelled > 0
    ? [`Cancelamos la renovación de ${cancelled === 1 ? 'tu plan' : `tus ${cancelled} planes`}. No se te cobra más.`, 'Seguís usando lo que ya pagaste hasta el fin del período y después tu cuenta pasa al plan Gratis. Si además querés borrar tu cuenta, entrá a Configuración → Tu cuenta.']
    : ['No encontramos planes pagos activos con este email, así que no hay nada que se te vaya a cobrar.', 'Si querés borrar tu cuenta y tus datos, entrá a Configuración → Tu cuenta.'])
}
