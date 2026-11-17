import { describe, expect, it } from 'vitest'
import { applyReminderQuota, monthStart, remainingReminders } from '@/domain/quota'
import { MONTHLY_REMINDERS } from '@/config/plans'

describe('tope de avisos del plan', () => {
  it('Gratis tiene 10 por mes; los pagos, sin tope', () => {
    expect(MONTHLY_REMINDERS.free).toBe(10)
    expect(MONTHLY_REMINDERS.starter).toBeNull()
  })

  it('cuenta lo que queda y nunca da negativo', () => {
    expect(remainingReminders(10, 3)).toBe(7)
    expect(remainingReminders(10, 12)).toBe(0)
    expect(remainingReminders(null, 500)).toBeNull()
  })

  it('si no alcanza, salen primero los más urgentes', () => {
    const items = [{ stepId: 'previo' }, { stepId: 'vence' }, { stepId: 'ultimo' }, { stepId: 'atraso' }, { stepId: 'vispera' }]
    const { send, held } = applyReminderQuota(items, 2)
    expect(send.map((x) => x.stepId)).toEqual(['ultimo', 'atraso'])
    expect(held.map((x) => x.stepId)).toEqual(['vence', 'vispera', 'previo'])
  })

  it('sin tope, salen todos y en el mismo orden', () => {
    const items = [{ stepId: 'previo' }, { stepId: 'atraso' }]
    expect(applyReminderQuota(items, null)).toEqual({ send: items, held: [] })
    expect(applyReminderQuota(items, 0).send).toEqual([])
  })

  it('el mes arranca el día 1', () => {
    expect(monthStart('2026-11-17')).toBe('2026-11-01')
  })
})

describe('plan vigente', async () => {
  const { effectivePlan } = await import('@/domain/plan-status')
  const now = new Date('2026-11-17T12:00:00Z')
  it('sin suscripción es Gratis', () => expect(effectivePlan(null, now)).toBe('free'))
  it('activa o en prueba vale su plan', () => {
    expect(effectivePlan({ plan: 'growth', status: 'active', currentPeriodEnd: null }, now)).toBe('growth')
    expect(effectivePlan({ plan: 'starter', status: 'trialing', currentPeriodEnd: null }, now)).toBe('starter')
  })
  it('cancelada o atrasada vale hasta el fin de lo pagado', () => {
    expect(effectivePlan({ plan: 'growth', status: 'cancelled', currentPeriodEnd: '2026-11-30T00:00:00Z' }, now)).toBe('growth')
    expect(effectivePlan({ plan: 'growth', status: 'past_due', currentPeriodEnd: '2026-11-01T00:00:00Z' }, now)).toBe('free')
  })
  it('un plan desconocido cae a Gratis', () => expect(effectivePlan({ plan: 'oro', status: 'active', currentPeriodEnd: null }, now)).toBe('free'))
})
