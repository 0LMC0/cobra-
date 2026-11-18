import { describe, expect, it } from 'vitest'
import { ACTIVE_CUSTOMERS, customerLimitError } from '@/config/plans'

describe('tope de clientes activos por plan', () => {
  it('cada plan tiene más lugar que el anterior', () => {
    expect(ACTIVE_CUSTOMERS).toEqual({ free: 10, starter: 30, growth: 200, business: 1000 })
  })

  it('deja sumar hasta el tope y frena en el tope', () => {
    expect(customerLimitError('free', 9)).toBeNull()
    expect(customerLimitError('free', 10)).toBe('Tu plan Gratis llega hasta 10 clientes activos. Archivá los que ya no te deben o pasate a Starter.')
    expect(customerLimitError('starter', 30)).toContain('pasate a Growth')
    expect(customerLimitError('business', 999)).toBeNull()
    expect(customerLimitError('business', 1000)).toContain('1.000 clientes activos')
    expect(customerLimitError('business', 1000)).toContain('escribinos')
  })
})
