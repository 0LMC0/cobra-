import { describe, expect, it } from 'vitest'
import { conceptForPeriod, periodsToGenerate, type AgreementForGeneration } from '@/domain/agreements'

const base: AgreementForGeneration = { id: 'a1', name: 'Cuota de noviembre', frequency: 'monthly', nextChargeDate: '2026-12-10', endDate: null }

describe('conceptForPeriod', () => {
  it('cambia el mes si el nombre lo tiene', () => {
    expect(conceptForPeriod('Cuota de noviembre', '2026-12-10', 'monthly')).toBe('Cuota de diciembre')
    expect(conceptForPeriod('Abono Noviembre', '2027-01-10', 'monthly')).toBe('Abono Enero')
  })
  it('si no tiene mes, lo agrega', () => {
    expect(conceptForPeriod('Mantenimiento', '2026-12-10', 'monthly')).toBe('Mantenimiento · diciembre')
    expect(conceptForPeriod('Limpieza', '2026-12-03', 'weekly')).toBe('Limpieza · 3 de diciembre')
  })
})

describe('periodsToGenerate', () => {
  it('no genera nada si falta más de una semana', () => {
    expect(periodsToGenerate(base, '2026-12-02')).toEqual({ periods: [], nextChargeDate: '2026-12-10' })
  })

  it('genera el cobro 7 días antes y corre la próxima fecha', () => {
    expect(periodsToGenerate(base, '2026-12-03')).toEqual({
      periods: [{ periodStart: '2026-12-10', dueDate: '2026-12-10', concept: 'Cuota de diciembre' }],
      nextChargeDate: '2027-01-10',
    })
  })

  it('si el proceso estuvo parado, pone al día hasta 3 períodos', () => {
    const r = periodsToGenerate({ ...base, nextChargeDate: '2026-06-10' }, '2026-12-03')
    expect(r.periods.map((p) => p.dueDate)).toEqual(['2026-06-10', '2026-07-10', '2026-08-10'])
    expect(r.nextChargeDate).toBe('2026-09-10')
  })

  it('respeta la fecha de fin del abono', () => {
    const r = periodsToGenerate({ ...base, endDate: '2026-12-31' }, '2026-12-05')
    expect(r.periods).toHaveLength(1)
    expect(r.nextChargeDate).toBeNull()
    expect(periodsToGenerate({ ...base, endDate: '2026-12-01' }, '2026-12-05')).toEqual({ periods: [], nextChargeDate: null })
  })

  it('un abono sin próxima fecha no genera', () => {
    expect(periodsToGenerate({ ...base, nextChargeDate: null }, '2026-12-05')).toEqual({ periods: [], nextChargeDate: null })
  })
})
