/**
 * Molde de todos los emails de Cobra+, con la identidad de la página: fondo crema,
 * tarjeta blanca con borde azul tinta y "sombra dura", Poppins, botón azul.
 *
 * Hecho como lo hacen los emails serios: todo en tablas y estilos en línea
 * (Gmail, Outlook y Apple Mail), texto de vista previa oculto, botón "a prueba de
 * Outlook", sin imágenes de fondo ni scripts. El contenido que viene de los datos
 * se escapa ANTES de llegar acá (escapeHtml).
 */
export const EMAIL = {
  bg: '#fbf7f1',
  card: '#ffffff',
  ink: '#16233b',
  muted: '#5f6b82',
  faint: '#8a93a6',
  line: '#e3d8c8',
  blue: '#1d4ed8',
  marker: '#ffde5c',
  ok: '#0b7f62',
  danger: '#c7353a',
  logo: 'https://cobra.primerosprecios.com/brand/cobra-plus-blue-sm.png',
  site: 'https://cobra.primerosprecios.com',
} as const

const FONT = "'Poppins','Segoe UI',Arial,Helvetica,sans-serif"
const BODY_FONT = "'Figtree','Segoe UI',Arial,Helvetica,sans-serif"

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Párrafo de cuerpo. Recibe HTML ya escapado. */
export function p(html: string, opts: { muted?: boolean; size?: number } = {}): string {
  return `<p style="margin:0 0 14px;font-family:${BODY_FONT};font-size:${opts.size ?? 16}px;line-height:1.6;color:${opts.muted ? EMAIL.muted : EMAIL.ink}">${html}</p>`
}

/** Resaltador amarillo, como en la landing. */
export function mark(html: string): string {
  return `<span style="background:${EMAIL.marker};padding:0 4px;border-radius:3px">${html}</span>`
}

/** Botón que se ve bien hasta en Outlook (celda pintada + link). */
export function button(href: string, label: string, variant: 'primary' | 'secondary' = 'primary'): string {
  const bg = variant === 'primary' ? EMAIL.blue : EMAIL.card
  const fg = variant === 'primary' ? '#ffffff' : EMAIL.ink
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px"><tr>
<td bgcolor="${bg}" style="background:${bg};border:1.5px solid ${EMAIL.ink};border-bottom-width:4px;border-radius:12px">
<a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:16px;font-weight:700;line-height:1.2;color:${fg};text-decoration:none;border-radius:12px">${escapeHtml(label)}</a>
</td></tr></table>`
}

/** Caja de datos: filas "etiqueta / valor" (valores ya escapados). */
export function detailsBox(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;background:${EMAIL.bg};border:1px solid ${EMAIL.line};border-radius:14px">
${rows.map(([k, v], i) => `<tr><td style="padding:${i === 0 ? 14 : 8}px 16px ${i === rows.length - 1 ? 14 : 8}px;font-family:${BODY_FONT};font-size:13px;color:${EMAIL.muted};white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td>
<td align="right" style="padding:${i === 0 ? 14 : 8}px 16px ${i === rows.length - 1 ? 14 : 8}px;font-family:${FONT};font-size:15px;font-weight:700;color:${EMAIL.ink}">${v}</td></tr>`).join('\n')}
</table>`
}

/** Bloque titulado con renglones (para el resumen). Cada renglón: nombre, importe y nota ya escapados. */
export function listBlock(title: string, color: string, items: { name: string; amount: string; note: string }[]): string {
  if (!items.length) return ''
  return `<p style="margin:18px 0 8px;font-family:${FONT};font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${color}">${escapeHtml(title)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${EMAIL.line}">
${items.map((it) => `<tr><td style="padding:11px 0;border-bottom:1px solid ${EMAIL.line};font-family:${BODY_FONT};font-size:15px;line-height:1.4;color:${EMAIL.ink}"><b>${it.name}</b><br><span style="font-size:13px;color:${EMAIL.muted}">${it.note}</span></td>
<td align="right" style="padding:11px 0 11px 12px;border-bottom:1px solid ${EMAIL.line};font-family:${FONT};font-size:15px;font-weight:700;color:${EMAIL.ink};white-space:nowrap;vertical-align:top">${it.amount}</td></tr>`).join('\n')}
</table>`
}

/**
 * Página completa del email.
 * - `header`: el logo de Cobra+ o, en los avisos a clientes, el nombre de la empresa que cobra.
 * - `preheader`: lo que se lee en la bandeja al lado del asunto.
 */
export function emailLayout(opts: {
  preheader: string
  heading: string
  body: string
  header?: { businessName: string } | 'cobra'
  footer: string
}): string {
  const header = opts.header && opts.header !== 'cobra'
    ? `<p style="margin:0;font-family:${FONT};font-size:20px;font-weight:800;letter-spacing:-.3px;color:${EMAIL.ink}">${opts.header.businessName}</p>
<p style="margin:2px 0 0;font-family:${BODY_FONT};font-size:12px;color:${EMAIL.faint}">Aviso enviado con Cobra+</p>`
    : `<img src="${EMAIL.logo}" width="120" height="38" alt="Cobra+" style="display:block;border:0;outline:none;width:120px;height:auto">`
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<title>${opts.heading}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Figtree:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${EMAIL.bg};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${opts.preheader}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EMAIL.bg}" style="background:${EMAIL.bg}">
<tr><td align="center" style="padding:32px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
<tr><td style="padding:0 6px 18px">${header}</td></tr>
<tr><td bgcolor="${EMAIL.card}" style="background:${EMAIL.card};border:1.5px solid ${EMAIL.ink};border-right-width:5px;border-bottom-width:5px;border-radius:18px;padding:30px 28px 18px">
<h1 style="margin:0 0 18px;font-family:${FONT};font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-.4px;color:${EMAIL.ink}">${opts.heading}</h1>
${opts.body}
</td></tr>
<tr><td style="padding:20px 8px 0;font-family:${BODY_FONT};font-size:12.5px;line-height:1.6;color:${EMAIL.muted}">
${opts.footer}
<p style="margin:12px 0 0;font-family:${BODY_FONT};font-size:12px;color:${EMAIL.faint}"><a href="${EMAIL.site}" style="color:${EMAIL.faint};text-decoration:underline">Cobra+</a> · una app de PrimerosPrecios</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}
