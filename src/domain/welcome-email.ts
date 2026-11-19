import { button, detailsBox, emailLayout, escapeHtml, mark, p } from './email-layout'

/** Bienvenida: sale una sola vez, apenas la persona confirma su email. */
export function welcomeEmail(opts: { firstName: string | null; appUrl: string }) {
  const hello = opts.firstName ? `¡Hola ${opts.firstName}!` : '¡Hola!'
  const subject = 'Bienvenido a Cobra+ by PrimerosPrecios'
  const start = `${opts.appUrl}/onboarding`
  const steps: [string, string][] = [
    ['1. Cargás a tu cliente', 'nombre y email'],
    ['2. Le creás el cobro', 'cuánto y cuándo vence'],
    ['3. Cobra+ le avisa', 'antes y después'],
    ['4. Te paga y lo marcás', 'los avisos se cortan'],
  ]
  const text = [
    hello, '',
    'Ya tenés tu cuenta de Cobra+. Desde ahora, Cobra+ les recuerda a tus clientes que te paguen: les escribe antes y después de cada vencimiento, y deja de escribirles cuando te pagan.',
    '', 'Así se usa:', ...steps.map(([a, b]) => `${a}: ${b}`), '',
    'Tu plan Gratis no vence y no pide tarjeta: 5 clientes, 10 avisos por email y 3 por WhatsApp por mes.',
    '', `Empezá acá: ${start}`, '',
    '¿Dudas? Respondé este email y te contestamos nosotros.',
    '', 'Lautaro, de PrimerosPrecios',
  ].join('\n')
  const html = emailLayout({
    preheader: escapeHtml('Ya tenés tu cuenta. En 2 minutos Cobra+ empieza a avisarles a tus clientes.'),
    header: 'cobra',
    heading: `Bienvenido a Cobra+ ${mark('by PrimerosPrecios')}`,
    body: p(escapeHtml(hello))
      + p('Ya tenés tu cuenta. Desde ahora, Cobra+ les recuerda a tus clientes <b>que te paguen</b>: les escribe antes y después de cada vencimiento y deja de escribirles cuando te pagan. La plata va directo a tu cuenta, como siempre.')
      + p('<b>Así se usa:</b>', { size: 15 })
      + detailsBox(steps.map(([a, b]) => [a, escapeHtml(b)]))
      + p(`Tu plan ${mark('Gratis')} no vence y no pide tarjeta: 5 clientes, 10 avisos por email y 3 por WhatsApp por mes.`, { size: 15 })
      + button(start, 'Configurar mi cuenta')
      + p('¿Dudas? Respondé este email y te contestamos nosotros.', { muted: true, size: 14 })
      + p('Lautaro, de PrimerosPrecios', { size: 15 }),
    footer: p('Te llega porque creaste una cuenta en Cobra+ (cobra.primerosprecios.com).', { muted: true, size: 12.5 }),
  })
  return { subject, text, html }
}
