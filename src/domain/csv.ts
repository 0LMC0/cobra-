import type { IsoDate } from './dates'
import { minorDigits, type CurrencyCode } from './money'

/**
 * Exportación a CSV pensada para Excel y Google Sheets en español:
 * - separador ";" (Excel en es-AR usa la coma para los decimales),
 * - BOM UTF-8 para que los acentos se vean bien,
 * - importes como número con coma decimal y sin separador de miles,
 * - fechas dd/mm/aaaa,
 * - protección contra "CSV injection": un texto que empieza con = + - @ no se ejecuta como fórmula.
 */
export type Cell = string | number | null | undefined
export const CSV_SEPARATOR = ';'
export const CSV_BOM = '﻿'

const FORMULA_START = /^[=+\-@\t\r]/

/** Celda de texto: neutraliza fórmulas y escapa comillas, separadores y saltos de línea. */
export function csvText(value: string | null | undefined): string {
  if (value == null || value === '') return ''
  let v = String(value)
  if (FORMULA_START.test(v)) v = `'${v}`
  return /[";\n\r]/.test(v) || v !== v.trim() ? `"${v.replace(/"/g, '""')}"` : v
}

/** Importe en unidades menores → "150000,5" (número que Excel entiende, sin miles). */
export function csvAmount(minor: number, currency: CurrencyCode): string {
  const digits = minorDigits(currency)
  const sign = minor < 0 ? '-' : ''
  const abs = Math.abs(minor)
  if (digits === 0) return `${sign}${abs}`
  const whole = Math.floor(abs / 10 ** digits)
  const frac = abs % 10 ** digits
  return frac === 0 ? `${sign}${whole}` : `${sign}${whole},${String(frac).padStart(digits, '0')}`
}

/** "2026-11-17" → "17/11/2026". */
export function csvDate(d: IsoDate | null | undefined): string {
  if (!d) return ''
  const [y, m, day] = d.slice(0, 10).split('-')
  return `${day}/${m}/${y}`
}

/**
 * Arma el archivo. Las celdas string pasan por csvText; las numéricas o ya
 * formateadas con csvAmount/csvDate se pasan envueltas en raw().
 */
export type RawCell = { raw: string }
export const raw = (value: string): RawCell => ({ raw: value })

export function toCsv(header: string[], rows: (Cell | RawCell)[][]): string {
  const line = (cells: (Cell | RawCell)[]) =>
    cells.map((c) => (c && typeof c === 'object' ? c.raw : typeof c === 'number' ? String(c) : csvText(c))).join(CSV_SEPARATOR)
  return CSV_BOM + [line(header), ...rows.map(line)].join('\r\n') + '\r\n'
}

/** Nombre de archivo: "cobra-clientes-2026-11-17.csv". */
export function csvFilename(kind: string, today: IsoDate): string {
  return `cobra-${kind}-${today}.csv`
}
