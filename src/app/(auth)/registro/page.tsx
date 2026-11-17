import type { Metadata } from 'next'
import Link from 'next/link'
import { TRIAL_DAYS } from '@/config/plans'
import { SignUpForm } from './sign-up-form'

export const metadata: Metadata = { title: 'Crear cuenta' }

export default function SignUpPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="w-fit rounded-full bg-ok-soft px-3 py-1 text-[12.5px] font-extrabold text-ok">{TRIAL_DAYS} días gratis</span>
        <h1 className="text-[30px]">Creá tu cuenta de Cobra+</h1>
        <p className="text-[14.5px] text-muted">
          ¿Ya tenés cuenta? <Link href="/ingresar" className="font-bold text-ink underline decoration-brand decoration-2 underline-offset-[3px]">Ingresá</Link>
        </p>
      </div>
      <SignUpForm />
    </>
  )
}
