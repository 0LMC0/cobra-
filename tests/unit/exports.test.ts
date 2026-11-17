import { describe, expect, it } from 'vitest'
import { csvAmount, csvDate, csvFilename, csvText, toCsv } from '@/domain/csv'
import { chargesCsv, customersCsv, paymentsCsv, type ExportCustomer } from '@/domain/exports'

const lines = (csv: string) => csv.replace(/^﻿/, '').trimEnd().split('\r\n')

describe('CSV', () => {
  it('lleva BOM, separa con ; y termina cada línea con CRLF', () => {
    const csv = toCsv(['A', 'B'], [['x', 1]])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toBe('﻿A;B\r\nx;1\r\n')
  })

  it('escapa comillas, punto y coma y saltos de línea', () => {
    expect(csvText('Rivas; hnos')).toBe('"Rivas; hnos"')
    expect(csvText('dijo "hola"')).toBe('"dijo ""hola"""')
    expect(csvText('línea 1\nlínea 2')).toBe('"línea 1\nlínea 2"')
    expect(csvText(null)).toBe('')
  })

  it('neutraliza fórmulas (CSV injection)', () => {
    expect(csvText('=HYPERLINK("http://malo")')).toBe(`"'=HYPERLINK(""http://malo"")"`)
    expect(csvText('+54 11 1234')).toBe("'+54 11 1234")
    expect(csvText('-5')).toBe("'-5")
    expect(csvText('@SUM(A1)')).toBe("'@SUM(A1)")
  })

  it('importes con coma decimal y sin miles; fechas dd/mm/aaaa', () => {
    expect(csvAmount(15_000_000, 'ARS')).toBe('150000')
    expect(csvAmount(15_000_050, 'ARS')).toBe('150000,50')
    expect(csvAmount(150_000, 'CLP')).toBe('150000')
    expect(csvDate('2026-11-07')).toBe('07/11/2026')
    expect(csvFilename('clientes', '2026-11-17')).toBe('cobra-clientes-2026-11-17.csv')
  })
})

describe('reportes', () => {
  const base: ExportCustomer = {
    name: 'Estudio Rivas', contactName: 'Marina Pérez', email: 'm@rivas.example', phone: '11 0000-0001', whatsappOk: true,
    taxId: null, notes: null, archived: false, optedOut: false, remindersPaused: false,
    owed: [{ currency: 'ARS', balanceMinor: 13_000_000 }], overdueCount: 1, createdAt: '2026-11-01T12:00:00Z',
  }

  it('clientes: una columna por moneda, la principal primero, sin sumar monedas', () => {
    const csv = customersCsv([
      base,
      { ...base, name: 'Delta', owed: [{ currency: 'USD', balanceMinor: 48_000 }], overdueCount: 0, archived: true },
    ], 'ARS')
    const [header, rivas, delta] = lines(csv)
    expect(header).toBe('Nombre;Contacto;Email;Celular;Acepta WhatsApp;CUIT;Estado;Avisos automáticos;Debe (ARS);Debe (USD);Cobros vencidos;Notas;Alta')
    expect(rivas).toBe("Estudio Rivas;Marina Pérez;m@rivas.example;11 0000-0001;Sí;;Activo;Activos;130000;0;1;;01/11/2026")
    expect(delta).toContain(';Archivado;No (archivado);0;480;0;')
  })

  it('cobros: importe, pagado, saldo y estado en palabras', () => {
    const [, row] = lines(chargesCsv([{
      customerName: 'Estudio Rivas', concept: 'Cuota de octubre', currency: 'ARS', amountMinor: 8_000_000, paidMinor: 3_000_000,
      balanceMinor: 5_000_000, dueDate: '2026-11-10', status: 'partially_paid', promisedFor: '2026-11-20', recurring: false,
    }]))
    expect(row).toBe('Estudio Rivas;Cuota de octubre;ARS;80000;30000;50000;10/11/2026;Pago parcial;20/11/2026;No')
  })

  it('pagos: lo más nuevo primero y las anulaciones con su motivo', () => {
    const [, first, second] = lines(paymentsCsv([
      { customerName: 'A', paidOn: '2026-11-01', currency: 'ARS', amountMinor: 100, method: 'cash', reference: null, status: 'confirmed', voidedReason: null, createdAt: '2026-11-01T10:00:00Z' },
      { customerName: 'B', paidOn: '2026-11-12', currency: 'ARS', amountMinor: 5_000_000, method: 'transfer', reference: 'Op 123', status: 'voided', voidedReason: 'Duplicado', createdAt: '2026-11-12T10:00:00Z' },
    ]))
    expect(first).toBe('12/11/2026;B;ARS;50000;Transferencia;Op 123;Anulado;Duplicado;12/11/2026')
    expect(second).toBe('01/11/2026;A;ARS;1;Efectivo;;Confirmado;;01/11/2026')
  })
})
