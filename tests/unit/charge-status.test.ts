import { describe, expect, it } from 'vitest'
import { chargeStatus, daysOverdue, isCollectible } from '@/domain/charge-status'
import { addMonths, nextOccurrence, todayIn, isIsoDate } from '@/domain/dates'

const base = { state: 'open' as const, totalMinor: 15_000_000, paidMinor: 0, dueDate: '2026-11-10' }

describe('chargeStatus', () => {
  it('borrador y cancelado ganan siempre', () => {
    expect(chargeStatus({ ...base, state: 'draft' }, '2026-12-01')).toBe('draft')
    expect(chargeStatus({ ...base, state: 'cancelled', paidMinor: 0 }, '2026-12-01')).toBe('cancelled')
  })
  it('pagado cuando el saldo es cero o negativo', () => {
    expect(chargeStatus({ ...base, paidMinor: 15_000_000 }, '2026-12-01')).toBe('paid')
    expect(chargeStatus({ ...base, paidMinor: 16_000_000 }, '2026-12-01')).toBe('paid')
  })
  it('vencido desde el día siguiente al vencimiento', () => {
    expect(chargeStatus(base, '2026-11-10')).toBe('due_soon')
    expect(chargeStatus(base, '2026-11-11')).toBe('overdue')
  })
  it('vencido gana sobre parcial', () => {
    expect(chargeStatus({ ...base, paidMinor: 5_000_000 }, '2026-11-20')).toBe('overdue')
  })
  it('parcial antes del vencimiento', () => {
    expect(chargeStatus({ ...base, paidMinor: 5_000_000 }, '2026-11-01')).toBe('partially_paid')
  })
  it('próximo a vencer dentro de la ventana', () => {
    expect(chargeStatus(base, '2026-11-03')).toBe('due_soon')
    expect(chargeStatus(base, '2026-11-02')).toBe('pending')
    expect(chargeStatus(base, '2026-11-02', 10)).toBe('due_soon')
  })
  it('cobrable', () => {
    expect(isCollectible('overdue')).toBe(true)
    expect(isCollectible('paid')).toBe(false)
    expect(isCollectible('draft')).toBe(false)
  })
  it('días de atraso', () => {
    expect(daysOverdue('2026-11-10', '2026-11-17')).toBe(7)
    expect(daysOverdue('2026-11-10', '2026-11-01')).toBe(0)
  })
})

describe('fechas', () => {
  it('fin de mes en abonos', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29')
    expect(addMonths('2026-11-30', 3)).toBe('2027-02-28')
    expect(nextOccurrence('2026-12-15', 'monthly')).toBe('2027-01-15')
    expect(nextOccurrence('2026-12-15', 'biweekly')).toBe('2026-12-29')
  })
  it('hoy en la zona horaria de la empresa', () => {
    // 02:00 UTC del 16/11 = 23:00 del 15/11 en Buenos Aires
    const now = new Date('2026-11-16T02:00:00Z')
    expect(todayIn('America/Argentina/Buenos_Aires', now)).toBe('2026-11-15')
    expect(todayIn('UTC', now)).toBe('2026-11-16')
  })
  it('valida fechas ISO reales', () => {
    expect(isIsoDate('2026-02-29')).toBe(false)
    expect(isIsoDate('2028-02-29')).toBe(true)
    expect(isIsoDate('2026-13-01')).toBe(false)
  })
})
