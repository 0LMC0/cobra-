import { describe, expect, it } from 'vitest'
import { IMPORT_TEMPLATE, parseCsv, previewImport } from '@/domain/import-customers'

describe('importar clientes desde CSV', () => {
  it('lee ";" de Excel en español, "," y comillas con separadores adentro', () => {
    expect(parseCsv('﻿Nombre;Email\r\n"Rivas; Asoc.";a@b.example\r\n')).toEqual([['Nombre', 'Email'], ['Rivas; Asoc.', 'a@b.example']])
    expect(parseCsv('Nombre,Email\n"Dice ""hola""",x@y.example\n\n')).toEqual([['Nombre', 'Email'], ['Dice "hola"', 'x@y.example']])
  })

  it('reconoce títulos con o sin tildes y avisa las columnas que ignora', () => {
    const p = previewImport('Razón social;Correo electrónico;Teléfono;Rubro\nEstudio Rivas;Hola@Rivas.example;11 2345-6789;Diseño\n')
    expect(p.fileError).toBeNull()
    expect(p.ok).toBe(1)
    expect(p.ignoredColumns).toEqual(['Rubro'])
    const row = p.rows[0]
    expect(row.status === 'ok' && row.data).toMatchObject({ name: 'Estudio Rivas', email: 'hola@rivas.example', whatsappNumber: '5491123456789', remindersPaused: false })
  })

  it('marca errores por fila con el número de línea de Excel', () => {
    const p = previewImport('Nombre;Email\nSin contacto;\nMal mail;esto-no-es-mail\n')
    expect(p.errors).toBe(2)
    expect(p.rows[0]).toMatchObject({ line: 2, status: 'error', name: 'Sin contacto' })
    expect(p.rows[1]).toMatchObject({ line: 3, status: 'error' })
  })

  it('saltea repetidos: dentro del archivo y contra los clientes que ya tenés', () => {
    const csv = 'Nombre;Email;CUIT\nUno;uno@x.example;30-11111111-1\nUno bis;UNO@x.example;\nDos;dos@x.example;30111111111\nTres;ya@x.example;\n'
    const p = previewImport(csv, { emails: ['ya@x.example'], taxIds: [] })
    expect(p.ok).toBe(1)
    expect(p.duplicates).toBe(3)
  })

  it('explica qué falta si el archivo no sirve', () => {
    expect(previewImport('').fileError).toMatch(/no tiene clientes/)
    expect(previewImport('Email\na@b.example\n').fileError).toMatch(/columna "Nombre"/)
  })

  it('la plantilla de ejemplo se importa sin errores', () => {
    const p = previewImport(IMPORT_TEMPLATE)
    expect(p).toMatchObject({ ok: 1, errors: 0, duplicates: 0, fileError: null })
  })
})
