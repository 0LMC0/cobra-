import { customerSchema, type CustomerInput } from './forms'

/**
 * Importar clientes desde un CSV (Excel o Google Sheets → "Guardar como CSV").
 * Puro y probado: el navegador lo usa para mostrar la vista previa y el servidor
 * lo vuelve a correr antes de guardar (nunca confía en lo que llega del navegador).
 */

export const MAX_IMPORT_ROWS = 1000

/** Encabezados que reconocemos, sin tildes y en minúscula. */
const HEADERS: Record<string, keyof RawCustomer> = {
  nombre: 'name', cliente: 'name', 'razon social': 'name', empresa: 'name', name: 'name',
  email: 'email', mail: 'email', 'e-mail': 'email', correo: 'email', 'correo electronico': 'email',
  celular: 'phone', telefono: 'phone', tel: 'phone', whatsapp: 'phone', movil: 'phone', phone: 'phone',
  cuit: 'taxId', cuil: 'taxId', dni: 'taxId', 'cuit/cuil': 'taxId',
  contacto: 'contactName', 'persona de contacto': 'contactName',
  notas: 'notes', nota: 'notes', observaciones: 'notes', comentarios: 'notes',
}

export type RawCustomer = { name: string; email: string; phone: string; taxId: string; contactName: string; notes: string }

export type ImportRow =
  | { line: number; status: 'ok'; data: CustomerInput }
  | { line: number; status: 'error'; name: string; problem: string }
  | { line: number; status: 'duplicate'; name: string; problem: string }

export type ImportPreview = {
  rows: ImportRow[]
  ok: number
  errors: number
  duplicates: number
  /** Columnas que no se reconocieron (se ignoran). */
  ignoredColumns: string[]
  /** Problema general del archivo (sin filas, sin columna de nombre, etc.). */
  fileError: string | null
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

/** Separa un CSV respetando comillas. Detecta ";" (Excel en español), "," o tabulación. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '')
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? ''
  const count = (c: string) => firstLine.split(c).length - 1
  const sep = [';', ',', '\t'].sort((a, b) => count(b) - count(a))[0]
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === sep) { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

/** Vista previa: qué filas entran, cuáles tienen errores y cuáles están repetidas. */
export function previewImport(text: string, existing: { emails: string[]; taxIds: string[] } = { emails: [], taxIds: [] }): ImportPreview {
  const empty = (fileError: string): ImportPreview => ({ rows: [], ok: 0, errors: 0, duplicates: 0, ignoredColumns: [], fileError })
  const table = parseCsv(text)
  if (table.length < 2) return empty('El archivo no tiene clientes. La primera fila tiene que ser los títulos (Nombre, Email, Celular…) y debajo, un cliente por fila.')
  const header = table[0].map((h) => HEADERS[fold(h)] ?? null)
  if (!header.includes('name')) return empty('No encontramos la columna "Nombre". Poné en la primera fila los títulos: Nombre, Email, Celular.')
  if (table.length - 1 > MAX_IMPORT_ROWS) return empty(`El archivo tiene más de ${MAX_IMPORT_ROWS} clientes. Dividilo en partes.`)
  const ignoredColumns = table[0].filter((h, i) => h.trim() && !header[i]).map((h) => h.trim())

  const seenEmails = new Set(existing.emails.map((e) => e.toLowerCase()))
  const seenTax = new Set(existing.taxIds.map(digits))
  const rows: ImportRow[] = []

  table.slice(1).forEach((cells, idx) => {
    const line = idx + 2
    const raw: RawCustomer = { name: '', email: '', phone: '', taxId: '', contactName: '', notes: '' }
    header.forEach((key, i) => { if (key && !raw[key]) raw[key] = (cells[i] ?? '').trim() })
    const name = raw.name || '(sin nombre)'
    const parsed = customerSchema.safeParse({ ...raw, whatsappOk: 'on', autoReminders: 'on' })
    if (!parsed.success) {
      const problem = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Revisá los datos de esta fila.'
      rows.push({ line, status: 'error', name, problem })
      return
    }
    const d = parsed.data
    if (d.email && seenEmails.has(d.email)) {
      rows.push({ line, status: 'duplicate', name, problem: `Ya hay un cliente con el email ${d.email}.` })
      return
    }
    if (d.taxId && seenTax.has(digits(d.taxId))) {
      rows.push({ line, status: 'duplicate', name, problem: `Ya hay un cliente con el CUIT ${d.taxId}.` })
      return
    }
    if (d.email) seenEmails.add(d.email)
    if (d.taxId) seenTax.add(digits(d.taxId))
    rows.push({ line, status: 'ok', data: d })
  })

  const by = (s: ImportRow['status']) => rows.filter((r) => r.status === s).length
  return { rows, ok: by('ok'), errors: by('error'), duplicates: by('duplicate'), ignoredColumns, fileError: null }
}

function digits(s: string) {
  return s.replace(/\D/g, '')
}

/** Plantilla para descargar: títulos y un ejemplo, separada con ";" para Excel en español. */
export const IMPORT_TEMPLATE = '﻿Nombre;Email;Celular;CUIT;Contacto;Notas\r\nEstudio Rivas;marina@estudiorivas.com;11 2345-6789;30-12345678-9;Marina Pérez;Le cobro el 10\r\n'
