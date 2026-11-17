import { describe, expect, it } from 'vitest'
import { ARS_PRICE_REFERENCE, PLANS, formatPlanPrice, getPlan, monthlyPriceFor, yearlyTotalFor } from '@/config/plans'

describe('precios en pesos y en dólares', () => {
  it('cada plan tiene precio de lista en las dos monedas', () => {
    for (const p of PLANS) {
      expect(p.priceUsdMonthly).toBeGreaterThan(0)
      expect(Number.isInteger(p.priceArsMonthly)).toBe(true)
      expect(p.priceArsMonthly).toBeGreaterThan(0)
    }
  })

  it('la lista en pesos queda cerca de la referencia en dólares (±3 %)', () => {
    for (const p of PLANS) {
      const converted = p.priceUsdMonthly * ARS_PRICE_REFERENCE.usdRate
      expect(Math.abs(p.priceArsMonthly - converted) / converted).toBeLessThan(0.03)
    }
  })

  it('sin moneda devuelve dólares, como antes', () => {
    expect(monthlyPriceFor(getPlan('growth'), 'month')).toBe(29)
    expect(monthlyPriceFor(getPlan('growth'), 'year')).toBe(23.2)
  })

  it('mensual en pesos es el precio de lista', () => {
    expect(monthlyPriceFor(getPlan('starter'), 'month', 'ARS')).toBe(18_900)
    expect(monthlyPriceFor(getPlan('business'), 'month', 'ARS')).toBe(108_900)
  })

  it('anual en pesos aplica el 20 % y queda en pesos enteros', () => {
    expect(monthlyPriceFor(getPlan('starter'), 'year', 'ARS')).toBe(15_120)
    expect(monthlyPriceFor(getPlan('growth'), 'year', 'ARS')).toBe(36_720)
    expect(yearlyTotalFor(getPlan('growth'), 'ARS')).toBe(440_640)
  })

  it('total anual en dólares', () => {
    expect(yearlyTotalFor(getPlan('starter'), 'USD')).toBe(115.2)
    expect(yearlyTotalFor(getPlan('business'))).toBe(662.4)
  })

  it('formatea cada moneda con su símbolo', () => {
    expect(formatPlanPrice(18_900, 'ARS')).toBe('$ 18.900')
    expect(formatPlanPrice(12, 'USD')).toBe('US$ 12')
    expect(formatPlanPrice(23.2, 'USD')).toBe('US$ 23,20')
  })
})
