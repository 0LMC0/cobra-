-- Cobra+ · Plan de cada empresa (la suscripción que Cobra+ le cobra a la empresa).
-- No confundir con los abonos (agreements), que son lo que la empresa le cobra a sus clientes.
-- Sin fila = plan Gratis. Sólo el servidor (service role, desde los webhooks de
-- Mercado Pago) escribe: nadie puede subirse de plan desde el navegador.
-- Sólo agrega: no borra ni cambia nada existente.

create table public.subscriptions (
  org_id                    uuid primary key references public.organizations on delete cascade,
  plan                      text not null default 'free' check (plan in ('free', 'starter', 'growth', 'business')),
  status                    text not null default 'active' check (status in ('trialing', 'active', 'past_due', 'cancelled')),
  billing_interval          text check (billing_interval in ('month', 'year')),
  current_period_end        timestamptz,
  cancel_at_period_end      boolean not null default false,
  provider                  text check (provider in ('mercadopago')),
  provider_subscription_id  text unique,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

-- Todo el equipo ve el plan de su empresa (para mostrar límites y uso).
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (public.has_org_role(org_id, 'viewer'));

-- Sin políticas de escritura: además, se quitan los permisos por las dudas.
revoke insert, update, delete on public.subscriptions from anon, authenticated;
