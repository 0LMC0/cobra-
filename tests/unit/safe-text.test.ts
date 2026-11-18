import { describe, expect, it } from 'vitest'
import { chargeSchema, customerSchema } from '@/domain/forms'
import { cleanText, hasLink, normalizeTransferAlias } from '@/domain/safe-text'

const UUID = '6f1d1b4e-8c3a-4f2e-9b7d-2a1c3e4f5a6b'

describe('textos que viajan en los emails', () => {
  it('detecta links y dominios, sin falsos positivos con textos comunes', () => {
    for (const s of ['Pagá en http://pago.example', 'www.banco-falso.com', 'entrá a mibanco.com.ar', 'link: bit.ly/abc', 'pago.xyz']) expect(hasLink(s)).toBe(true)
    for (const s of ['Cuota de noviembre', 'Abono mensual (servicio técnico)', 'Estudio Rivas S.A.', 'Honorarios oct. 2026', 'Mantenimiento 2do piso']) expect(hasLink(s)).toBe(false)
  })

  it('saca caracteres invisibles y de dirección de texto', () => {
    expect(cleanText('Cuota​ de‮ nov  ')).toBe('Cuota de nov')
  })

  it('el concepto del cobro no puede llevar links', () => {
    const r = chargeSchema.safeParse({ customerId: UUID, concept: 'Pagá acá: www.cobro-urgente.com', amount: '1000', currency: 'ARS', dueDate: '2026-12-01' })
    expect(r.success).toBe(false)
    const ok = chargeSchema.safeParse({ customerId: UUID, concept: 'Cuota​ de diciembre', amount: '1000', currency: 'ARS', dueDate: '2026-12-01' })
    expect(ok.success && ok.data.concept).toBe('Cuota de diciembre')
  })

  it('el cliente y su contacto tampoco', () => {
    expect(customerSchema.safeParse({ name: 'Rivas', contactName: 'Marina http://x.example', email: 'a@b.example' }).success).toBe(false)
    expect(customerSchema.safeParse({ name: 'www.rivas.com', email: 'a@b.example' }).success).toBe(false)
    expect(customerSchema.safeParse({ name: 'Estudio Rivas S.A.', contactName: 'Marina', email: 'a@b.example' }).success).toBe(true)
  })
})

describe('alias para transferir', () => {
  it('acepta alias y CBU/CVU, rechaza cualquier otra cosa', () => {
    expect(normalizeTransferAlias('estudio.rivas.mp')).toBe('estudio.rivas.mp')
    expect(normalizeTransferAlias('0000003100 0123456789 01')).toBe('0000003100012345678901')
    expect(normalizeTransferAlias('pagame en http://x.example')).toBeNull()
    expect(normalizeTransferAlias('abc')).toBeNull()
  })
})

describe('topes de sentido común en un cobro', () => {
  it('rechaza importes gigantes y fechas imposibles', () => {
    const base = { customerId: UUID, concept: 'Cuota', currency: 'ARS', dueDate: '2026-12-01' }
    expect(chargeSchema.safeParse({ ...base, amount: '99999999999999' }).success).toBe(false)
    expect(chargeSchema.safeParse({ ...base, amount: '150.000' }).success).toBe(true)
    expect(chargeSchema.safeParse({ ...base, amount: '1000', dueDate: '9999-01-01' }).success).toBe(false)
  })
})
