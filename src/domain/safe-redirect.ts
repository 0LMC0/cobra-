/**
 * A dónde volver después de iniciar sesión: sólo rutas internas de Cobra+.
 * Evita "open redirects" (que un link de Cobra+ termine mandando a otro sitio).
 * Los navegadores ignoran tabulaciones y saltos de línea y tratan "\" como "/",
 * así que "/\t/sitio.com" o "/\sitio.com" terminarían afuera: se rechazan.
 */
export function safeNextPath(raw: unknown, fallback = '/app'): string {
  const v = typeof raw === 'string' ? raw : ''
  if (!v.startsWith('/') || v.startsWith('//')) return fallback
  for (const ch of v) {
    const code = ch.charCodeAt(0)
    if (code < 0x20 || code === 0x7f || ch === '\\') return fallback
  }
  try {
    const base = 'https://cobra.invalid'
    const u = new URL(v, base)
    return u.origin === base ? `${u.pathname}${u.search}` : fallback
  } catch {
    return fallback
  }
}
