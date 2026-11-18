import type { Metadata } from 'next'
import Link from 'next/link'
import { SignUpForm } from './sign-up-form'

export const metadata: Metadata = {
  title: 'Crear cuenta gratis',
  description: 'Creá tu cuenta de Cobra+ gratis, sin tarjeta, y empezá a mandarles recordatorios de pago automáticos a tus clientes.',
  alternates: { canonical: '/registro' },
}

export default function SignUpPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="w-fit rounded-full bg-ok-soft px-3 py-1 text-[12.5px] font-extrabold text-ok">Gratis, sin tarjeta</span>
        <h1 className="text-[30px]">Creá tu cuenta de Cobra+</h1>
        <p className="text-[14.5px] text-muted">
          ¿Ya tenés cuenta? <Link href="/ingresar" className="font-bold text-ink underline decoration-brand decoration-2 underline-offset-[3px]">Ingresá</Link>
        </p>
      </div>
      <SignUpForm />
    </>
  )
}
