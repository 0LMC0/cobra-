import type { Metadata } from 'next'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { ResendForm } from './resend-form'

export const metadata: Metadata = { title: 'Confirmá tu email', robots: { index: false } }

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams
  return (
    <div className="flex flex-col gap-5">
      <span className="grid size-12 place-items-center hard-sm rounded-[12px] bg-marker text-ink">
        <MailCheck className="size-6" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-extrabold leading-tight">Revisá tu email</h1>
        <p className="text-sm text-muted">
          Te mandamos un link de confirmación{email ? <> a <strong className="text-ink">{email}</strong></> : null}.
          Abrilo desde este mismo dispositivo para seguir con la configuración de tu empresa.
        </p>
      </div>
      {email && <ResendForm email={email} />}
      <p className="text-[13px] text-muted">
        ¿Te equivocaste de email? <Link href="/registro" className="text-ink underline">Registrate de nuevo</Link>
      </p>
    </div>
  )
}
