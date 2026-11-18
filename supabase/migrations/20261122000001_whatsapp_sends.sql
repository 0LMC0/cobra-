-- Cada vez que alguien toca "Avisar por WhatsApp". Sirve para el historial del
-- cliente y para el cupo del plan Gratis (3 por mes). El mensaje lo manda la
-- persona desde su teléfono: acá sólo queda el registro.
create table public.whatsapp_sends (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations on delete cascade,
  charge_id   uuid not null,
  created_by  uuid references auth.users on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  foreign key (org_id, charge_id) references public.charges (org_id, id) on delete cascade
);
create index whatsapp_sends_org_month_idx on public.whatsapp_sends (org_id, created_at desc);

alter table public.whatsapp_sends enable row level security;
create policy whatsapp_sends_select on public.whatsapp_sends for select to authenticated
  using (public.has_org_role(org_id, 'viewer'));
create policy whatsapp_sends_insert on public.whatsapp_sends for insert to authenticated
  with check (public.has_org_role(org_id, 'operator') and created_by = auth.uid());
-- Nadie edita ni borra el registro desde la app.
revoke update, delete on public.whatsapp_sends from anon, authenticated;
revoke all on public.whatsapp_sends from anon;
