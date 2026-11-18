import { describe, expect, it } from 'vitest'
import { safeNextPath } from '@/domain/safe-redirect'

describe('volver después de iniciar sesión', () => {
  it('deja las rutas internas, con su consulta', () => {
    expect(safeNextPath('/app/clientes')).toBe('/app/clientes')
    expect(safeNextPath('/app/plan/volver?preapproval_id=abc123')).toBe('/app/plan/volver?preapproval_id=abc123')
  })

  it('nunca manda a otro sitio', () => {
    for (const bad of ['https://malo.example', '//malo.example', '/\\malo.example', '/\t/malo.example', '/\n/malo.example', 'malo', '', null, 42]) {
      expect(safeNextPath(bad)).toBe('/app')
    }
  })
})
