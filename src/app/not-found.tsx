import { ButtonLink } from '@/components/ui/button'
import { Logo } from '@/components/ui/misc'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <Logo />
      <h1 className="text-[28px] font-extrabold leading-tight">Esta página no existe</h1>
      <p className="text-sm text-muted">Puede que el link esté mal escrito o que la página se haya movido.</p>
      <ButtonLink href="/" variant="secondary">Ir al inicio</ButtonLink>
    </main>
  )
}
