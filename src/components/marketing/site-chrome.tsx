import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Logo, PPMark } from '@/components/ui/misc'

const SECTIONS = [
  ['#que-es', '¿Qué es?'],
  ['#como-funciona', 'Cómo funciona'],
  ['#precios', 'Precios'],
  ['#preguntas', 'Preguntas'],
] as const

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line-2 bg-bg">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="COBRA by PrimerosPrecios, inicio" className="min-w-0 shrink"><Logo withBy className="max-[359px]:[&_.byline]:hidden" /></Link>
        <nav aria-label="Secciones" className="hidden items-center gap-1 md:flex">
          {SECTIONS.map(([href, label]) => (
            <a key={href} href={href} className="rounded-full px-3.5 py-2 text-[14px] font-bold text-muted transition-colors hover:bg-surface hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/ingresar" className="hidden rounded-full px-3.5 py-2 text-[14px] font-bold text-ink hover:bg-surface sm:block">Ingresar</Link>
          <ButtonLink href="/registro" size="sm" className="shrink-0 max-[359px]:px-3">Empezá<span className="max-[359px]:hidden">&nbsp;gratis</span> <ArrowRight className="hidden size-3.5 sm:block" /></ButtonLink>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-deep">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="flex flex-col items-start gap-4">
          <Logo />
          <p className="max-w-xs text-[14.5px] text-muted">
            Cobranzas y abonos para pymes y profesionales. Hecho para quien cobra todos los meses y se cansó de perseguir.
          </p>
          <a
            href="https://primerosprecios.com"
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-bold ring-1 ring-inset ring-line-2 bg-surface shadow-[0_1px_2px_rgba(22,35,59,.06)] transition-colors hover:bg-surface-2 hover:ring-ink/25 active:scale-[0.97]"
          >
            <PPMark className="h-3 w-auto text-brand" /> Una herramienta de PrimerosPrecios
          </a>
        </div>
        <FooterCol title="Producto" links={SECTIONS.map(([h, l]) => [h, l])} />
        <FooterCol title="Cuenta" links={[['/registro', 'Crear cuenta'], ['/ingresar', 'Ingresar'], ['/recuperar', 'Recuperar contraseña']]} />
        <FooterCol title="Legal" links={[['/legal/terminos', 'Términos y condiciones'], ['/legal/privacidad', 'Política de privacidad']]} />
      </div>
      <div className="border-t border-line-2">
        <p className="mx-auto max-w-[1180px] px-4 py-5 text-[12.5px] font-semibold text-muted sm:px-6">
          © {new Date().getFullYear()} PrimerosPrecios · COBRA no recibe ni custodia el dinero de tus clientes.
        </p>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: (readonly [string, string])[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="label text-ink">{title}</p>
      <ul className="flex flex-col gap-2 text-[14.5px] text-muted">
        {links.map(([href, label]) => (
          <li key={href}><Link href={href} className="font-medium hover:text-ink">{label}</Link></li>
        ))}
      </ul>
    </div>
  )
}
