import { buildDigest, shouldSendDigest, type DigestCharge, type DigestFrequency } from './digest'
import type { IsoDate } from './dates'
import type { CurrencyCode } from './money'
import { planReminders, remindersToSendOn, type ReminderKind } from './reminders'
import { renderDigestEmail, renderReminderEmail, type ReminderMoment, type RenderedEmail } from './emails'

/**
 * Qué emails salen hoy. Puro: recibe los datos y devuelve la lista de envíos.
 * El proceso diario (src/app/api/cron/daily) lo ejecuta y registra cada envío
 * en reminder_deliveries, cuya unicidad impide mandar dos veces el mismo aviso.
 */
export type PlanOrg = {
  id: string
  name: string
  today: IsoDate // "hoy" en la zona horaria de la empresa
  remindersEnabled: boolean
  transferAlias: string | null
  replyTo: string | null
  holidays?: IsoDate[]
}

export type PlanCustomer = { id: string; orgId: string; name: string; contactName: string | null; email: string | null; optOut: boolean; paused: boolean }

export type PlanCharge = {
  id: string
  orgId: string
  customerId: string
  concept: string
  amountMinor: number
  balanceMinor: number
  currency: CurrencyCode
  dueDate: IsoDate
  promisedFor: IsoDate | null
  promisedOn: IsoDate | null
}

export type PlanMember = { orgId: string; userId: string; email: string; firstName: string | null; frequency: DigestFrequency; lastSentOn: IsoDate | null }

export type ReminderSend = { kind: 'reminder'; orgId: string; chargeId: string; stepId: string; sendOn: IsoDate; to: string; replyTo: string | null; fromName: string; unsubscribeUrl: string | null; email: RenderedEmail }
export type DigestSend = { kind: 'digest'; orgId: string; userId: string; sendOn: IsoDate; to: string; email: RenderedEmail }

const MOMENT: Record<ReminderKind | 'promise_followup', ReminderMoment> = {
  before: 'before', due: 'due', after: 'after', final: 'final', promise_followup: 'promise',
}

export function planDailyEmails(input: {
  orgs: PlanOrg[]
  customers: PlanCustomer[]
  charges: PlanCharge[]
  members: PlanMember[]
  /** Claves "chargeId:stepId" de avisos ya registrados. */
  alreadySent: Set<string>
  appUrl: string
  /** Arma el link de baja firmado de cada cliente (la firma vive en el servidor). */
  unsubscribeUrlFor?: (customerId: string) => string
}): { reminders: ReminderSend[]; digests: DigestSend[] } {
  const customers = new Map(input.customers.map((c) => [c.id, c]))
  const reminders: ReminderSend[] = []
  const digests: DigestSend[] = []

  for (const org of input.orgs) {
    const charges = input.charges.filter((c) => c.orgId === org.id && c.balanceMinor > 0)

    if (org.remindersEnabled) {
      for (const charge of charges) {
        const customer = customers.get(charge.customerId)
        if (!customer || !customer.email || customer.optOut) continue
        const plan = planReminders({
          dueDate: charge.dueDate,
          holidays: org.holidays,
          promisedFor: charge.promisedFor,
          promisedOn: charge.promisedOn,
          paused: customer.paused,
          optedOut: customer.optOut,
        })
        for (const step of remindersToSendOn(plan, org.today)) {
          if (input.alreadySent.has(`${charge.id}:${step.stepId}`)) continue
          const unsubscribeUrl = input.unsubscribeUrlFor?.(customer.id) ?? null
          reminders.push({
            kind: 'reminder', orgId: org.id, chargeId: charge.id, stepId: step.stepId, sendOn: org.today,
            to: customer.email, replyTo: org.replyTo, fromName: org.name, unsubscribeUrl,
            email: renderReminderEmail({
              moment: MOMENT[step.kind], customerName: customer.name, contactName: customer.contactName, businessName: org.name,
              concept: charge.concept, amountMinor: charge.balanceMinor, currency: charge.currency, dueDate: charge.dueDate,
              promisedFor: charge.promisedFor, transferAlias: org.transferAlias, unsubscribeUrl,
            }),
          })
        }
      }
    }

    const digestCharges: DigestCharge[] = charges.map((c) => ({
      customerName: customers.get(c.customerId)?.name ?? 'Cliente',
      concept: c.concept, balanceMinor: c.balanceMinor, currency: c.currency, dueDate: c.dueDate, promisedFor: c.promisedFor,
    }))
    const digest = buildDigest(digestCharges, org.today)
    for (const m of input.members.filter((x) => x.orgId === org.id)) {
      if (!shouldSendDigest({ frequency: m.frequency, lastSentOn: m.lastSentOn, today: org.today, hasNews: Boolean(digest) })) continue
      digests.push({
        kind: 'digest', orgId: org.id, userId: m.userId, sendOn: org.today, to: m.email,
        email: renderDigestEmail(digest!, { firstName: m.firstName, appUrl: `${input.appUrl}/app`, settingsUrl: `${input.appUrl}/app/configuracion` }),
      })
    }
  }
  return { reminders, digests }
}
