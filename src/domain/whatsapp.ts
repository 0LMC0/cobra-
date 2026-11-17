import { formatDate, type IsoDate } from './dates'
import { formatMoneyClean, type CurrencyCode } from './money'

/**
 * WhatsApp "con un toque": Cobra+ arma el mensaje y quien cobra lo manda
 * desde SU WhatsApp (link wa.me). No usa la API de Meta ni envía sola.
 */

/**
 * Pasa un teléfono como lo escribe la gente al formato internacional que pide
 * WhatsApp, sólo dígitos. Para Argentina: 54 + 9 + código de área sin el 0 +
 * número sin el 15 (13 dígitos en total).
 *
 * Acepta "11 15 2345-6789", "011 2345-6789", "0351 15 456-7890",
 * "+54 9 11 2345 6789", "5491123456789". Devuelve null si no se puede armar.
 * Un número que empieza con + y otro código de país se respeta tal cual.
 */
export function toWhatsAppNumber(input: string, defaultCountry: 'AR' = 'AR'): string | null {
  const raw = input.trim()
  if (!raw) return null
  let digits = raw.replace(/\D/g, '')
  const international = raw.startsWith('+') || digits.startsWith('00')
  if (digits.startsWith('00')) digits = digits.slice(2)

  if (international && !digits.startsWith('54')) {
    return digits.length >= 8 && digits.length <= 15 ? digits : null
  }
  if (defaultCountry !== 'AR') return null

  if (digits.startsWith('54')) digits = digits.slice(2)
  if (digits.startsWith('9') && digits.length === 11) digits = digits.slice(1)
  if (digits.startsWith('0')) digits = digits.slice(1)

  // Sacar el 15 que va después del código de área (2, 3 o 4 dígitos).
  if (digits.length === 12) {
    const areaLengths = digits.startsWith('11') ? [2] : [3, 4, 2]
    for (const len of areaLengths) {
      if (digits.slice(len, len + 2) === '15') {
        digits = digits.slice(0, len) + digits.slice(len + 2)
        break
      }
    }
  }

  return digits.length === 10 ? `549${digits}` : null
}

export type WhatsAppMoment = 'before' | 'due' | 'after' | 'final' | 'promise'

export type WhatsAppMessageInput = {
  moment: WhatsAppMoment
  customerName: string
  /** Persona de contacto del cliente. Si no hay, se saluda con el nombre completo del cliente. */
  contactName?: string | null
  businessName: string
  concept: string
  amountMinor: number
  currency: CurrencyCode
  dueDate: IsoDate
  /** Fecha que prometió el cliente (sólo para moment = 'promise'). */
  promisedFor?: IsoDate | null
  /** Alias o CBU para transferir. */
  transferAlias?: string | null
}

/** Con contacto, su primer nombre; si no, el nombre completo del cliente (puede ser una empresa). */
function greetingName(m: WhatsAppMessageInput): string {
  const contact = m.contactName?.trim()
  if (contact) return contact.split(/\s+/)[0] ?? contact
  return m.customerName.trim()
}


export function buildWhatsAppMessage(m: WhatsAppMessageInput): string {
  const who = greetingName(m)
  const amount = formatMoneyClean(m.amountMinor, m.currency)
  const due = formatDate(m.dueDate, { weekday: 'long', day: 'numeric', month: 'long' })
  const promised = m.promisedFor ? formatDate(m.promisedFor, { weekday: 'long', day: 'numeric', month: 'long' }) : null

  const opening = `Hola ${who}, ¿cómo estás? Te escribo de ${m.businessName}.`
  const body: Record<WhatsAppMoment, string> = {
    before: `Te recuerdo que ${m.concept} por ${amount} vence el ${due}.`,
    due: `Hoy ${due} vence ${m.concept} por ${amount}.`,
    after: `${m.concept[0]?.toUpperCase()}${m.concept.slice(1)} por ${amount} venció el ${due} y todavía no lo vemos acreditado.`,
    final: `${m.concept[0]?.toUpperCase()}${m.concept.slice(1)} por ${amount} sigue pendiente desde el ${due}. ¿Me avisás cuándo lo podés pagar?`,
    promise: `Quedamos en que ${m.concept} por ${amount} se pagaba ${promised ? `el ${promised}` : 'en estos días'}. ¿Pudiste hacerlo?`,
  }
  const lines = [opening, body[m.moment]]
  if (m.transferAlias) lines.push(`Podés transferir al alias ${m.transferAlias}.`)
  lines.push(m.moment === 'before' || m.moment === 'due' ? 'Si ya lo pagaste, mandame el comprobante y listo. ¡Gracias!' : 'Si ya lo pagaste, mandame el comprobante así lo registro. ¡Gracias!')
  return lines.join('\n')
}

/** Link que abre WhatsApp con el chat y el mensaje listos para enviar. */
export function whatsAppLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}
