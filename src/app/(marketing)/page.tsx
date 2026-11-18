import { ArrowRight, Plus } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { HeroSteps } from '@/components/marketing/hero-steps'
import { MonthStrip } from '@/components/marketing/month-strip'
import { HumanCases } from '@/components/marketing/story'
import { Pricing } from '@/components/marketing/pricing'
import { StickyCta } from '@/components/marketing/sticky-cta'
import type { Metadata } from 'next'
import { ACTIVE_CUSTOMERS, MONTHLY_REMINDERS, PLANS } from '@/config/plans'
import { siteUrl } from '@/config/env'
import { cn } from '@/lib/cn'

const WHO = ['Agencias', 'Estudios contables', 'Estudios de diseño', 'Mantenimiento', 'Consultoras', 'Independientes']

const FAQ = [
  ['¿Cobra+ cobra la plata por mí?', 'No. Tus clientes te pagan a vos, como siempre (transferencia, efectivo, lo que uses). Cobra+ sólo les recuerda que te paguen y te ordena quién debe. Nunca toca tu plata.'],
  ['¿Es gratis?', `Sí. El plan Gratis no vence y no pide tarjeta: incluye ${MONTHLY_REMINDERS.free} avisos automáticos por mes y hasta ${ACTIVE_CUSTOMERS.free} clientes. Si necesitás más, te pasás a un plan pago desde $ 18.900 por mes, y lo cancelás cuando quieras.`],
  ['¿Qué le llega a mi cliente?', 'Un email amable con el nombre de tu empresa: qué te debe, cuánto, cuándo vence y tu alias para transferir. Sale 5 días antes, el día anterior, el día que vence y, si se atrasa, a los 3 y a los 7 días. Sólo días hábiles. Antes de que salga lo podés ver en la ficha de cada cliente.'],
  ['¿Y cuando me paga?', 'Tocás “Pagó” y Cobra+ deja de escribirle. Si te paga una parte, anotás lo que pagó y los avisos siguen sólo por lo que falta.'],
  ['¿Y si me dice que paga otro día?', 'Anotás la fecha que te prometió. Cobra+ no le escribe hasta ese día y, si no pagó, le vuelve a avisar.'],
  ['¿Funciona con WhatsApp?', 'Los avisos automáticos salen por email. Además, Cobra+ te deja el mensaje de WhatsApp escrito y lo mandás vos desde tu teléfono con un toque: 3 por mes en el plan Gratis y sin tope desde Starter.'],
  ['¿Puedo pasar mis clientes desde Excel?', 'Sí. Guardás tu planilla como CSV y la subís. Antes de importar te mostramos qué entra, qué tiene errores y qué ya estaba cargado.'],
  ['¿Quién está detrás de Cobra+?', 'PrimerosPrecios: hacemos herramientas para emprendedores y pymes argentinas. Cobra+ es la nuestra para quienes les cobran a los mismos clientes todos los meses.'],
]

export const metadata: Metadata = {
  title: { absolute: 'Cobra+: recordatorios de pago automáticos para tus clientes | PrimerosPrecios' },
  description:
    'App para cobrar a tiempo: Cobra+ les manda a tus clientes un email antes y después del vencimiento, se corta sola cuando te pagan y te avisa quién debe. Gratis para siempre, sin tarjeta.',
  alternates: { canonical: '/' },
  keywords: ['recordatorio de pago', 'cobranzas', 'cobrar a clientes', 'abonos mensuales', 'clientes morosos', 'app de cobranzas', 'recordatorios por email', 'pymes Argentina'],
}

