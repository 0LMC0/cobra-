-- Cobra+ · Fase 3 · Avisos automáticos.
-- Cada aviso que sale queda registrado una sola vez: la unicidad
-- (cobro, paso, canal) es lo que garantiza que nunca se mande dos veces.

-- Datos de envío de cada empresa.
alter table public.organizations
  add column reminders_enabled boolean not null default false,
  add column transfer_alias text check (char_length(transfer_alias) <= 80),
  add column reply_to_email citext check (reply_to_email is null or reply_to_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');

create table public.reminder_deliveries (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references public.organizations on delete cascade,
  charge_id            uuid not null,
  step_id              text not null check (char_length(step_id) <= 40),
  channel              text not null default 'email' check (channel in ('email', 'whatsapp')),
  send_on              date not null,
  recipient            text not null,
  status               text not null default 'queued' check (status in ('queued', 'sent', 'skipped', 'failed')),
  attempts             int not null default 0 check (attempts >= 0),
  last_error           text check (char_length(last_error) <= 500),
  provider_message_id  text,
  created_at           timestamptz not null default now(),
  sent_at              timestamptz,
  unique (charge_id, step_id, channel),
  foreign key (org_id, charge_id) references public.charges (org_id, id) on delete cascade
);
create index reminder_deliveries_org_idx on public.reminder_deliveries (org_id, send_on desc);
create index reminder_deliveries_retry_idx on public.reminder_deliveries (status, send_on) where status in ('queued', 'failed');

alter table public.reminder_deliveries enable row level security;
-- Los miembros ven el historial de avisos de su empresa. Escribe sólo el
-- proceso automático (service role), que saltea la RLS: no hay políticas de escritura.
create policy reminder_deliveries_select on public.reminder_deliveries for select to authenticated
  using (public.has_org_role(org_id, 'viewer'));
