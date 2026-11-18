/**
 * Textos que terminan dentro de los emails que manda Cobra+ (concepto, nombre de
 * la empresa, nombre del contacto). Como salen desde nuestro dominio, no pueden
 * llevar links ni caracteres invisibles: si no, alguien podría usar Cobra+ para
 * mandar phishing ("Pagá acá: http://...") con nuestra reputación.
 */

// Caracteres de control, de ancho cero y de dirección de texto (sirven para disfrazar textos).
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁩﻿]/g

/** Saca caracteres invisibles y junta los espacios repetidos. */
export function cleanText(s: string): string {
  return s.replace(INVISIBLE, '').replace(/\s+/g, ' ').trim()
}

const URL_LIKE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|ar|io|co|me|ly|link|xyz|info|online|site|store|app|dev|shop|click|top)(\.[a-z]{2})?\b)/i

/** true si el texto parece llevar un link o un dominio. */
export function hasLink(s: string): boolean {
  return URL_LIKE.test(s)
}

/**
 * Alias para transferir: alias de CBU/CVU (6 a 20 letras, números, puntos o guiones)
 * o un CBU/CVU de 22 dígitos (se aceptan espacios o guiones en el medio).
 */
export function normalizeTransferAlias(raw: string): string | null {
  const s = cleanText(raw)
  const digits = s.replace(/[\s-]/g, '')
  if (/^\d{22}$/.test(digits)) return digits
  if (/^[a-zA-Z0-9.-]{6,20}$/.test(s)) return s
  return null
}
