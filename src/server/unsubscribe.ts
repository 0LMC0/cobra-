import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Link de baja firmado: "<id del cliente>.<firma>". No expira y no revela nada:
 * sólo quien tiene el link puede dar de baja a ese cliente de los avisos.
 */
function secret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET
  if (!s) throw new Error('Falta UNSUBSCRIBE_SECRET')
  return s
}

const sign = (customerId: string) => createHmac('sha256', secret()).update(`baja:${customerId.toLowerCase()}`).digest('base64url').slice(0, 32)

export function unsubscribeToken(customerId: string): string {
  return `${customerId}.${sign(customerId)}`
}

export function verifyUnsubscribeToken(token: string): string | null {
  const m = /^([0-9a-f-]{36})\.([A-Za-z0-9_-]{32})$/i.exec(token)
  if (!m) return null
  const id = m[1]!
  const a = Buffer.from(m[2]!)
  const b = Buffer.from(sign(id))
  return a.length === b.length && timingSafeEqual(a, b) ? id : null
}

/** Link "Ya pagué" firmado por cobro: "<id del cobro>.<firma>". Sólo avisa: nunca marca el pago solo. */
const signPaid = (chargeId: string) => createHmac('sha256', secret()).update(`pague:${chargeId.toLowerCase()}`).digest('base64url').slice(0, 32)

export function paidClaimToken(chargeId: string): string {
  return `${chargeId}.${signPaid(chargeId)}`
}

export function verifyPaidClaimToken(token: string): string | null {
  const m = /^([0-9a-f-]{36})\.([A-Za-z0-9_-]{32})$/i.exec(token)
  if (!m) return null
  const id = m[1]!
  const a = Buffer.from(m[2]!)
  const b = Buffer.from(signPaid(id))
  return a.length === b.length && timingSafeEqual(a, b) ? id : null
}
