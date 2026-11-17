import { z } from 'zod'
import { isIsoDate } from './dates'
import { isCurrency, parseAmount, type CurrencyCode } from './money'
import { toWhatsAppNumber } from './whatsapp'

/**
 * Validación de los formularios del producto. Puras y probadas: las Server
 * Actions sólo las aplican y guardan. Mensajes en el idioma de la persona.
 */

const optionalText = (max: number) => z.string().trim().max(max, `Usá ${max} caracteres o menos.`).optional().transform((v) => (v ? v : null))
const checkbox = z.union([z.literal('on'), z.literal('true'), z.literal('')]).optional().transform((v) => v === 'on' || v === 'true')
const isoDate = (msg: string) => z.string().refine(isIsoDate, msg)

export const customerSchema = z
  .object({
    name: z.string().trim().min(1, 'Poné el nombre del cliente.').max(160, 'Usá 160 caracteres o menos.'),
    contactName: optionalText(120),
    email: z.union([z.literal(''), z.string().trim().toLowerCase().email('Ese email no parece válido.').max(254)]).optional().transform((v) => (v ? v : null)),
    phone: optionalText(40),
    whatsappOk: checkbox,
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
    return { ...d, whatsappNumber, whatsappOk: Boolean(whatsappNumber) && d.whatsappOk }
  })
  .refine((d) => d.email || d.whatsappNumber, { path: ['email'], message: 'Cargá al menos un email o un celular, así Cobra+ le puede avisar.' })

export type CustomerInput = z.output<typeof customerSchema>

export const chargeSchema = z
  .object({
    customerId: z.string().uuid('Elegí un cliente.'),
    concept: z.string().trim().min(1, 'Poné qué le cobrás, por ejemplo "Cuota de noviembre".').max(200),
    amount: z.string().trim().min(1, 'Poné el importe.'),
    currency: z.string().refine(isCurrency, 'Elegí una moneda.'),
    dueDate: isoDate('Elegí la fecha de vencimiento.'),
    repeatMonthly: checkbox,
  })
  .transform((d, ctx) => {
    const amountMinor = parseAmount(d.amount, d.currency as CurrencyCode)
    if (amountMinor === null || amountMinor <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'Ese importe no es válido. Escribilo así: 150.000 o 150.000,50.' })
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
