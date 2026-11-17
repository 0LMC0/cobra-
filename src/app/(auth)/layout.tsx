import Link from 'next/link'
import { Bell, Check, UserPlus } from 'lucide-react'
import { ByPP, Logo } from '@/components/ui/misc'
import { publicEnv } from '@/config/env'

const WHAT = [
  [UserPlus, 'Anotás a quién le cobrás, cuánto y cuándo vence'],
  [Bell, 'Cobra+ les manda el recordatorio por email'],
  [Check, 'Cuando te pagan, los avisos se frenan solos'],
] as const

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const configured = Boolean(publicEnv())
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)]">
      {/* Panel azul: qué es Cobra+, en tres líneas */}
      <aside className="relative hidden flex-col justify-between gap-10 overflow-y-auto bg-navy p-10 text-white lg:flex xl:p-12">
        <Link href="/" aria-label="Cobra+, inicio" className="w-fit"><Logo withBy light /></Link>

        <div className="flex max-w-lg flex-col gap-9">
          <p className="display-xl text-[38px] text-white xl:text-[48px]">
            Cobra+ les recuerda a tus clientes <span className="text-brand">que te paguen.</span>
          </p>
          <ul className="flex flex-col gap-3">
            {WHAT.map(([Icon, t]) => (
              <li key={t} className="flex items-center gap-3 rounded-[16px] bg-white/[.07] px-4 py-3 text-[15.5px] font-semibold ring-1 ring-white/10">
                <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-brand text-ink"><Icon className="size-[18px]" /></span>
                {t}
              </li>
            ))}
          </ul>
          {/* mini ejemplo */}
          <div className="relative flex items-center gap-3 rounded-[18px] bg-surface p-4 text-ink">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-extrabold text-brand-text">ER</span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">Estudio Rivas</p>
              <p className="text-[12.5px] text-muted">Pagó el 12 · 2 avisos cancelados</p>
            </div>
            <span className="money text-[18px]">$ 150.000</span>
            <span className="stamp absolute -top-3 right-6 text-[11px]">Pagado</span>
            <span className="absolute -bottom-3 left-4 rounded-full bg-marker px-2 py-0.5 text-[10.5px] font-extrabold">Ejemplo</span>
          </div>
        </div>

        <p className="text-[12.5px] font-semibold text-white/50">© {new Date().getFullYear()} PrimerosPrecios</p>
      </aside>

      <main className="grid-paper flex min-w-0 flex-col">
        {!configured && (
          <p role="status" className="bg-warn-soft px-4 py-2 text-center text-[12.5px] font-semibold text-warn">
            Modo desarrollo: falta conectar Supabase, así que todavía no se puede entrar ni crear cuentas.
          </p>
        )}
        <div className="flex flex-1 flex-col px-5 py-6 sm:px-10">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Link href="/" aria-label="Cobra+, inicio"><Logo withBy /></Link>
          </div>
          <p className="mt-4 max-w-[440px] text-[14.5px] leading-snug text-muted lg:hidden">
            Cobra+ les recuerda a tus clientes que te paguen, y deja de escribirles cuando te pagan.
          </p>

          <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-8 sm:py-12">
            <div className="flex flex-col gap-7 sm:rounded-[24px] sm:bg-surface sm:p-9 sm:ring-1 sm:ring-line-2 sm:shadow-[0_1px_2px_rgba(22,35,59,.05),0_12px_32px_-12px_rgba(22,35,59,.12)]">
              {children}
            </div>
          </div>
          <ByPP className="mx-auto lg:hidden" />
        </div>
      </main>
    </div>
  )
}
