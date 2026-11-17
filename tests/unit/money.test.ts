import { describe, expect, it } from 'vitest'
import { formatMoney, parseAmount, percent, sumMinor, toInputString, totalsByCurrency } from '@/domain/money'

describe('parseAmount', () => {
  it.each([
    ['150.000', 15_000_000],
    ['150.000,50', 15_000_050],
    ['150000,5', 15_000_050],
    ['150000.5', 15_000_050],
    ['150000.50', 15_000_050],
    ['1.234.567', 123_456_700],
    ['$ 1.234,00', 123_400],
    ['0', 0],
    ['  42 ', 4200],
  ])('ARS %s → %d', (input, expected) => {
    expect(parseAmount(input, 'ARS')).toBe(expected)
  })

  it.each(['', 'abc', '-5', '1,2,3', '1.2.3', '10,555', '1e5', '12.345.6'])('rechaza %s', (input) => {
    expect(parseAmount(input, 'ARS')).toBeNull()
  })

  it('CLP no admite decimales', () => {
    expect(parseAmount('1.500', 'CLP')).toBe(1500)
    expect(parseAmount('1500,5', 'CLP')).toBeNull()
  })

  it('rechaza importes fuera de rango seguro', () => {
    expect(parseAmount('999999999999999999', 'ARS')).toBeNull()
  })
})

describe('formatMoney / toInputString', () => {
  it('formatea en es-AR', () => {
    const s = formatMoney(15_000_050, 'ARS')
    expect(s).toContain('150.000,50')
  })
  it('ida y vuelta con el input', () => {
    expect(toInputString(15_000_050, 'ARS')).toBe('150000,50')
    expect(parseAmount(toInputString(15_000_050, 'ARS'), 'ARS')).toBe(15_000_050)
    expect(toInputString(7, 'ARS')).toBe('0,07')
  })
  it('rechaza no enteros', () => {
    expect(() => formatMoney(1.5, 'ARS')).toThrow()
  })
})

describe('sumas', () => {
  it('suma enteros', () => {
    expect(sumMinor([10, 20, 30])).toBe(60)
  })
  it('nunca mezcla monedas', () => {
    const t = totalsByCurrency([
      { amountMinor: 100, currency: 'ARS' },
      { amountMinor: 50, currency: 'USD' },
      { amountMinor: 25, currency: 'ARS' },
    ])
    expect(t.get('ARS')).toBe(125)
    expect(t.get('USD')).toBe(50)
  })
  it('percent con guarda', () => {
    expect(percent(1, 0)).toBe(0)
    expect(percent(1, 3)).toBe(33)
    expect(percent(5, 3)).toBe(100)
  })
})

describe('formatMoneyClean', () => {
  const clean = (t: string) => t.replace(/ | /g, ' ')
  it('saca los ,00 de los importes redondos', async () => {
    const { formatMoneyClean } = await import('@/domain/money')
    expect(clean(formatMoneyClean(15_000_000, 'ARS'))).toBe('$ 150.000')
    expect(clean(formatMoneyClean(15_000_050, 'ARS'))).toBe('$ 150.000,50')
    expect(clean(formatMoneyClean(48_000, 'USD'))).toBe('US$ 480')
    expect(clean(formatMoneyClean(150_000, 'CLP'))).toBe('CLP 150.000')
  })
})
