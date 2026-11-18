import { describe, expect, it } from 'vitest'
import { isTestAddress } from '@/domain/email-address'

describe('direcciones de prueba (no se les manda nada)', () => {
  it('reconoce los dominios reservados', () => {
    for (const e of ['cliente@prueba.example', 'x@cobraplus.test', 'a@example.com', 'a@mail.example.org', 'b@algo.invalid', 'sin-arroba']) {
      expect(isTestAddress(e)).toBe(true)
    }
  })
  it('deja pasar direcciones reales', () => {
    for (const e of ['marina@estudiorivas.com', 'hola@primerosprecios.com', 'x@gmail.com', 'a@examples.com.ar']) {
      expect(isTestAddress(e)).toBe(false)
    }
  })
})
