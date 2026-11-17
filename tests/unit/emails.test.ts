import { describe, expect, it } from 'vitest'
import { escapeHtml, renderDigestEmail, renderReminderEmail } from '@/domain/emails'
import { planDailyEmails, type PlanCharge, type PlanCustomer, type PlanMember, type PlanOrg } from '@/domain/daily-plan'
import { buildDigest } from '@/domain/digest'

const clean = (s: string) => s.replace(/ | /g, ' ')

describe('email de recordatorio', () => {
  const base = {
    customerName: 'Estudio Rivas', contactName: 'Marina Pérez', businessName: 'Estudio Martínez',
    concept: 'la cuota de noviembre', amountMinor: 15_000_000, currency: 'ARS' as const, dueDate: '2026-11-10',
  }

  it('antes del vencimiento', () => {
    const e = renderReminderEmail({ ...base, moment: 'before', transferAlias: 'estudio.martinez' })
    expect(e.subject).toBe('La cuota de noviembre: vence el 10 de noviembre · Estudio Martínez')
    const text = clean(e.text)
    expect(text).toContain('Hola Marina:')
    expect(text).toContain('la cuota de noviembre por $ 150.000 vence el martes, 10 de noviembre')
    expect(text).toContain('Podés transferir al alias estudio.martinez.')
    expect(text).toContain('respondé este email con el comprobante')
    expect(text).toContain('Si no querés recibir más recordatorios')
  })

  it('cada momento tiene su asunto', () => {
    expect(renderReminderEmail({ ...base, moment: 'due' }).subject).toMatch(/^La cuota de noviembre: vence hoy/)
    expect(renderReminderEmail({ ...base, moment: 'after' }).subject).toMatch(/quedó pendiente/)
    expect(renderReminderEmail({ ...base, moment: 'final' }).subject).toMatch(/sigue pendiente/)
    expect(renderReminderEmail({ ...base, moment: 'promise', promisedFor: '2026-11-20' }).text).toContain('se pagaba el viernes, 20 de noviembre')
  })

  it('nunca amenaza', () => {
    for (const moment of ['before', 'due', 'after', 'final', 'promise'] as const) {
      expect(renderReminderEmail({ ...base, moment }).text).not.toMatch(/intimación|legal|abogado|deudor/i)
    }
  })

  it('escapa lo que viene de los datos en el HTML', () => {
    const e = renderReminderEmail({ ...base, moment: 'due', businessName: '<script>alert(1)</script>', concept: 'cuota "especial" & más' })
    expect(e.html).not.toContain('<script>')
    expect(e.html).toContain('&lt;script&gt;')
    expect(e.html).toContain('&quot;especial&quot; &amp; más')
    expect(escapeHtml(`a'b`)).toBe('a&#39;b')
  })
})

describe('email de resumen', () => {
  it('lista lo pendiente y lleva a la app y a la configuración', () => {
    const d = buildDigest([
      { customerName: 'Estudio Rivas', concept: 'Cuota', balanceMinor: 15_000_000, currency: 'ARS', dueDate: '2026-11-13' },
      { customerName: 'Clínica Norte', concept: 'Mantenimiento', balanceMinor: 32_000_000, currency: 'ARS', dueDate: '2026-11-17' },
    ], '2026-11-17')!
    const e = renderDigestEmail(d, { firstName: 'Ana', appUrl: 'https://cobra.example/app', settingsUrl: 'https://cobra.example/app/configuracion' })
    expect(e.subject).toBe('Tenés 2 cobros para mirar: 1 está atrasado · Cobra+')
    const text = clean(e.text)
    expect(text).toContain('Hola Ana:')
    expect(text).toContain('($ 470.000 en total)')
    expect(text).toContain('• Estudio Rivas: $ 150.000 (Cuota). Venció hace 4 días.')
    expect(text).toContain('Vencen hoy')
    expect(e.html).toContain('href="https://cobra.example/app"')
    expect(e.html).toContain('href="https://cobra.example/app/configuracion"')
  })
})

describe('plan del día', () => {
  const org: PlanOrg = { id: 'o1', name: 'Estudio Martínez', today: '2026-11-13', remindersEnabled: true, transferAlias: null, replyTo: 'hola@martinez.example' }
  const customer: PlanCustomer = { id: 'k1', orgId: 'o1', name: 'Estudio Rivas', contactName: 'Marina', email: 'marina@rivas.example', optOut: false, paused: false }
  const charge: PlanCharge = { id: 'c1', orgId: 'o1', customerId: 'k1', concept: 'la cuota de noviembre', amountMinor: 15_000_000, balanceMinor: 15_000_000, currency: 'ARS', dueDate: '2026-11-10', promisedFor: null, promisedOn: null }
  const member: PlanMember = { orgId: 'o1', userId: 'u1', email: 'ana@martinez.example', firstName: 'Ana', frequency: 'daily', lastSentOn: null }
  const run = (over: Partial<Parameters<typeof planDailyEmails>[0]> = {}) =>
    planDailyEmails({ orgs: [org], customers: [customer], charges: [charge], members: [member], alreadySent: new Set(), appUrl: 'https://cobra.example', ...over })

  it('el día del aviso de atraso, sale el recordatorio y el resumen', () => {
    const { reminders, digests } = run()
    expect(reminders.map((r) => [r.chargeId, r.stepId, r.to, r.replyTo])).toEqual([['c1', 'atraso', 'marina@rivas.example', 'hola@martinez.example']])
    expect(reminders[0]!.email.subject).toMatch(/quedó pendiente/)
    expect(digests.map((d) => d.to)).toEqual(['ana@martinez.example'])
  })

  it('nunca repite un aviso ya registrado', () => {
    expect(run({ alreadySent: new Set(['c1:atraso']) }).reminders).toEqual([])
  })

  it('no escribe si los avisos están apagados, si el cliente se dio de baja o no tiene email', () => {
    expect(run({ orgs: [{ ...org, remindersEnabled: false }] }).reminders).toEqual([])
    expect(run({ customers: [{ ...customer, optOut: true }] }).reminders).toEqual([])
    expect(run({ customers: [{ ...customer, email: null }] }).reminders).toEqual([])
    expect(run({ customers: [{ ...customer, paused: true }] }).reminders).toEqual([])
  })

  it('si ya pagó, no hay aviso ni resumen', () => {
    const out = run({ charges: [{ ...charge, balanceMinor: 0 }] })
    expect(out.reminders).toEqual([])
    expect(out.digests).toEqual([])
  })

  it('respeta la promesa de pago', () => {
    expect(run({ charges: [{ ...charge, promisedOn: '2026-11-11', promisedFor: '2026-11-20' }] }).reminders).toEqual([])
  })

  it('un día sin pasos no manda recordatorios', () => {
    expect(run({ orgs: [{ ...org, today: '2026-11-12' }] }).reminders).toEqual([])
  })

  it('el resumen respeta la frecuencia elegida', () => {
    expect(run({ members: [{ ...member, frequency: 'off' }] }).digests).toEqual([])
    expect(run({ members: [{ ...member, frequency: 'every_3_days', lastSentOn: '2026-11-12' }] }).digests).toEqual([])
  })
})
