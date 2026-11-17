import { describe, expect, it } from 'vitest'
import { buildDigest, shouldSendDigest, type DigestCharge } from '@/domain/digest'

// 17/11/2026 es martes.
const TODAY = '2026-11-17'
const clean = (s: string) => s.replace(/ | /g, ' ')

describe('cuándo sale el resumen', () => {
  const base = { today: TODAY, hasNews: true }
  it('sin novedades no sale nunca', () => {
    expect(shouldSendDigest({ ...base, frequency: 'daily', lastSentOn: null, hasNews: false })).toBe(false)
  })
  it('apagado no sale', () => {
    expect(shouldSendDigest({ ...base, frequency: 'off', lastSentOn: null })).toBe(false)
  })
  it('la primera vez sale', () => {
    expect(shouldSendDigest({ ...base, frequency: 'every_3_days', lastSentOn: null })).toBe(true)
  })
  it('diario: nunca dos el mismo día', () => {
    expect(shouldSendDigest({ ...base, frequency: 'daily', lastSentOn: '2026-11-17' })).toBe(false)
    expect(shouldSendDigest({ ...base, frequency: 'daily', lastSentOn: '2026-11-16' })).toBe(true)
  })
  it('cada 3 días y semanal respetan la espera', () => {
    expect(shouldSendDigest({ ...base, frequency: 'every_3_days', lastSentOn: '2026-11-15' })).toBe(false)
    expect(shouldSendDigest({ ...base, frequency: 'every_3_days', lastSentOn: '2026-11-14' })).toBe(true)
    expect(shouldSendDigest({ ...base, frequency: 'weekly', lastSentOn: '2026-11-12' })).toBe(false)
    expect(shouldSendDigest({ ...base, frequency: 'weekly', lastSentOn: '2026-11-10' })).toBe(true)
  })
  it('no sale sábados ni domingos', () => {
    expect(shouldSendDigest({ ...base, frequency: 'daily', lastSentOn: null, today: '2026-11-21' })).toBe(false)
    expect(shouldSendDigest({ ...base, frequency: 'daily', lastSentOn: null, today: '2026-11-22' })).toBe(false)
  })
})

describe('qué dice el resumen', () => {
  const c = (over: Partial<DigestCharge>): DigestCharge => ({ customerName: 'Cliente', concept: 'Cuota', balanceMinor: 10_000_000, currency: 'ARS', dueDate: TODAY, ...over })

  it('sin nada para hacer no hay resumen', () => {
    expect(buildDigest([], TODAY)).toBeNull()
    expect(buildDigest([c({ dueDate: '2026-12-15' }), c({ balanceMinor: 0, dueDate: '2026-11-01' })], TODAY)).toBeNull()
  })

  it('separa atrasados, vence hoy y vence pronto', () => {
    const d = buildDigest([
      c({ customerName: 'Estudio Rivas', dueDate: '2026-11-13', balanceMinor: 15_000_000 }),
      c({ customerName: 'Clínica Norte', dueDate: TODAY, balanceMinor: 32_000_000 }),
      c({ customerName: 'Panadería Sol', dueDate: '2026-11-18', balanceMinor: 9_500_000 }),
      c({ customerName: 'Lejano', dueDate: '2026-11-30' }),
    ], TODAY)!
    expect(d.overdue.map((l) => [l.customerName, l.note])).toEqual([['Estudio Rivas', 'Venció hace 4 días']])
    expect(d.dueToday.map((l) => l.customerName)).toEqual(['Clínica Norte'])
    expect(d.dueSoon.map((l) => [l.customerName, l.note])).toEqual([['Panadería Sol', 'Vence mañana']])
    expect(d.subject).toBe('Tenés 3 cobros para mirar: 1 está atrasado')
    expect(d.totals.map(clean)).toEqual(['$ 565.000'])
  })

  it('no suma monedas distintas', () => {
    const d = buildDigest([c({ balanceMinor: 10_000_000 }), c({ currency: 'USD', balanceMinor: 48_000 })], TODAY)!
    expect(d.totals.map(clean)).toEqual(['$ 100.000', 'US$ 480'])
  })

  it('respeta las promesas: no apura a quien prometió una fecha futura', () => {
    const d = buildDigest([
      c({ customerName: 'Prometió el viernes', dueDate: '2026-11-10', promisedFor: '2026-11-20' }),
      c({ customerName: 'Prometió hoy', dueDate: '2026-11-10', promisedFor: TODAY }),
    ], TODAY)!
    expect(d.overdue).toEqual([])
    expect(d.promises.map((l) => [l.customerName, l.note])).toEqual([['Prometió hoy', 'Prometió pagar hoy']])
    expect(d.subject).toBe('Tenés 1 cobro para mirar')
  })
})
