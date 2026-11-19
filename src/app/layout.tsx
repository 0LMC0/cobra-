import type { Metadata, Viewport } from 'next'
import { Caveat, Figtree, Poppins } from 'next/font/google'
import Script from 'next/script'
import { siteUrl } from '@/config/env'
import './globals.css'

// Familia PrimerosPrecios: Poppins para titulares y números grandes,
// Figtree para el texto y Caveat para lo escrito a mano (la libreta).
const poppins = Poppins({ variable: '--font-poppins', subsets: ['latin'], weight: ['600', '700', '800', '900'], display: 'swap' })
const figtree = Figtree({ variable: '--font-body', subsets: ['latin'], display: 'swap' })
const caveat = Caveat({ variable: '--font-caveat', subsets: ['latin'], weight: ['600', '700'], display: 'swap', preload: false })

const description =
  'Cobra+ les recuerda a tus clientes que te paguen: les manda un email antes y después del vencimiento, deja de escribirles cuando te pagan y a vos te manda un resumen. De PrimerosPrecios.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Cobra+: recordatorios de pago para tus clientes | PrimerosPrecios', template: '%s · Cobra+' },
  description,
  applicationName: 'Cobra+',
  authors: [{ name: 'PrimerosPrecios', url: 'https://primerosprecios.com' }],
  publisher: 'PrimerosPrecios',
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Cobra+ by PrimerosPrecios',
    title: 'Cobra+: recordatorios de pago para tus clientes',
    description,
  },
  twitter: { card: 'summary_large_image', title: 'Cobra+: recordatorios de pago para tus clientes', description },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#fbf7f1',
  colorScheme: 'light',
  // Sin zoom: se siente como app (y el celu no hace zoom al tocar un campo).
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className={`${poppins.variable} ${figtree.variable} ${caveat.variable} min-h-dvh`}>
        {children}
        {/* Visitas y conversión, sin cookies (Vercel Web Analytics). Sólo existe en Vercel; en local no carga nada. */}
        {process.env.VERCEL && <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />}
      </body>
    </html>
  )
}
