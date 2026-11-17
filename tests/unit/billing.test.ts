import { createHmac } from 'node:crypto'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  buildExternalReference, chargeAmountArs, mapPreapprovalStatus, parseExternalReference, parseSignatureHeader,
  periodEndFrom, preapprovalRequest, signatureManifest,
} from '@/domain/billing'

vi.mock('server-only', () => ({}))

const ORG = '6f1d1b4e-8c3a-4f2e-9b7d-2a1c3e4f5a6b'

describe('suscripción con Mercado Pago', () => {
  it('cobra en pesos: mensual o el total del año en un pago', () => {
    expect(chargeAmountArs('starter', 'month')).toBe(18_900)
    expect(chargeAmountArs('growth', 'year')).toBe(440_640)
  })

  it('arma el pedido de preapproval con la referencia de la empresa', () => {
    const body = preapprovalRequest({ orgId: ORG, orgName: 'Estudio Prueba', plan: 'growth', interval: 'year', payerEmail: 'a@b.example', backUrl: 'https://x.example/app/plan/volver' })
    expect(body).toMatchObject({
      external_reference: `${ORG}|growth|year`,
      status: 'pending',
      auto_recurring: { frequency: 12, frequency_type: 'months', transaction_amount: 440_640, currency_id: 'ARS' },
    })
    expect(body.reason).toBe('Cobra+ Growth (anual) · Estudio Prueba')
  })

  it('lee la referencia y rechaza lo que no es de Cobra+', () => {
    expect(parseExternalReference(buildExternalReference(ORG, 'starter', 'month'))).toEqual({ orgId: ORG, plan: 'starter', interval: 'month' })
    expect(parseExternalReference(`${ORG}|free|month`)).toBeNull()
    expect(parseExternalReference(`${ORG}|oro|month`)).toBeNull()
    expect(parseExternalReference('pedido-123')).toBeNull()
    expect(parseExternalReference(undefined)).toBeNull()
  })

  it('traduce los estados de Mercado Pago', () => {
    expect(mapPreapprovalStatus('authorized')).toBe('active')
    expect(mapPreapprovalStatus('paused')).toBe('past_due')
    expect(mapPreapprovalStatus('cancelled')).toBe('cancelled')
    expect(mapPreapprovalStatus('pending')).toBeNull()
    expect(periodEndFrom('2026-12-17T10:00:00.000-04:00')).toBe('2026-12-17T14:00:00.000Z')
    expect(periodEndFrom(null)).toBeNull()
  })
})

describe('firma de los avisos (webhook)', () => {
  let verify: typeof import('@/server/billing/mercadopago').verifyWebhookSignature
  beforeAll(async () => {
    process.env.MP_WEBHOOK_SECRET_COBRA = 'secreto-de-prueba'
    verify = (await import('@/server/billing/mercadopago')).verifyWebhookSignature
  })
  const sign = (dataId: string, requestId: string, ts: string, secret = 'secreto-de-prueba') =>
    `ts=${ts},v1=${createHmac('sha256', secret).update(signatureManifest(dataId, requestId, ts)).digest('hex')}`

  it('arma el mensaje firmado como indica Mercado Pago', () => {
    expect(signatureManifest('ABC123', 'req-1', '1700000000')).toBe('id:abc123;request-id:req-1;ts:1700000000;')
    expect(parseSignatureHeader('ts=1700000000,v1=abcd')).toEqual({ ts: '1700000000', v1: 'abcd' })
    expect(parseSignatureHeader(null)).toBeNull()
  })

  it('acepta la firma correcta y rechaza la adulterada', () => {
    const header = sign('2c938084', 'req-1', '1700000000')
    expect(verify({ signature: header, requestId: 'req-1', dataId: '2c938084' })).toBe(true)
    expect(verify({ signature: header, requestId: 'req-1', dataId: 'otro-id' })).toBe(false)
    expect(verify({ signature: sign('2c938084', 'req-1', '1700000000', 'otro'), requestId: 'req-1', dataId: '2c938084' })).toBe(false)
    expect(verify({ signature: null, requestId: 'req-1', dataId: '2c938084' })).toBe(false)
  })
})
