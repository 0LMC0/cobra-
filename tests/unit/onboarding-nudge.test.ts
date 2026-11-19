import { describe, expect, it } from 'vitest'
import { needsNudge, nudgeEmail } from '@/domain/onboarding-nudge'

const now = new Date('2026-11-20T12:00:00Z')

describe('recordatorio a quien no terminó de configurar', () => {
  it('sale una sola vez, entre 1 y 4 días después de registrarse', () => {
    const base = { onboardingStep: 'first_customer', createdAt: '2026-11-19T10:00:00Z', nudgedAt: null }
    expect(needsNudge(base, now)).toBe(true)
    expect(needsNudge({ ...base, createdAt: '2026-11-20T08:00:00Z' }, now)).toBe(false) // menos de un día
    expect(needsNudge({ ...base, createdAt: '2026-11-10T08:00:00Z' }, now)).toBe(false) // ya pasó la ventana
    expect(needsNudge({ ...base, nudgedAt: '2026-11-20T09:00:00Z' }, now)).toBe(false) // ya se mandó
    expect(needsNudge({ ...base, onboardingStep: 'done' }, now)).toBe(false)
  })

  it('el email lleva directo al paso que falta', () => {
    const e = nudgeEmail('first_charge', { firstName: 'Ana', appUrl: 'https://cobra.example' })
    expect(e.subject).toContain('creale el cobro')
    expect(e.html).toContain('https://cobra.example/app/clientes')
    expect(e.text).toContain('Hola Ana:')
  })
})
