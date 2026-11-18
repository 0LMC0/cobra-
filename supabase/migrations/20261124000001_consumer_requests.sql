-- Botón de arrepentimiento y botón de baja (Disposición 954/2025 de la Dirección
-- Nacional de Defensa del Consumidor; la Disp. 3/2026 permite verificar identidad).
-- Cualquiera los puede usar sin iniciar sesión: lo escribe y lo lee sólo el servidor.
create table public.consumer_requests (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique check (code ~ '^CB-[A-Z0-9]{6}$'),
  kind            text not null check (kind in ('arrepentimiento', 'baja')),
  email           text not null check (char_length(email) <= 254),
  full_name       text check (char_length(full_name) <= 120),
  message         text check (char_length(message) <= 1000),
  status          text not null default 'pendiente' check (status in ('pendiente', 'confirmada', 'resuelta')),
  -- Para la baja: hash del link que confirma que el pedido lo hizo el dueño del email.
  confirm_hash    text unique check (char_length(confirm_hash) <= 128),
  created_at      timestamptz not null default now(),
  confirmed_at    timestamptz,
  result          text check (char_length(result) <= 300)
);
create index consumer_requests_email_idx on public.consumer_requests (lower(email), created_at desc);
alter table public.consumer_requests enable row level security;
revoke all on public.consumer_requests from anon, authenticated;

-- Empresas donde ese email es dueño (para dar de baja sus planes). Sólo el servidor.
create or replace function public.owner_orgs_by_email(p_email text)
returns table (org_id uuid)
language sql stable security definer set search_path = public as $$
  select m.org_id
  from public.organization_members m
  join auth.users u on u.id = m.user_id
  where m.role = 'owner' and lower(u.email) = lower(p_email)
$$;
revoke execute on function public.owner_orgs_by_email(text) from public, anon, authenticated;
grant execute on function public.owner_orgs_by_email(text) to service_role;
