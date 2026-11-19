import { describe, expect, it, vi } from 'vitest'
import { renderReminderEmail } from '@/domain/emails'
import { emailLayout } from '@/domain/email-layout'

vi.mock('server-only', () => ({}))

const base = { moment: 'before' as const, customerName: 'Estudio Rivas', contactName: 'Marina', businessName: 'Estudio <Martínez>', concept: 'cuota de noviembre', amountMinor: 15_000_000, currency: 'ARS' as const, dueDate: '2026-11-25' as const }

describe('diseño de los emails', () => {
  it('el aviso lleva el botón "Ya pagué" cuando hay link, y si no pide el comprobante', () => {
    const con = renderReminderEmail({ ...base, paidUrl: 'https://cobra.example/ya-pague?t=x' })
    expect(con.html).toContain('https://cobra.example/ya-pague?t=x')
    expect(con.html).toContain('Ya pagué')
    expect(con.text).toContain('avisale a Estudio <Martínez> con un toque')
    expect(renderReminderEmail(base).text).toContain('respondé este email con el comprobante')
  })

  it('escapa el nombre de la empresa en el HTML y arma un email completo con vista previa', () => {
    const e = renderReminderEmail(base)
    expect(e.html).not.toContain('<Martínez>')
    expect(e.html).toContain('&lt;Martínez&gt;')
    expect(e.html.startsWith('<!doctype html>')).toBe(true)
    expect(emailLayout({ preheader: 'Vista previa', heading: 'Hola', body: '', footer: '' })).toContain('display:none')
  })
})

describe('link "Ya pagué"', () => {
  it('firma por cobro y rechaza links adulterados', async () => {
    process.env.UNSUBSCRIBE_SECRET = 'secreto-de-prueba'
    const { paidClaimToken, verifyPaidClaimToken, unsubscribeToken } = await import('@/server/unsubscribe')
    const id = '6f1d1b4e-8c3a-4f2e-9b7d-2a1c3e4f5a6b'
    expect(verifyPaidClaimToken(paidClaimToken(id))).toBe(id)
    expect(verifyPaidClaimToken(paidClaimToken(id).slice(0, -2) + 'xx')).toBeNull()
    // El link de baja no sirve como "Ya pagué" (firmas distintas).
    expect(verifyPaidClaimToken(unsubscribeToken(id))).toBeNull()
  })
})
