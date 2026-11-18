import type { Metadata } from 'next'
import { ConsumerRequestForm } from '@/components/marketing/consumer-request-form'

export const metadata: Metadata = {
  title: 'Botón de arrepentimiento',
  description: 'Si contrataste un plan de Cobra+ hace menos de 10 días, podés arrepentirte y te devolvemos el dinero.',
  alternates: { canonical: '/arrepentimiento' },
}

export default function ArrepentimientoPage() {
  return (
    <main className="grid-paper">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
        <header className="flex flex-col gap-2">
          <p className="eyebrow">Botón de arrepentimiento</p>
          <h1 className="text-[34px] sm:text-[42px]">Me arrepiento de la compra</h1>
          <p className="text-[15.5px] leading-relaxed text-muted">
            Si contrataste un plan pago de Cobra+ hace menos de 10 días, podés arrepentirte sin dar explicaciones: te devolvemos el dinero por el mismo
            medio de pago y cancelamos la renovación. No hace falta iniciar sesión. Te damos un código de trámite al instante.
          </p>
        </header>
        <section className="rounded-[22px] bg-surface p-5 ring-1 ring-line-2 sm:p-7">
          <ConsumerRequestForm kind="arrepentimiento" />
        </section>
        <p className="text-[13px] text-muted">Derecho de arrepentimiento: art. 34 de la Ley 24.240 y Disposición 954/2025 de la Dirección Nacional de Defensa del Consumidor.</p>
      </div>
    </main>
  )
}
