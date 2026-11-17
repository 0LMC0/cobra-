import { formatDate, type IsoDate } from './dates'
import { PAYMENT_METHODS, type PaymentMethod } from './forms'
import { formatMoneyClean, type CurrencyCode } from './money'

/**
 * Historial del cliente: arma una sola línea de tiempo con lo que ya está
 * guardado (cobros, pagos, avisos enviados y el registro de cambios). Puro.
 */
export type TimelineKind =
  | 'created' | 'charge' | 'generated' | 'payment' | 'payment_voided'
  | 'reminder' | 'reminder_failed' | 'reminder_held' | 'promise' | 'promise_cleared'
  | 'charge_cancelled' | 'charge_reopened' | 'charge_updated'
  | 'edited' | 'archived' | 'restored' | 'opted_out' | 'opted_in' | 'paused' | 'resumed'

export type TimelineEvent = { id: string; at: string; kind: TimelineKind; title: string; detail?: string }

export type TimelineInput = {
  customer: { id: string; createdAt: string }
  charges: { id: string; concept: string; amountMinor: number; currency: CurrencyCode; dueDate: IsoDate; createdAt: string; generated: boolean }[]
  payments: { id: string; amountMinor: number; currency: CurrencyCode; paidOn: IsoDate; method: string; status: 'confirmed' | 'voided'; voidedReason: string | null; createdAt: string }[]
  deliveries: { id: string; chargeId: string; stepId: string; status: string; reason?: string | null; sentAt: string | null; createdAt: string }[]
  audits: { id: string | number; action: string; entityType: string; entityId: string; before: Record<string, unknown> | null; after: Record<string, unknown> | null; createdAt: string }[]
}

const STEP_LABEL: Record<string, string> = {
  previo: '5 días antes del vencimiento',
  vispera: 'del día anterior al vencimiento',
  vence: 'del día del vencimiento',
  atraso: 'de atraso',
  ultimo: 'último aviso',
  promesa: 'de seguimiento de la promesa',
}

const FIELD_LABEL: Record<string, string> = {
  name: 'nombre', contact_name: 'contacto', email: 'email', phone: 'celular',
  whatsapp_ok: 'permiso de WhatsApp', tax_id: 'CUIT', notes: 'notas',
}

const CUSTOMER_ACTION: Record<string, { kind: TimelineKind; title: string }> = {
  'customer.archived': { kind: 'archived', title: 'Cliente archivado' },
  'customer.restored': { kind: 'restored', title: 'Cliente reactivado' },
  'customer.opted_out': { kind: 'opted_out', title: 'Pidió no recibir más avisos' },
  'customer.opted_in': { kind: 'opted_in', title: 'Volvió a recibir avisos' },
  'customer.paused': { kind: 'paused', title: 'Avisos pausados' },
  'customer.resumed': { kind: 'resumed', title: 'Avisos reanudados' },
}

