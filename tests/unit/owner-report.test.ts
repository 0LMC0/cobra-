import { describe, expect, it } from 'vitest'
import { ownerReportEmail } from '@/domain/owner-report'

describe('parte diario para PrimerosPrecios', () => {
  const base = { newUsers: 3, newOrgs: 2, totalOrgs: 10, activePaid: 1, remindersSent: 12, errors: 0, pendingRequests: 0 }
  it('resume el día en el asunto', () => {
    expect(ownerReportEmail(base, 'jueves 19', 'https://x').subject).toBe('Cobra+ hoy: 3 registros, 1 plan pago')
  })
  it('pide revisar si hubo errores o pedidos pendientes', () => {
    const e = ownerReportEmail({ ...base, errors: 2 }, 'jueves 19', 'https://x')
    expect(e.subject).toContain('revisar')
    expect(e.text).toContain('app_errors')
  })
})
