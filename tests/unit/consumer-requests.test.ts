import { describe, expect, it } from 'vitest'
import { bajaDoneEmail, ownerNotice, receiptEmail, requestCode } from '@/domain/consumer-requests'

describe('botones de arrepentimiento y de baja', () => {
  it('arma códigos de trámite legibles, sin letras que se confunden', () => {
    const code = requestCode(new Uint8Array([0, 1, 2, 3, 30, 255]))
    expect(code).toMatch(/^CB-[A-HJKMNP-Z2-9]{6}$/)
  })

  it('el email de baja trae el código y el link para confirmar', () => {
    const e = receiptEmail('baja', 'CB-ABC234', 'https://cobra.example/boton-de-baja/confirmar?t=xyz')
    expect(e.subject).toContain('CB-ABC234')
    expect(e.html).toContain('https://cobra.example/boton-de-baja/confirmar?t=xyz')
    expect(receiptEmail('arrepentimiento', 'CB-ABC234').text).toContain('10 días')
  })

  it('escapa lo que escribe la persona en el aviso interno', () => {
    expect(ownerNotice('baja', 'CB-ABC234', 'a@b.example', '<b>x</b>', null).html).not.toContain('<b>x</b>')
  })

  it('el cierre de la baja dice si había algo para cancelar', () => {
    expect(bajaDoneEmail('CB-ABC234', 1).text).toContain('Cancelamos la renovación de tu plan')
    expect(bajaDoneEmail('CB-ABC234', 0).text).toContain('No encontramos planes pagos')
  })
})
