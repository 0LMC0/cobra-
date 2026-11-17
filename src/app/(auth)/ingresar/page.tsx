import type { Metadata } from 'next'
import Link from 'next/link'
import { Alert } from '@/components/ui/misc'
import { SignInForm } from './sign-in-form'

export const metadata: Metadata = { title: 'Ingresar', robots: { index: false } }

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ siguiente?: string; error?: string }> }) {
  const { siguiente, error } = await searchParams
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-[30px]">Ingresá a tu cuenta</h1>
        <p className="text-[14.5px] text-muted">
          ¿No tenés cuenta? <Link href="/registro" className="font-semibold text-ink underline decoration-brand decoration-2 underline-offset-[3px]">Empezá gratis</Link>
        </p>
      </div>
      {error === 'link' && (
        <Alert tone="warn" title="El link no es válido o ya venció">
          Ingresá con tu contraseña o pedí uno nuevo.
        </Alert>
      )}
      <SignInForm next={siguiente} />
    </>
  )
}
