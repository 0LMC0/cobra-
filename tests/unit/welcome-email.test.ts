import { describe, expect, it } from 'vitest'
import { welcomeEmail } from '@/domain/welcome-email'

describe('email de bienvenida', () => {
  it('saluda por el nombre, explica los pasos y lleva al onboarding', () => {
    const e = welcomeEmail({ firstName: 'Ana', appUrl: 'https://cobra.example' })
    expect(e.subject).toBe('Bienvenido a Cobra+ by PrimerosPrecios')
    expect(e.text).toContain('¡Hola Ana!')
    expect(e.html).toContain('https://cobra.example/onboarding')
    expect(e.html).toContain('Configurar mi cuenta')
  })
})
