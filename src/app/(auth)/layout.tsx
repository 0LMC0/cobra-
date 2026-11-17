import Link from 'next/link'
import { Bell, Check, UserPlus } from 'lucide-react'
import { Alert, ByPP, Logo } from '@/components/ui/misc'
import { publicEnv } from '@/config/env'

const WHAT = [
  [UserPlus, 'Anotás a quién le cobrás, cuánto y cuándo vence'],
  [Bell, 'COBRA les manda el recordatorio por email'],
  [Check, 'Cuando te pagan, los avisos se frenan solos'],
] as const

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const configured = Boolean(publicEnv())
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)]">
      {/* Panel azul: qué es COBRA, en tres líneas */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-navy p-12 text-white lg:flex">

        <Link href="/" aria-label="COBRA, inicio" className="relative w-fit"><Logo withBy light /></Link>

        <div className="relative flex max-w-lg flex-col gap-9">
          <h2 className="display-xl text-[54px] text-white">
            Cobrá a tiempo,<br /><span className="text-brand">sin perseguir a nadie.</span>
          </h2>
          <ul className="flex flex-col gap-3">
            {WHAT.map(([Icon, t]) => (
              <li key={t} className="flex items-center gap-3 rounded-[16px] bg-white/[.07] px-4 py-3 text-[15.5px] font-semibold ring-1 ring-white/10">
                <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-brand text-ink"><Icon className="size-[18px]" /></span>
                {t}
              </li>
            ))}
          </ul>
          {/* mini ejemplo */}
          <div className="relative flex items-center gap-3 rounded-[18px] bg-surface p-4 text-ink shadow-[5px_5px_0_#000]">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-soft text-[13px] font-extrabold text-danger">ER</span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">Estudio Rivas</p>
              <p className="text-[12.5px] text-muted">Pagó el 12 · 2 avisos cancelados</p>
            </div>
            <span className="money text-[18px]">$ 150.000</span>
            <span className="stamp absolute -top-3 right-6 text-[11px]">Pagado</span>
            <span className="absolute -bottom-3 left-4 rounded-full bg-marker px-2 py-0.5 text-[10.5px] font-extrabold">Ejemplo</span>
          </div>
        </div>

        <p className="relative text-[12.5px] font-semibold text-white/50">© {new Date().getFullYear()} PrimerosPrecios</p>
      </aside>

      <main className="grid-paper flex flex-col px-4 py-6 sm:px-10">
        <Link href="/" className="lg:hidden" aria-label="COBRA, inicio"><Logo withBy /></Link>
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">
          <div className="soft flex flex-col gap-6 rounded-[28px] bg-surface p-6 sm:p-8">
            {!configured && (
              <Alert tone="warn" title="Entorno sin configurar">
                Faltan las variables de Supabase. Seguí los pasos de <code>docs/SETUP.md</code>.
              </Alert>
            )}
            {children}
          </div>
        </div>
        <ByPP className="mx-auto lg:hidden" />
      </main>
    </div>
  )
}
