import { button, emailLayout, escapeHtml, p } from './email-layout'

/**
 * Recordatorio único para quien se registró y no terminó de configurar Cobra+:
 * sale entre 1 y 4 días después de crear la empresa, una sola vez.
 */
export type NudgeStep = 'first_customer' | 'first_charge' | 'reminders'

export function needsNudge(o: { onboardingStep: string; createdAt: string; nudgedAt: string | null }, now: Date): o is typeof o & { onboardingStep: NudgeStep } {
  if (o.nudgedAt) return false
  if (!['first_customer', 'first_charge', 'reminders'].includes(o.onboardingStep)) return false
  const hours = (now.getTime() - new Date(o.createdAt).getTime()) / 3_600_000
  return hours >= 24 && hours <= 96
}

const STEP: Record<NudgeStep, { title: string; line: string; cta: string; path: string }> = {
  first_customer: { title: 'Te falta un paso: cargá tu primer cliente', line: 'Con el nombre y el email alcanza (o importalos todos juntos desde Excel). Son dos minutos y después Cobra+ trabaja sola.', cta: 'Cargar mi primer cliente', path: '/app/clientes/nuevo?primero=1' },
  first_charge: { title: 'Te falta un paso: creale el cobro a tu cliente', line: 'Poné qué le cobrás, cuánto y cuándo vence. Con eso Cobra+ ya sabe cuándo avisarle.', cta: 'Crear el cobro', path: '/app/clientes' },
  reminders: { title: 'Te falta un paso: prendé los avisos', line: 'Tus cobros ya están cargados. Prendé los avisos y Cobra+ les escribe a tus clientes antes y después de cada vencimiento.', cta: 'Prender los avisos', path: '/app/configuracion' },
}

export function nudgeEmail(step: NudgeStep, opts: { firstName: string | null; appUrl: string }) {
  const s = STEP[step]
  const hello = opts.firstName ? `Hola ${opts.firstName}:` : 'Hola:'
  const href = `${opts.appUrl}${s.path}`
  const text = [hello, '', s.line, '', `${s.cta}: ${href}`, '', 'Si no querés seguir, no hace falta hacer nada: no te vamos a escribir de nuevo por esto.'].join('\n')
  const html = emailLayout({
    preheader: escapeHtml(s.line),
    header: 'cobra',
    heading: escapeHtml(s.title),
    body: p(escapeHtml(hello)) + p(escapeHtml(s.line)) + button(href, s.cta),
    footer: p('Si no querés seguir, no hace falta hacer nada: no te vamos a escribir de nuevo por esto.', { muted: true, size: 12.5 }),
  })
  return { subject: s.title, text, html }
}
