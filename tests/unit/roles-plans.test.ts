import { describe, expect, it } from 'vitest'
import { can, hasRole } from '@/domain/roles'
import { getPlan, monthlyPriceFor, PLANS } from '@/config/plans'

describe('roles', () => {
  it('jerarquía', () => {
    expect(hasRole('owner', 'admin')).toBe(true)
    expect(hasRole('viewer', 'operator')).toBe(false)
  })
  it('permisos clave', () => {
    expect(can('viewer', 'customers.write')).toBe(false)
    expect(can('operator', 'payments.record')).toBe(true)
    expect(can('operator', 'payments.void')).toBe(false)
    expect(can('admin', 'billing.manage')).toBe(false)
    expect(can('owner', 'billing.manage')).toBe(true)
  })
})

describe('planes', () => {
  it('precios y límites del PRD', () => {
    expect(PLANS.map((p) => p.priceUsdMonthly)).toEqual([12, 29, 69])
    expect(getPlan('growth').limits).toEqual({ activeCustomers: 200, seats: 2 })
  })
  it('20% anual', () => {
    expect(monthlyPriceFor(getPlan('growth'), 'year')).toBe(23.2)
    expect(monthlyPriceFor(getPlan('starter'), 'year')).toBe(9.6)
  })
})