/** Datos estructurados para Google: qué es la app, cuánto sale y las preguntas frecuentes. */
function StructuredData() {
  const base = siteUrl()
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Cobra+',
      url: `${base}/`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'es-AR',
      description: 'Recordatorios de pago automáticos por email para tus clientes, con panel de cobranzas, promesas de pago y resumen diario.',
      publisher: { '@type': 'Organization', name: 'PrimerosPrecios', url: 'https://primerosprecios.com' },
      offers: [
        { '@type': 'Offer', name: 'Gratis', price: '0', priceCurrency: 'ARS' },
        ...PLANS.map((p) => ({ '@type': 'Offer', name: p.name, price: String(p.priceArsMonthly), priceCurrency: 'ARS' })),
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ]
  // JSON dentro de <script>: se escapa "<" para que ningún texto pueda cerrar la etiqueta.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

export default function LandingPage() {
  return (
    <main className="grid-paper">
      <StructuredData />
      {/* ───────────── 1. ¿Qué es Cobra+? + los 4 pasos ───────────── */}
      <section id="que-es" className="scroll-mt-16">
        <div className="mx-auto max-w-[1180px] px-4 pt-9 pb-16 sm:px-6 lg:pt-12 lg:pb-20">
          <div className="grid items-end gap-7 lg:grid-cols-[1fr_auto] lg:gap-12">
            <h1 className="flex flex-col gap-3 sm:gap-4">
              <span className="display-xl text-[50px] sm:text-[80px] lg:text-[96px]">¿Qué es <span className="text-brand">Cobra+</span>?</span>
              <span className="max-w-[780px] font-display text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em] sm:text-[36px] lg:text-[40px]">
                Una app que les recuerda a tus clientes <span className="marker">que te paguen.</span>
              </span>
              <span className="max-w-[640px] text-[17px] leading-relaxed font-semibold text-muted sm:text-[19px]">
                Cargás a quién le cobrás y cuándo vence. Cobra+ le manda un email antes y después del vencimiento. Cuando te paga, deja de escribirle.
              </span>
            </h1>
            <div className="flex flex-col items-start gap-3 lg:items-end lg:pb-1.5">
              <ButtonLink href="/registro" size="lg">
                Empezá gratis <ArrowRight className="size-4" />
              </ButtonLink>
              <p className="text-[14px] font-bold lg:text-right">Gratis para siempre · Sin tarjeta</p>
              <p className="max-w-[19rem] text-[13.5px] font-semibold text-muted lg:text-right">
                Cobra+ no toca tu plata: tus clientes te pagan a vos, como siempre.
              </p>
            </div>
          </div>

          <div id="como-funciona" className="mt-10 scroll-mt-24 border-t border-line-2 pt-8 lg:mt-11">
            <HeroSteps />
          </div>
        </div>
      </section>

      {/* ───────────── 2. Para quién ───────────── */}
      <section className="bg-brand text-white" aria-label="Para quién es">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-4 py-8 sm:px-6 lg:flex-row lg:items-baseline lg:gap-10">
          <p className="shrink-0 text-[15px] font-bold text-white/85 lg:max-w-[15rem]">
            Sirve si les cobrás a los mismos clientes todos los meses:
          </p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 font-display text-[21px] leading-snug font-extrabold tracking-[-0.02em] sm:text-[25px]">
            {WHO.map((w, i) => (
              <li key={w} className="flex items-center gap-3">
                {w}
                {i < WHO.length - 1 && <span aria-hidden className="text-white/40">/</span>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────── 3. Un mes de ejemplo ───────────── */}
      <Section
        noRule
        label="Un ejemplo completo"
        title="Un mes con Cobra+, día por día."
        intro="Estudio Rivas te paga todos los meses y vence el día 10. Mirá qué hace Cobra+ sola, sin que vos escribas nada."
      >
        <MonthStrip />
        <InlineCta text="¿Querés que esto pase con tus clientes?" />
      </Section>

      {/* ───────────── 4. Personas ───────────── */}
      <Section
        label="Pensado para personas"
        title={<>Cobrar es tratar con personas. <span className="marker">Cobra+ está pensada para eso.</span></>}
        intro="A veces se olvidan, a veces lo patean, a veces andan justos. Así responde Cobra+ a lo que pasa de verdad."
      >
        <HumanCases />
      </Section>

      {/* ───────────── 7. Precios ───────────── */}
      <Section
        noRule
        id="precios"
        label="Precios"
        title="Elegí según cuántos clientes tenés."
        intro={`Empezás gratis, sin tarjeta, con ${MONTHLY_REMINDERS.free} avisos por mes. Cuando necesitás más, te pasás de plan.`}
      >
        <Pricing />
      </Section>

      {/* ───────────── 8. Preguntas ───────────── */}
      <section id="preguntas" className="scroll-mt-16">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-10 border-t border-line-2 py-16 sm:py-20 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow">Preguntas</p>
              <h2 className="mt-4 text-[32px] sm:text-[44px]">Lo que casi todos preguntan.</h2>
            </div>
            <div className="border-t-2 border-ink">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group border-b border-line-2 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17px] font-bold">
                    {q}
                    <Plus aria-hidden className="size-5 shrink-0 transition-transform group-open:rotate-45" strokeWidth={2.75} />
                  </summary>
                  <p className="max-w-2xl pb-6 text-[15.5px] leading-relaxed text-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 9. Cierre ───────────── */}
      <section className="px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-8 rounded-[28px] bg-brand p-8 text-white sm:p-12 lg:flex-row lg:items-end">
          <h2 className="display-xl text-[36px] text-white min-[360px]:text-[42px] sm:text-[64px]">Cobrá más.<br />Perseguí menos.</h2>
          <div className="flex min-w-0 max-w-full flex-col items-start gap-3 lg:items-end">
            <ButtonLink href="/registro" size="lg" variant="secondary" className="max-w-full !text-brand">
              Empezá gratis <ArrowRight className="size-4" />
            </ButtonLink>
            <p className="text-[14px] font-semibold text-white/80">Cargás tus clientes y Cobra+ hace el resto.</p>
          </div>
        </div>
      </section>

      <StickyCta />
    </main>
  )
}

/* ───────────── piezas ───────────── */

function Section({
  id, label, title, intro, noRule, children,
}: { id?: string; label: string; title: React.ReactNode; intro?: string; noRule?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <div className={cn('py-16 sm:py-20', !noRule && 'border-t border-line-2')}>
          <header className="mb-10 max-w-3xl">
            <p className="eyebrow">{label}</p>
            <h2 className="mt-4 text-[32px] sm:text-[44px]">{title}</h2>
            {intro && <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-muted">{intro}</p>}
          </header>
          {children}
        </div>
      </div>
    </section>
  )
}

/** Llamado a la acción en el medio de la página: aparece justo después de cada "ah, mirá". */
function InlineCta({ text }: { text: string }) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
      <ButtonLink href="/registro" size="lg">
        Empezá gratis <ArrowRight className="size-4" />
      </ButtonLink>
      <p className="text-[15px] font-bold">{text} <span className="font-semibold text-muted">Sin tarjeta.</span></p>
    </div>
  )
}
