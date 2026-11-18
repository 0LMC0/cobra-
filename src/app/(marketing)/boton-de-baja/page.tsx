import type { Metadata } from 'next'
import { ConsumerRequestForm } from '@/components/marketing/consumer-request-form'
import { Alert } from '@/components/ui/misc'

export const metadata: Metadata = {
  title: 'Botón de baja',
  description: 'Dá de baja tu plan de Cobra+ sin iniciar sesión. Te damos un código de trámite al instante.',
  alternates: { canonical: '/boton-de-baja' },
}

export default async function BajaPage({ searchParams }: { searchParams: Promise<{ listo?: string; error?: string }> }) {
  const { listo, error } = await searchParams
  return (
    <main className="grid-paper">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
        <header className="flex flex-col gap-2">
          <p className="eyebrow">Botón de baja</p>
          <h1 className="text-[34px] sm:text-[42px]">Dar de baja Cobra+</h1>
          <p className="text-[15.5px] leading-relaxed text-muted">
            Cancelás la renovación de tu plan pago y no se te cobra más. No hace falta iniciar sesión: te mandamos un email para confirmar que sos vos.
            Si estás adentro de la app, también podés hacerlo desde Configuración → Tu plan.
          </p>
        </header>
        {listo && /^CB-[A-Z0-9]{6}$/.test(listo) && (
          <Alert tone="ok" title={`Baja confirmada · trámite ${listo}`}>
            Listo: no se te cobra más. Te mandamos el detalle por email.
          </Alert>
        )}
        {error && (
          <Alert tone="warn" title={error === 'vencido' ? 'El link venció' : error === 'mp' ? 'No pudimos cancelar en Mercado Pago' : 'El link no es válido'}>
            {error === 'mp' ? 'Probá de nuevo en un rato desde el mismo link.' : 'Pedí la baja de nuevo acá abajo y usá el link del email nuevo.'}
          </Alert>
        )}
        <section className="rounded-[22px] bg-surface p-5 ring-1 ring-line-2 sm:p-7">
          <ConsumerRequestForm kind="baja" />
        </section>
        <p className="text-[13px] text-muted">Disposición 954/2025 de la Dirección Nacional de Defensa del Consumidor.</p>
      </div>
    </main>
  )
}
