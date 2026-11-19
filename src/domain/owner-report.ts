import { detailsBox, emailLayout, escapeHtml, p } from './email-layout'

/** Parte diario para PrimerosPrecios: cómo viene Cobra+ en las últimas 24 horas. */
export type OwnerReport = {
  newUsers: number
  newOrgs: number
  totalOrgs: number
  activePaid: number
  remindersSent: number
  errors: number
  pendingRequests: number
}

export function ownerReportEmail(r: OwnerReport, dateLabel: string, appUrl: string) {
  const alert = r.errors > 0 || r.pendingRequests > 0
  const subject = `Cobra+ hoy: ${r.newUsers} ${r.newUsers === 1 ? 'registro' : 'registros'}, ${r.activePaid} ${r.activePaid === 1 ? 'plan pago' : 'planes pagos'}${alert ? ' · revisar' : ''}`
  const rows: [string, string][] = [
    ['Personas nuevas', String(r.newUsers)],
    ['Empresas nuevas', String(r.newOrgs)],
    ['Empresas en total', String(r.totalOrgs)],
    ['Planes pagos activos', String(r.activePaid)],
    ['Avisos enviados a clientes', String(r.remindersSent)],
    ['Errores del servidor', String(r.errors)],
    ['Pedidos de baja/arrepentimiento sin resolver', String(r.pendingRequests)],
  ]
  const tips = [
    ...(r.errors ? ['Hubo errores: miralos en Supabase → SQL Editor con "select * from app_errors order by at desc limit 50;".'] : []),
    ...(r.pendingRequests ? ['Hay pedidos de baja o arrepentimiento: revisá los emails "[Cobra+]" en tu bandeja.'] : []),
  ]
  const text = [`Cobra+ · últimas 24 horas (${dateLabel})`, '', ...rows.map(([k, v]) => `${k}: ${v}`), ...(tips.length ? ['', ...tips] : []), '', appUrl].join('\n')
  const html = emailLayout({
    preheader: escapeHtml(subject),
    header: 'cobra',
    heading: escapeHtml(`Cómo viene Cobra+ · ${dateLabel}`),
    body: p('Últimas 24 horas:', { muted: true, size: 14 }) + detailsBox(rows.map(([k, v]) => [k, escapeHtml(v)])) + tips.map((t) => p(escapeHtml(t), { size: 14 })).join(''),
    footer: p('Parte interno de PrimerosPrecios. Te llega porque OWNER_NOTIFY_EMAIL está configurado en Vercel.', { muted: true, size: 12 }),
  })
  return { subject, text, html }
}
