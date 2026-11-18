/**
 * Direcciones que nunca existen (dominios reservados para pruebas, RFC 2606 / 6761).
 * Mandarles un email sólo genera rebotes, y los rebotes bajan la reputación de envío
 * de toda la cuenta de Resend (compartida con la Academia de PrimerosPrecios).
 */
const RESERVED_TLDS = ['.test', '.example', '.invalid', '.localhost', '.local']
const RESERVED_DOMAINS = ['example.com', 'example.net', 'example.org']

export function isTestAddress(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1] ?? ''
  if (!domain) return true
  return RESERVED_TLDS.some((t) => domain.endsWith(t)) || RESERVED_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))
}
