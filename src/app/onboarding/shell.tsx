import { Logo } from '@/components/ui/misc'

/** Marco de cada paso del onboarding: logo, "Paso X de 4" y la barra de avance. */
export function OnboardingShell({ step, title, intro, children }: { step: 1 | 2 | 3 | 4; title: React.ReactNode; intro: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid-paper min-h-dvh px-4 py-8 sm:px-8">
      <header className="mx-auto flex max-w-2xl items-center justify-between">
        <Logo withBy />
        <span className="rounded-full bg-surface px-3 py-1 text-[13px] font-bold shadow-[var(--shadow-soft)] ring-1 ring-line">Paso {step} de 4</span>
      </header>
      <main className="mx-auto mt-10 flex max-w-2xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5" aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-brand' : 'bg-line-2'}`} />
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
