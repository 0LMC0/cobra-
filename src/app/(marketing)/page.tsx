import { ArrowRight, Plus } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { HeroSteps } from '@/components/marketing/hero-steps'
import { PanelDemo } from '@/components/marketing/hero-demo'
import { MonthStrip } from '@/components/marketing/month-strip'
import { DigestPreview, EmailPreview, HumanCases } from '@/components/marketing/story'
import { Pricing } from '@/components/marketing/pricing'
import { StickyCta } from '@/components/marketing/sticky-cta'
import { MONTHLY_REMINDERS } from '@/config/plans'
import { cn } from '@/lib/cn'

const WHO = ['Agencias', 'Estudios contables', 'Estudios de diseño', 'Mantenimiento', 'Consultoras', 'Independientes']

const FAQ = [
  ['¿Para quién es?', 'Para quien les cobra a los mismos clientes todos los meses: agencias, estudios contables y de diseño, servicios de mantenimiento, consultoras y profesionales independientes.'],
  ['¿Cobra+ cobra la plata por mí?', 'No. El dinero va directo de tu cliente a tu cuenta, como siempre. Cobra+ sólo ordena tus cobros y avisa. Nunca recibimos ni guardamos tu plata.'],
  ['¿Cobra+ me avisa a mí también?', 'Sí. Te manda un resumen por email con quién te pagó, qué vence hoy y quién está atrasado. Sólo te escribe los días que hay novedades.'],
  ['¿Es gratis?', `Sí. El plan Gratis no vence y no pide tarjeta: incluye ${MONTHLY_REMINDERS.free} avisos automáticos por mes y hasta 10 clientes. Si necesitás más, te pasás a un plan pago, desde $ 18.900 por mes.`],
  ['¿Puedo pasar mis clientes desde Excel?', 'Por ahora los cargás uno por uno: con el nombre y el email alcanza. Importar desde Excel está en camino. Exportar ya se puede, desde el plan Growth.'],
  ['¿Qué pasa si un cliente paga una parte?', 'Anotás el pago parcial. Lo que falta queda pendiente y los avisos siguen sólo por ese saldo.'],
  ['¿Puedo cobrar en pesos y en dólares?', 'Sí. Cada cobro tiene su moneda y los totales se muestran por separado. Nunca se suman monedas distintas.'],
  ['¿Funciona con WhatsApp?', 'Los avisos automáticos salen por email. Desde el plan Starter, Cobra+ también te deja el mensaje de WhatsApp escrito y lo mandás vos desde tu teléfono con un toque.'],
  ['¿Y si a mi cliente le molesta que le escriban?', 'Los avisos son amables, salen sólo en días hábiles y se cortan apenas anotás el pago. Podés pausar los avisos de un cliente cuando quieras, y tu cliente puede darse de baja con un clic.'],
  ['¿Qué pasa si me dice que paga otro día?', 'Anotás la fecha que te prometió. Cobra+ no le escribe hasta ese día y, si no pagó, vuelve a avisarle.'],
  ['¿Quién está detrás de Cobra+?', 'PrimerosPrecios: hacemos herramientas para emprendedores y pymes argentinas. Cobra+ es la nuestra para quienes cobran todos los meses.'],
]

export default function LandingPage() {
  return (
    <main className="grid-paper">
      {/* ───────────── 1. ¿Qué es Cobra+? + los 4 pasos ───────────── */}
      <section id="que-es" className="scroll-mt-16">
        <div className="mx-auto max-w-[1180px] px-4 pt-9 pb-16 sm:px-6 lg:pt-12 lg:pb-20">
          <div className="grid items-end gap-7 lg:grid-cols-[1fr_auto] lg:gap-12">
            <h1 className="flex flex-col gap-3 sm:gap-4">
              <span className="display-xl text-[50px] sm:text-[80px] lg:text-[96px]">¿Qué es <span className="text-brand">Cobra+</span>?</span>
              <span className="max-w-[780px] font-display text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em] sm:text-[36px] lg:text-[40px]">
                Una app que les recuerda a tus clientes <span className="marker">que te paguen.</span>
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

      {/* ───────────── 5. El panel ───────────── */}
      <section>
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-12 border-t border-line-2 py-16 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div>
              <p className="eyebrow">Tu panel</p>
              <h2 className="mt-4 text-[32px] sm:text-[44px]">Quién te pagó y quién te debe, <span className="marker">en una pantalla.</span></h2>
              <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-muted">
                Cuánto te falta cobrar, cuánto ya cobraste y quién está atrasado. Cuando alguien te paga, lo marcás con un toque.
              </p>
              <PlainList items={['Los totales se actualizan solos', 'Los atrasados aparecen en rojo', 'Pesos y dólares, cada uno por su lado']} />
              <InlineCta text="Cargá tu primer cliente y miralo funcionando." />
            </div>
            <PanelDemo />
          </div>
        </div>
      </section>

      {/* ───────────── 6. Los dos emails ───────────── */}
      <section className="px-4 sm:px-6">
        <div className="mx-auto max-w-[1180px] rounded-[28px] bg-navy px-5 py-12 text-white sm:px-10 sm:py-14">
          <p className="eyebrow eyebrow-light">Los emails</p>
          <h2 className="mt-4 max-w-3xl text-[32px] text-white sm:text-[44px]">Cobra+ manda dos emails: uno a tu cliente y otro a vos.</h2>
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex min-w-0 flex-col gap-5">
              <div>
                <h3 className="text-[21px] text-white">A tu cliente: el recordatorio</h3>
                <p className="mt-1.5 text-[15.5px] leading-relaxed text-white/75">
                  Claro y amable, con el nombre de tu empresa. Lo marcado en amarillo lo completa Cobra+ con los datos de cada cobro.
                </p>
              </div>
              <EmailPreview />
            </div>
            <div className="flex min-w-0 flex-col gap-5">
              <div>
                <h3 className="text-[21px] text-white">A vos: el resumen del día</h3>
                <p className="mt-1.5 text-[15.5px] leading-relaxed text-white/75">
                  Quién te pagó, qué vence hoy y quién está atrasado. Te enterás sin abrir la app ni revisar el banco cliente por cliente.
                </p>
              </div>
              <DigestPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 7. Precios ───────────── */}
      <Section
        noRule
        id="precios"
        label="Precios"
        title="Elegí según cuántos clientes tenés."
        intro={`En pesos o en dólares. Empezás gratis, sin tarjeta, con ${MONTHLY_REMINDERS.free} avisos por mes.`}
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

/** Lista simple, separada por líneas. */
function PlainList({ items }: { items: string[] }) {
  return (
    <ul className="mt-7 max-w-md border-t border-line-2 text-[16px] font-semibold">
      {items.map((t) => (
        <li key={t} className="border-b border-line-2 py-3">{t}</li>
      ))}
    </ul>
  )
}