const dayMonth = (d: IsoDate) => formatDate(d, { day: 'numeric', month: 'long' })
const listEs = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`)

export function buildTimeline(input: TimelineInput): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const charges = new Map(input.charges.map((c) => [c.id, c]))

  events.push({ id: `customer-${input.customer.id}`, at: input.customer.createdAt, kind: 'created', title: 'Cliente cargado' })

  for (const c of input.charges) {
    const money = formatMoneyClean(c.amountMinor, c.currency)
    events.push({
      id: `charge-${c.id}`, at: c.createdAt, kind: c.generated ? 'generated' : 'charge',
      title: c.generated ? `Cobra+ generó el cobro del abono: ${c.concept}` : `Cobro creado: ${c.concept}`,
      detail: `${money} · vence el ${dayMonth(c.dueDate)}`,
    })
  }

  for (const p of input.payments) {
    const money = formatMoneyClean(p.amountMinor, p.currency)
    const method = PAYMENT_METHODS[p.method as PaymentMethod] ?? 'Otro'
    events.push(p.status === 'voided'
      ? { id: `payment-${p.id}`, at: p.createdAt, kind: 'payment_voided', title: `Pago de ${money} anulado`, detail: p.voidedReason ?? undefined }
      : { id: `payment-${p.id}`, at: p.createdAt, kind: 'payment', title: `Pagó ${money}`, detail: `${method} · el ${dayMonth(p.paidOn)}` })
  }

  for (const d of input.deliveries) {
    const concept = charges.get(d.chargeId)?.concept
    const step = STEP_LABEL[d.stepId] ?? 'de recordatorio'
    if (d.status === 'skipped' && d.reason === 'plan_limit') {
      events.push({ id: `delivery-${d.id}`, at: d.createdAt, kind: 'reminder_held', title: `No salió el aviso ${step}: se terminó el cupo del plan Gratis`, detail: concept })
      continue
    }
    if (d.status !== 'sent' && d.status !== 'failed') continue
    events.push(d.status === 'sent'
      ? { id: `delivery-${d.id}`, at: d.sentAt ?? d.createdAt, kind: 'reminder', title: `Se le mandó el aviso ${step}`, detail: concept }
      : { id: `delivery-${d.id}`, at: d.createdAt, kind: 'reminder_failed', title: `No se pudo mandar el aviso ${step}`, detail: concept })
  }

  for (const a of input.audits) {
    const id = `audit-${a.id}`
    if (a.entityType === 'customer') {
      if (a.action === 'customer.updated') {
        const fields = Object.keys(a.after ?? {}).map((f) => FIELD_LABEL[f]).filter(Boolean) as string[]
        events.push({ id, at: a.createdAt, kind: 'edited', title: 'Datos editados', detail: fields.length ? `Cambió: ${listEs(fields)}` : undefined })
      } else if (CUSTOMER_ACTION[a.action]) {
        events.push({ id, at: a.createdAt, ...CUSTOMER_ACTION[a.action]! })
      }
      continue
    }
    if (a.entityType !== 'charge') continue
    const concept = charges.get(a.entityId)?.concept
    switch (a.action) {
      case 'charge.promise_set': {
        const d = a.after?.promised_for
        events.push({ id, at: a.createdAt, kind: 'promise', title: typeof d === 'string' ? `Prometió pagar el ${dayMonth(d)}` : 'Prometió pagar', detail: concept })
        break
      }
      case 'charge.promise_cleared':
        events.push({ id, at: a.createdAt, kind: 'promise_cleared', title: 'Se sacó la promesa de pago', detail: concept })
        break
      case 'charge.cancelled':
        events.push({ id, at: a.createdAt, kind: 'charge_cancelled', title: 'Cobro cancelado', detail: concept })
        break
      case 'charge.reopened':
        events.push({ id, at: a.createdAt, kind: 'charge_reopened', title: 'Cobro reabierto', detail: concept })
        break
      case 'charge.updated': {
        const changes: string[] = []
        const b = a.before ?? {}
        const n = a.after ?? {}
        if (b.due_date !== n.due_date && typeof n.due_date === 'string' && typeof b.due_date === 'string') changes.push(`vence el ${dayMonth(n.due_date)} (antes el ${dayMonth(b.due_date)})`)
        if (b.concept !== n.concept && typeof n.concept === 'string') changes.push(`ahora se llama "${n.concept}"`)
        if (b.amount_minor !== n.amount_minor) changes.push('cambió el importe')
        events.push({ id, at: a.createdAt, kind: 'charge_updated', title: `Cobro modificado${concept ? `: ${concept}` : ''}`, detail: changes.length ? listEs(changes) : undefined })
        break
      }
    }
  }

  // Lo más nuevo arriba; a igual hora, el orden en que se armó.
  return events
    .map((e, i) => ({ e, i, t: Date.parse(e.at) }))
    .sort((x, y) => y.t - x.t || y.i - x.i)
    .map((x) => x.e)
}

/** "17 nov · 16:40" en la zona horaria de la empresa. */
export function formatEventTime(iso: string, timeZone: string): string {
  const d = new Date(iso)
  const day = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone }).format(d).replace('.', '')
  const time = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(d)
  return `${day} · ${time}`
}
