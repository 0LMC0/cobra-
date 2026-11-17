-- COBRA · Fase 1 · Fundaciones: perfiles, organizaciones, miembros, roles,
-- invitaciones, auditoría e instrumentación. Todas las tablas con RLS.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ─────────────────────────────────────────────────────────────── utilidades
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────── roles
create type public.org_role as enum ('viewer', 'operator', 'admin', 'owner');

create or replace function public.role_rank(r public.org_role)
returns int language sql immutable as $$
  select case r when 'viewer' then 1 when 'operator' then 2 when 'admin' then 3 when 'owner' then 4 end
$$;

-- ─────────────────────────────────────────────────────────────── profiles
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(left(new.raw_user_meta_data ->> 'full_name', 120), ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────── organizations
create table public.organizations (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (char_length(name) between 2 and 120),
  industry           text check (char_length(industry) <= 60),
  country            char(2) not null default 'AR',
  currency           char(3) not null default 'ARS' check (currency ~ '^[A-Z]{3}$'),
  timezone           text not null default 'America/Argentina/Buenos_Aires',
  contact_email      citext,
  contact_phone      text check (char_length(contact_phone) <= 40),
  billing_frequency  text not null default 'monthly'
                     check (billing_frequency in ('weekly','biweekly','monthly','quarterly','semiannual','annual')),
  onboarding_step    text not null default 'company'
                     check (onboarding_step in ('company','first_customer','first_charge','reminders','done')),
  onboarded_at       timestamptz,
  is_demo            boolean not null default false,
  created_by         uuid references auth.users on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_members (
  org_id      uuid not null references public.organizations on delete cascade,
  user_id     uuid not null references auth.users on delete cascade,
  role        public.org_role not null,
  created_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index organization_members_user_idx on public.organization_members (user_id);

-- Base de todas las políticas. security definer para no recursar sobre la RLS
-- de organization_members.
create or replace function public.has_org_role(p_org uuid, p_min public.org_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and public.role_rank(m.role) >= public.role_rank(p_min)
  )
$$;
revoke all on function public.has_org_role(uuid, public.org_role) from public, anon;
grant execute on function public.has_org_role(uuid, public.org_role) to authenticated;

-- ─────────────────────────────────────────────────────────────── invitaciones
create table public.organization_invitations (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations on delete cascade,
  email        citext not null,
  role         public.org_role not null check (role <> 'owner'),
  token_hash   text not null unique,
  invited_by   uuid references auth.users on delete set null,
  expires_at   timestamptz not null default now() + interval '7 days',
  accepted_at  timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index organization_invitations_org_idx on public.organization_invitations (org_id);

-- ─────────────────────────────────────────────────────────────── auditoría
create table public.audit_logs (
  id           bigint generated always as identity primary key,
  org_id       uuid not null references public.organizations on delete cascade,
  actor_id     uuid references auth.users on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  before       jsonb,
  after        jsonb,
  created_at   timestamptz not null default now()
);
create index audit_logs_org_created_idx on public.audit_logs (org_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

-- ─────────────────────────────────────────────────────────────── instrumentación
create table public.product_events (
  id          bigint generated always as identity primary key,
  org_id      uuid references public.organizations on delete cascade,
  user_id     uuid references auth.users on delete set null,
  name        text not null check (name ~ '^[a-z_]{3,48}$'),
  props       jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index product_events_name_created_idx on public.product_events (name, created_at desc);

-- ─────────────────────────────────────────────────────────────── RPC
-- Crea la empresa y la membresía owner en una sola transacción.
create or replace function public.create_organization(
  p_name text,
  p_industry text,
  p_currency text,
  p_timezone text,
  p_contact_email text,
  p_contact_phone text,
  p_billing_frequency text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_org uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  -- Un usuario puede crear hasta 5 empresas (anti-abuso).
  if (select count(*) from public.organization_members where user_id = v_uid and role = 'owner') >= 5 then
    raise exception 'org_limit_reached' using errcode = 'P0001';
  end if;

  insert into public.organizations
    (name, industry, currency, timezone, contact_email, contact_phone, billing_frequency, onboarding_step, created_by)
  values
    (trim(p_name), nullif(trim(p_industry), ''), upper(p_currency), p_timezone,
     nullif(trim(p_contact_email), ''), nullif(trim(p_contact_phone), ''), p_billing_frequency,
     'first_customer', v_uid)
  returning id into v_org;

  insert into public.organization_members (org_id, user_id, role) values (v_org, v_uid, 'owner');

  insert into public.audit_logs (org_id, actor_id, action, entity_type, entity_id, after)
  values (v_org, v_uid, 'organization.created', 'organization', v_org,
          jsonb_build_object('name', trim(p_name)));

  insert into public.product_events (org_id, user_id, name) values (v_org, v_uid, 'org_created');
  return v_org;
end $$;
revoke all on function public.create_organization(text,text,text,text,text,text,text) from public, anon;
grant execute on function public.create_organization(text,text,text,text,text,text,text) to authenticated;

-- ─────────────────────────────────────────────────────────────── RLS
alter table public.profiles                  enable row level security;
alter table public.organizations             enable row level security;
alter table public.organization_members      enable row level security;
alter table public.organization_invitations  enable row level security;
alter table public.audit_logs                enable row level security;
alter table public.product_events            enable row level security;

-- profiles: cada uno el suyo, y los perfiles de quienes comparten empresa.
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid() or exists (
    select 1 from public.organization_members a
    join public.organization_members b on a.org_id = b.org_id
    where a.user_id = auth.uid() and b.user_id = profiles.id
  )
);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- organizations: la crea el RPC; leen los miembros; edita admin+; borra owner.
create policy organizations_select on public.organizations for select to authenticated
  using (public.has_org_role(id, 'viewer'));
create policy organizations_update on public.organizations for update to authenticated
  using (public.has_org_role(id, 'admin')) with check (public.has_org_role(id, 'admin'));
create policy organizations_delete on public.organizations for delete to authenticated
  using (public.has_org_role(id, 'owner'));

-- members: leen los miembros; gestionan admin+ (sin tocar owners salvo un owner).
create policy members_select on public.organization_members for select to authenticated
  using (public.has_org_role(org_id, 'viewer'));
create policy members_insert on public.organization_members for insert to authenticated
  with check (
    public.has_org_role(org_id, 'owner')
    or (public.has_org_role(org_id, 'admin') and role <> 'owner')
  );
create policy members_update on public.organization_members for update to authenticated
  using (public.has_org_role(org_id, 'owner'))
  with check (public.has_org_role(org_id, 'owner'));
create policy members_delete on public.organization_members for delete to authenticated
  using (
    public.has_org_role(org_id, 'owner')
    or (public.has_org_role(org_id, 'admin') and role <> 'owner')
    or user_id = auth.uid() and role <> 'owner'
  );

-- invitaciones: admin+.
create policy invitations_all on public.organization_invitations for all to authenticated
  using (public.has_org_role(org_id, 'admin')) with check (public.has_org_role(org_id, 'admin'));

-- auditoría: lectura admin+, inserción de miembros operator+, nunca update/delete.
create policy audit_select on public.audit_logs for select to authenticated
  using (public.has_org_role(org_id, 'admin'));
create policy audit_insert on public.audit_logs for insert to authenticated
  with check (public.has_org_role(org_id, 'operator') and actor_id = auth.uid());

-- product_events: sólo inserción propia; se leen con la service key.
create policy events_insert on public.product_events for insert to authenticated
  with check (user_id = auth.uid() and (org_id is null or public.has_org_role(org_id, 'viewer')));

-- El último owner no puede irse ni ser degradado.
create or replace function public.protect_last_owner()
returns trigger language plpgsql as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if (select count(*) from public.organization_members
        where org_id = old.org_id and role = 'owner' and user_id <> old.user_id) = 0
       and exists (select 1 from public.organizations where id = old.org_id) then
      raise exception 'last_owner' using errcode = 'P0001';
    end if;
  end if;
  return coalesce(new, old);
end $$;
create trigger members_protect_last_owner before update or delete on public.organization_members
  for each row execute function public.protect_last_owner();
