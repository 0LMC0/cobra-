import Link from 'next/link'
import { PLAN_NAME } from '@/config/plans'
import type { PlanUsage } from '@/server/queries'
import { cn } from '@/lib/cn'

/** Plan vigente y avisos usados en el mes. En Gratis muestra la barra y cómo pasar a más. */
export function PlanUsageCard({ usage, compact = false }: { usage: PlanUsage; compact?: boolean }) {
  const { plan, limit, used, held, monthLabel, customers, customerLimit } = usage
  const customersFull = customers >= customerLimit
  const capped = limit !== null
  const pct = capped ? Math.min(100, Math.round((used / Math.max(limit, 1)) * 100)) : 0
  const exhausted = capped && used >= limit
  const left = capped ? Math.max(0, limit - used) : null

  return (
    <div className={cn('flex flex-col gap-3 rounded-[18px] bg-surface p-5 ring-1', exhausted ? 'ring-warn' : 'ring-line-2')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[15.5px] font-bold">Plan {PLAN_NAME[plan]}</p>
        <p className="text-[13.5px] font-semibold text-muted">
          {capped ? `${Math.min(used, limit)} de ${limit} avisos automáticos en ${monthLabel}` : `${used} avisos automáticos en ${monthLabel}, sin tope`}
        </p>
      </div>
      {capped && (
        <div className="h-2.5 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={Math.min(used, limit)} aria-valuemin={0} aria-valuemax={limit} aria-label="Avisos usados este mes">
          <div className={cn('h-full rounded-full', exhausted ? 'bg-warn' : 'bg-brand')} style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className={cn('text-[13.5px] font-semibold', customersFull ? 'text-warn' : 'text-muted')}>
        {customers.toLocaleString('es-AR')} de {customerLimit.toLocaleString('es-AR')} clientes activos
        {customersFull && ' · llegaste al tope: archivá los que ya no te deben o pasate a un plan más grande'}
      </p>
      {held > 0 && (
        <p className="rounded-[12px] bg-warn-soft px-3.5 py-2.5 text-[14px] leading-snug font-semibold text-warn">
          {held === 1 ? '1 aviso no salió' : `${held} avisos no salieron`} este mes porque se terminó el cupo. Esos clientes no recibieron su recordatorio.
        </p>
      )}
      {capped && (
        <p className="text-[13.5px] leading-snug text-muted">
          {exhausted
            ? <>Llegaste al tope de este mes: los avisos por email vuelven el 1° del mes que viene. El botón de WhatsApp sigue funcionando sin límite.</>
            : <>Te quedan <b className="text-ink">{left}</b> este mes. El botón de WhatsApp no cuenta: lo mandás vos.</>}
          {compact && <> <Link href="/app/configuracion#tu-plan" className="font-bold text-brand-text hover:underline">Pasate a un plan sin tope</Link></>}
        </p>
      )}
    </div>
  )
}
