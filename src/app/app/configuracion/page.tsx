import type { Metadata } from 'next'
import { Card, Badge, Alert } from '@/components/ui/misc'
import { requireOrg } from '@/server/auth'
import { createClient } from '@/lib/supabase/server'
import { FREQUENCY_LABEL, formatDate, type Frequency } from '@/domain/dates'
import { ROLE_LABEL, isOrgRole, can } from '@/domain/roles'
import { DEFAULT_DIGEST_FREQUENCY, type DigestFrequency } from '@/domain/digest'
import { DigestPreferenceForm } from '@/components/app/digest-preference'
import { setDigestFrequency } from '@/server/actions/preferences'
import { ReminderSettingsForm } from '@/components/app/reminder-settings-form'
import { updateReminderSettings } from '@/server/actions/reminder-settings'
import { PlanUsageCard } from '@/components/app/plan-usage'
import { CancelSubscription, PlanPicker } from '@/components/app/plan-picker'
import { cancelSubscription, startSubscription } from '@/server/actions/subscription'
import { PLAN_NAME } from '@/config/plans'
import { getPlanUsage } from '@/server/queries'
import { todayIn } from '@/domain/dates'

export const metadata: Metadata = { title: 'Configuración' }

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const ctx = await requireOrg('viewer')
  const { org } = ctx
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from('organization_members')
    .select('user_id, role, created_at, profiles(full_name)')
    .eq('org_id', org.id)
    .order('created_at')

  const { data: me } = await supabase
    .from('organization_members')
    .select('digest_frequency')
    .eq('org_id', org.id)
    .eq('user_id', ctx.userId)
    .maybeSingle()
  const digestFrequency = (me?.digest_frequency as DigestFrequency | undefined) ?? DEFAULT_DIGEST_FREQUENCY

  const { data: sending } = await supabase
    .from('organizations')
    .select('reminders_enabled, transfer_alias, reply_to_email')
    .eq('id', org.id)
    .maybeSingle()

  const usage = await getPlanUsage(org.id, todayIn(org.timezone))
  const { plan: planResult } = await searchParams
  const { data: sub } = await supabase.from('subscriptions').select('status, current_period_end').eq('org_id', org.id).maybeSingle()
  const renewing = usage.plan !== 'free' && sub?.status !== 'cancelled'
  const until = sub?.current_period_end ? formatDate((sub.current_period_end as string).slice(0, 10), { day: 'numeric', month: 'long' }) : null
  const canManageBilling = can(ctx.role, 'billing.manage')

  const rows: [string, string][] = [
    ['Nombre', org.name],
    ['Rubro', org.industry ?? '—'],
    ['Moneda principal', org.currency],
    ['Zona horaria', org.timezone],
    ['Frecuencia habitual', FREQUENCY_LABEL[org.billing_frequency as Frequency] ?? org.billing_frequency],
    ['Email de contacto', org.contact_email ?? '—'],
    ['Teléfono', org.contact_phone ?? '—'],
  ]

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2.5">
        <p className="eyebrow">Tu cuenta</p>
        <h1 className="text-[36px] sm:text-[42px]"><span className="marker">Configuración</span></h1>
      </header>

      <section id="tu-plan" className="flex scroll-mt-24 flex-col gap-3">
        <h2 className="text-[19px]">Tu plan</h2>
        {planResult === 'activo' && <Alert tone="ok" title="¡Listo! Tu plan ya está activo">Gracias por sumarte. Los avisos ya no tienen tope.</Alert>}
        {planResult === 'pendiente' && <Alert tone="info" title="Mercado Pago está procesando el pago">Apenas se confirme, tu plan se activa solo. Puede tardar unos minutos.</Alert>}
        {(planResult === 'error' || planResult === 'no-corresponde' || planResult === 'sin-datos') && (
          <Alert tone="warn" title="No pudimos confirmar el pago todavía">Si pagaste, se va a activar solo en unos minutos. Si no, probá de nuevo.</Alert>
        )}
        <PlanUsageCard usage={usage} />
        {usage.plan === 'free' || !renewing ? (
          <Card className="p-5"><PlanPicker current={usage.plan} action={startSubscription} canManage={canManageBilling} /></Card>
        ) : (
          canManageBilling && <CancelSubscription action={cancelSubscription} planName={PLAN_NAME[usage.plan]} until={until} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[19px]">Avisos automáticos a tus clientes</h2>
        <Card className="p-5">
          <ReminderSettingsForm
            action={updateReminderSettings}
            enabled={Boolean(sending?.reminders_enabled)}
            transferAlias={sending?.transfer_alias ?? null}
            replyTo={sending?.reply_to_email ?? org.contact_email ?? null}
            canEdit={can(ctx.role, 'org.update')}
          />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[19px]">Resumen por email</h2>
        <p className="max-w-2xl text-[14px] text-muted">
          Te avisamos a quién hay que cobrarle, así no te olvidás de entrar. Sólo llega cuando hay algo para mirar, nunca los fines de semana.
        </p>
        <Card className="p-5">
          <DigestPreferenceForm action={setDigestFrequency} current={digestFrequency} />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[19px]">Empresa</h2>
        <Card>
          <dl className="divide-y divide-line">
            {rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[220px_1fr]">
                <dt className="text-[13.5px] font-semibold text-muted">{k}</dt>
                <dd className="text-[14.5px] font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        {!can(ctx.role, 'org.update') && (
          <p className="text-[12.5px] text-muted">Sólo administración puede modificar estos datos.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[19px]">Equipo</h2>
        {error ? (
          <Alert tone="danger">No pudimos cargar el equipo. Recargá la página.</Alert>
        ) : (
          <Card>
            <ul className="divide-y divide-line">
              {(members ?? []).map((m) => {
                const profile = m.profiles as unknown as { full_name: string | null } | null
                const isMe = m.user_id === ctx.userId
                return (
                  <li key={m.user_id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-[13px] font-extrabold uppercase text-brand-d">
                      {(profile?.full_name ?? '?').slice(0, 1)}
                    </span>
                    <span className="flex-1 text-[14.5px] font-semibold">
                      {profile?.full_name ?? 'Sin nombre'}
                      {isMe && <span className="ml-2 text-[12px] text-muted">(vos)</span>}
                    </span>
                    {isOrgRole(m.role) && <Badge tone={m.role === 'owner' ? 'brand' : 'neutral'}>{ROLE_LABEL[m.role]}</Badge>}
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
        <p className="text-[12.5px] text-muted">Las invitaciones a colaboradores llegan junto con los planes (Fase 4).</p>
      </section>
    </div>
  )
}
