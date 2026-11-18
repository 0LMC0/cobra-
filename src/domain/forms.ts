import { z } from 'zod'
import { daysBetween, isIsoDate } from './dates'
import { isCurrency, parseAmount, type CurrencyCode } from './money'
import { toWhatsAppNumber } from './whatsapp'
import { cleanText, hasLink } from './safe-text'

/**
 * Validación de los formularios del producto. Puras y probadas: las Server
 * Actions sólo las aplican y guardan. Mensajes en el idioma de la persona.
 */

const optionalText = (max: number) => z.string().transform(cleanText).pipe(z.string().max(max, `Usá ${max} caracteres o menos.`)).optional().transform((v) => (v ? v : null))
const NO_LINKS = 'Sin links ni direcciones web: este texto aparece en los emails que le llegan a tu cliente.'
/** Texto que viaja en los emails: limpio de caracteres invisibles y sin links. */
const emailText = (min: number, max: number, minMsg: string) =>
  z.string().transform(cleanText).pipe(z.string().min(min, minMsg).max(max, `Usá ${max} caracteres o menos.`).refine((v) => !hasLink(v), NO_LINKS))
const optionalEmailText = (max: number) =>
  z.string().transform(cleanText).pipe(z.string().max(max, `Usá ${max} caracteres o menos.`).refine((v) => !hasLink(v), NO_LINKS)).optional().transform((v) => (v ? v : null))
export { emailText }
const checkbox = z.union([z.literal('on'), z.literal('true'), z.literal('')]).optional().transform((v) => v === 'on' || v === 'true')
const isoDate = (msg: string) => z.string().refine(isIsoDate, msg)

export const customerSchema = z
  .object({
    name: emailText(1, 160, 'Poné el nombre del cliente.'),
    contactName: optionalEmailText(120),
    email: z.union([z.literal(''), z.string().trim().toLowerCase().email('Ese email no parece válido.').max(254)]).optional().transform((v) => (v ? v : null)),
    phone: optionalText(40),
    whatsappOk: checkbox,
    /** Tildado = Cobra+ le avisa por email. Se guarda al revés, como reminders_paused. */
    autoReminders: checkbox,
    taxId: optionalText(20),
    notes: optionalText(2000),
  })
  .transform((d, ctx) => {
    let whatsappNumber: string | null = null
    if (d.phone) {
      whatsappNumber = toWhatsAppNumber(d.phone)
      if (!whatsappNumber) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: 'No reconocemos ese celular. Probá con el código de área, por ejemplo 11 2345-6789.' })
        return z.NEVER
      }
    }
    const { autoReminders, ...rest } = d
    return { ...rest, remindersPaused: !autoReminders, whatsappNumber, whatsappOk: Boolean(whatsappNumber) && d.whatsappOk }
  })
  .refine((d) => d.email || d.whatsappNumber, { path: ['email'], message: 'Cargá al menos un email o un celular, así Cobra+ le puede avisar.' })

export type CustomerInput = z.output<typeof customerSchema>

/** 10.000 millones (en unidades menores, con 2 decimales). */
export const MAX_AMOUNT_MINOR = 1_000_000_000_000

export const chargeSchema = z
  .object({
    customerId: z.string().uuid('Elegí un cliente.'),
    concept: emailText(1, 200, 'Poné qué le cobrás, por ejemplo "Cuota de noviembre".'),
    amount: z.string().trim().min(1, 'Poné el importe.'),
    currency: z.string().refine(isCurrency, 'Elegí una moneda.'),
    dueDate: isoDate('Elegí la fecha de vencimiento.').refine((v) => v >= '2000-01-01' && v <= '2099-12-31', 'Elegí una fecha real de vencimiento.'),
    repeatMonthly: checkbox,
  })
  .transform((d, ctx) => {
    const amountMinor = parseAmount(d.amount, d.currency as CurrencyCode)
    if (amountMinor === null || amountMinor <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'Ese importe no es válido. Escribilo así: 150.000 o 150.000,50.' })
      return z.NEVER
    }
    // Tope de sentido común: evita totales que desborden y errores de tipeo de muchos ceros.
    if (amountMinor > MAX_AMOUNT_MINOR) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'Ese importe es demasiado grande. Revisá los ceros.' })
      return z.NEVER
    }
    return { customerId: d.customerId, concept: d.concept, amountMinor, currency: d.currency as CurrencyCode, dueDate: d.dueDate, repeatMonthly: d.repeatMonthly }
  })

export type ChargeInput = z.output<typeof chargeSchema>

export const PAYMENT_METHODS = {
  transfer: 'Transferencia',
  cash: 'Efectivo',
  mercadopago: 'Mercado Pago',
  card: 'Tarjeta',
  check: 'Cheque',
  other: 'Otro',
} as const
export type PaymentMethod = keyof typeof PAYMENT_METHODS

export const paymentSchema = z
  .object({
    chargeId: z.string().uuid(),
    amount: z.string().trim().min(1, 'Poné cuánto te pagó.'),
    currency: z.string().refine(isCurrency),
    balanceMinor: z.coerce.number().int().positive(),
    paidOn: isoDate('Elegí la fecha del pago.'),
    method: z.enum(Object.keys(PAYMENT_METHODS) as [PaymentMethod, ...PaymentMethod[]]).default('transfer'),
    reference: optionalText(120),
    idempotencyKey: z.string().min(8).max(80),
  })
  .transform((d, ctx) => {
    const amountMinor = parseAmount(d.amount, d.currency as CurrencyCode)
    if (amountMinor === null || amountMinor <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'Ese importe no es válido.' })
      return z.NEVER
    }
    if (amountMinor > d.balanceMinor) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'Es más de lo que debe en este cobro.' })
      return z.NEVER
    }
    return { ...d, amountMinor, currency: d.currency as CurrencyCode, partial: amountMinor < d.balanceMinor }
  })

export type PaymentInput = z.output<typeof paymentSchema>

/** Hasta cuántos días adelante se acepta una promesa de pago. */
export const MAX_PROMISE_DAYS = 60

/** Promesa de pago: "me dijo que paga el viernes". Desde hoy y hasta 60 días. */
export function promiseSchema(today: string) {
  return z.object({
    chargeId: z.string().uuid(),
    promisedFor: isoDate('Elegí la fecha que te prometió.')
      .refine((d) => d >= today, 'Tiene que ser hoy o más adelante.')
      .refine((d) => daysBetween(today, d) <= MAX_PROMISE_DAYS, `Elegí una fecha dentro de los próximos ${MAX_PROMISE_DAYS} días.`),
  })
}
