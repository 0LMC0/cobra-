import { ImageResponse } from 'next/og'

/** Imagen que se ve al compartir el link (WhatsApp, LinkedIn, X, Google Discover). */
export const alt = 'Cobra+: les recuerda a tus clientes que te paguen. Gratis para siempre, de PrimerosPrecios.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Poppins (la tipografía de PrimerosPrecios) desde Google Fonts; si falla, sale con la letra por defecto. */
async function poppins(weight: 600 | 800): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Poppins:wght@${weight}`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1)' } })).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1]
    return url ? await (await fetch(url)).arrayBuffer() : null
  } catch {
    return null
  }
}

export default async function OpengraphImage() {
  const [bold, semi] = await Promise.all([poppins(800), poppins(600)])
  const fonts = [
    ...(bold ? [{ name: 'Poppins', data: bold, weight: 800 as const, style: 'normal' as const }] : []),
    ...(semi ? [{ name: 'Poppins', data: semi, weight: 600 as const, style: 'normal' as const }] : []),
  ]
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#fbf7f1', padding: '64px 72px', fontFamily: fonts.length ? 'Poppins' : 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, color: '#0f1b3d', letterSpacing: -2 }}>
            Cobra<span style={{ color: '#1d4ed8' }}>+</span>
          </div>
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 600, color: '#5b6478' }}>by PrimerosPrecios</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 74, fontWeight: 800, color: '#0f1b3d', lineHeight: 1.05, letterSpacing: -2.5 }}>
            Les recuerda a tus clientes
          </div>
          <div style={{ display: 'flex', fontSize: 74, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2.5 }}>
            <span style={{ background: '#ffe14d', color: '#0f1b3d', padding: '0 12px' }}>que te paguen.</span>
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 30, fontWeight: 600, color: '#3b4560' }}>
            Avisos por email antes y después del vencimiento. Se cortan solos cuando te pagan.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['Gratis para siempre', 'Sin tarjeta', 'Pesos y dólares'].map((t) => (
            <div key={t} style={{ display: 'flex', fontSize: 26, fontWeight: 600, color: '#ffffff', background: '#1d4ed8', borderRadius: 14, padding: '10px 20px' }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}
