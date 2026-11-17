/**
 * Dinero en Cobra+: enteros en unidades menores (centavos) + código ISO 4217.
 * Nunca floats. Nunca se suman monedas distintas.
 */

export type CurrencyCode = 'ARS' | 'USD' | 'UYU' | 'CLP' | 'MXN' | 'BRL' | 'COP' | 'PEN'

export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = ['ARS', 'USD', 'UYU', 'CLP', 'MXN', 'BRL', 'COP', 'PEN']

/** Decimales por moneda (CLP no usa centavos). */
const MINOR_DIGITS: Record<CurrencyCode, number> = {
  ARS: 2, USD: 2, UYU: 2, CLP: 0, MXN: 2, BRL: 2, COP: 2, PEN: 2,
}

export type Money = { amountMinor: number; currency: CurrencyCode }

export function isCurrency(value: string): value is CurrencyCode {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value)
}

export function minorDigits(currency: CurrencyCode): number {
  return MINOR_DIGITS[currency]
}

function assertMinor(n: number): void {
  if (!Number.isSafeInteger(n)) throw new RangeError(`Importe inválido: ${n}`)
}

/**
 * Convierte lo que escribe una persona en Argentina ("150.000,50", "150000.5",
 * "$ 1.234") a unidades menores. Devuelve null si no es un importe válido.
 *
 * Regla: si hay coma, la coma es decimal y los puntos son miles. Si no hay coma
 * y hay un único punto seguido de 1–2 dígitos al final, ese punto es decimal.
 */
export function parseAmount(input: string, currency: CurrencyCode): number | null {
  const digits = minorDigits(currency)
  let s = input.trim().replace(/^\$|^[A-Z]{3}/i, '').replace(/\s/g, '')
  if (s === '' || s.startsWith('-')) return null

  if (s.includes(',')) {
    if ((s.match(/,/g) ?? []).length > 1) return null
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '') // "1.234.567" → miles
  } else if (!/^\d+(\.\d{1,2})?$/.test(s)) {
    return null
  }

  const m = /^(\d+)(?:\.(\d+))?$/.exec(s)
  if (!m) return null
  const [, whole, frac = ''] = m
  if (frac.length > digits) return null

  const minor = Number(whole) * 10 ** digits + Number(frac.padEnd(digits, '0') || '0')
  return Number.isSafeInteger(minor) ? minor : null
}

/** "$ 150.000,50" para ARS en es-AR. */
export function formatMoney(amountMinor: number, currency: CurrencyCode, opts: { compact?: boolean } = {}): string {
  assertMinor(amountMinor)
  const digits = minorDigits(currency)
  const value = amountMinor / 10 ** digits
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: opts.compact ? 0 : digits,
    maximumFractionDigits: opts.compact ? 0 : digits,
    notation: opts.compact && Math.abs(value) >= 1_000_000 ? 'compact' : 'standard',
  }).format(value)
}

/** Para precargar un input de edición: 15000050 → "150000,50". */
export function toInputString(amountMinor: number, currency: CurrencyCode): string {
  assertMinor(amountMinor)
  const digits = minorDigits(currency)
  if (digits === 0) return String(amountMinor)
  const sign = amountMinor < 0 ? '-' : ''
  const abs = Math.abs(amountMinor)
  const whole = Math.floor(abs / 10 ** digits)
  const frac = String(abs % 10 ** digits).padStart(digits, '0')
  return `${sign}${whole},${frac}`
}

/** Suma segura dentro de una misma moneda. */
export function sumMinor(values: readonly number[]): number {
  let total = 0
  for (const v of values) {
    assertMinor(v)
    total += v
    assertMinor(total)
  }
  return total
}

/** Agrupa importes por moneda: nunca mezcla. */
export function totalsByCurrency(items: readonly Money[]): Map<CurrencyCode, number> {
  const out = new Map<CurrencyCode, number>()
  for (const { amountMinor, currency } of items) {
    out.set(currency, sumMinor([out.get(currency) ?? 0, amountMinor]))
  }
  return out
}

/** Porcentaje entero (0–100) con guarda de división por cero. */
export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)))
}
