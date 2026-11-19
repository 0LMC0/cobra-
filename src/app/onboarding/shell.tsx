import { Logo } from '@/components/ui/misc'

/** Marco de cada paso del onboarding: logo, "Paso X de 3" y la barra de avance. `step` 4 = terminado. */
export function OnboardingShell({ step, title, intro, children, wide = false }: { step: 1 | 2 | 3 | 4; title: React.ReactNode; intro: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="grid-paper min-h-dvh px-4 py-8 sm:px-8">
      <header className={`mx-auto flex items-center justify-between ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <Logo withBy />
        <span className="rounded-full bg-surface px-3 py-1 text-[13px] font-bold shadow-[var(--shadow-soft)] ring-1 ring-line">{step > 3 ? '¡Listo!' : `Paso ${step} de 3`}</span>
      </header>
      <main className={`mx-auto mt-10 flex flex-col gap-8 ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5" aria-hidden>
            {[1, 2, 3].map((i) => (
              <span key={i} className="h-2 flex-1 overflow-hidden rounded-full bg-line-2"><span className={`block h-full rounded-full bg-brand ${i === step ? 'bar-fill' : i < step ? '' : 'hidden'}`} /></span>
            ))}
          </div>
          <h1 className="mt-5 text-[32px] leading-tight sm:text-[40px]">{title}</h1>
          <div className="text-[15.5px] leading-relaxed text-muted">{intro}</div>
        </div>
        {children}
      </main>
    </div>
  )
}
