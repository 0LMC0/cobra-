import { describe, expect, it } from 'vitest'
import { buildWhatsAppMessage, toWhatsAppNumber, whatsAppLink } from '@/domain/whatsapp'

describe('teléfono para WhatsApp', () => {
  it.each([
    ['11 2345-6789', '5491123456789'],
    ['11 15 2345-6789', '5491123456789'],
    ['011 15 2345 6789', '5491123456789'],
    ['(011) 2345-6789', '5491123456789'],
    ['+54 9 11 2345 6789', '5491123456789'],
    ['+54 11 2345 6789', '5491123456789'],
    ['5491123456789', '5491123456789'],
    ['0351 15 456-7890', '5493514567890'],
    ['351 456 7890', '5493514567890'],
    ['0221 15 456 7890', '5492214567890'],
    ['02954 15 45-6789', '5492954456789'],
    ['0054 9 11 2345 6789', '5491123456789'],
  ])('%s → %s', (input, expected) => {
    expect(toWhatsAppNumber(input)).toBe(expected)
  })

  it('respeta números de otros países escritos con +', () => {
    expect(toWhatsAppNumber('+598 94 123 456')).toBe('59894123456')
    expect(toWhatsAppNumber('+1 (415) 555-0100')).toBe('14155550100')
  })

  it('devuelve null si no alcanza para un número válido', () => {
    expect(toWhatsAppNumber('')).toBeNull()
    expect(toWhatsAppNumber('1234')).toBeNull()
    expect(toWhatsAppNumber('11 2345')).toBeNull()
    expect(toWhatsAppNumber('abc')).toBeNull()
  })
})

describe('mensaje de WhatsApp', () => {
  const base = {
    customerName: 'Estudio Rivas',
    contactName: 'Marina Pérez',
    businessName: 'Estudio Martínez',
    concept: 'la cuota de noviembre',
    amountMinor: 15_000_000,
    currency: 'ARS' as const,
    dueDate: '2026-11-10',
  }
  // Intl puede usar espacios especiales entre el símbolo y el número.
  const clean = (s: string) => s.replace(/ | /g, ' ')

  it('antes del vencimiento: saludo, importe y fecha', () => {
    const text = clean(buildWhatsAppMessage({ ...base, moment: 'before' }))
    expect(text).toContain('Hola Marina, ¿cómo estás? Te escribo de Estudio Martínez.')
    expect(text).toContain('la cuota de noviembre por $ 150.000 vence el martes, 10 de noviembre')
    expect(text).toContain('Si ya lo pagaste, mandame el comprobante y listo.')
  })

  it('suma el alias si la empresa lo cargó', () => {
    const text = buildWhatsAppMessage({ ...base, moment: 'due', transferAlias: 'estudio.martinez' })
    expect(text).toContain('Podés transferir al alias estudio.martinez.')
  })

  it('atrasado y último aviso: amable, sin amenazas', () => {
    const after = buildWhatsAppMessage({ ...base, moment: 'after' })
    expect(after).toContain('La cuota de noviembre por')
    expect(after).toContain('venció el martes, 10 de noviembre y todavía no lo vemos acreditado')
    expect(after.match(/Te escribo/g)).toHaveLength(1)
    const final = buildWhatsAppMessage({ ...base, moment: 'final' })
    expect(final).toContain('La cuota de noviembre por')
    expect(final).toContain('¿Me avisás cuándo lo podés pagar?')
    for (const t of [after, final]) expect(t).not.toMatch(/intimación|legal|abogado|deuda/i)
  })

  it('sin contacto, saluda con el nombre completo del cliente', () => {
    const text = buildWhatsAppMessage({ ...base, customerName: 'Clínica Norte', contactName: null, moment: 'due' })
    expect(text.startsWith('Hola Clínica Norte, ¿cómo estás?')).toBe(true)
  })

  it('con centavos, los muestra', () => {
    const text = clean(buildWhatsAppMessage({ ...base, amountMinor: 15_000_050, moment: 'before' }))
    expect(text).toContain('$ 150.000,50')
  })

  it('promesa de pago: retoma la fecha prometida', () => {
    const text = buildWhatsAppMessage({ ...base, moment: 'promise', promisedFor: '2026-11-20' })
    expect(text).toContain('se pagaba el viernes, 20 de noviembre. ¿Pudiste hacerlo?')
  })

  it('arma el link de wa.me con el texto codificado', () => {
    expect(whatsAppLink('5491123456789', 'Hola Marina, ¿todo bien?')).toBe(
      'https://wa.me/5491123456789?text=Hola%20Marina%2C%20%C2%BFtodo%20bien%3F',
    )
  })
})
