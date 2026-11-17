import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const ID = '6f1d1b4e-8c3a-4f2e-9b7d-2a1c3e4f5a6b'

describe('link de baja firmado', () => {
  let mod: typeof import('@/server/unsubscribe')
  beforeAll(async () => {
    process.env.UNSUBSCRIBE_SECRET = 'secreto-de-prueba'
    mod = await import('@/server/unsubscribe')
  })

  it('el link firmado devuelve el cliente', () => {
    expect(mod.verifyUnsubscribeToken(mod.unsubscribeToken(ID))).toBe(ID)
  })

  it('rechaza firmas cambiadas, otro cliente o basura', () => {
    const t = mod.unsubscribeToken(ID)
    const otro = '7a2e2c5f-9d4b-4a3f-8c8e-3b2d4f5a6b7c'
    expect(mod.verifyUnsubscribeToken(`${otro}.${t.split('.')[1]}`)).toBeNull()
    expect(mod.verifyUnsubscribeToken(`${t.slice(0, -1)}${t.endsWith('A') ? 'B' : 'A'}`)).toBeNull()
    expect(mod.verifyUnsubscribeToken('')).toBeNull()
    expect(mod.verifyUnsubscribeToken('hola')).toBeNull()
  })

  it('con otro secreto la firma no sirve', async () => {
    const t = mod.unsubscribeToken(ID)
    process.env.UNSUBSCRIBE_SECRET = 'otro-secreto'
    expect(mod.verifyUnsubscribeToken(t)).toBeNull()
    process.env.UNSUBSCRIBE_SECRET = 'secreto-de-prueba'
  })
})
