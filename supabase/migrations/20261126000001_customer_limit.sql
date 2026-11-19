-- Cobra+ · El tope de clientes activos del plan lo hace cumplir la base, no sólo la app.
-- Así nadie puede saltearlo escribiendo directo contra la API de Supabase.
-- Topes iguales a src/config/plans.ts (ACTIVE_CUSTOMERS). Sólo agrega: no cambia datos.

create or replace function public.org_active_customer_limit(p_org uuid)
returns integer language sql stable security definer set search_path = public as $$
  select case
    when s.plan is null then 5
    when s.status in ('active', 'trialing') or (s.current_period_end is not null and s.current_period_end > now()) then
      case s.plan when 'starter' then 30 when 'growth' then 200 when 'business' then 1000 else 5 end
    else 5
  end
  from (select 1) x
  left join public.subscriptions s on s.org_id = p_org
$$;
revoke all on function public.org_active_customer_limit(uuid) from public, anon, authenticated;

create or replace function public.enforce_customer_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_active integer;
begin
  if new.status <> 'active' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'active' then return new; end if;
  -- Serializa altas de la misma empresa para que dos envíos a la vez no pasen el tope.
  perform pg_advisory_xact_lock(hashtext('customers:' || new.org_id::text));
  select count(*) into v_active from public.customers where org_id = new.org_id and status = 'active';
  if v_active >= public.org_active_customer_limit(new.org_id) then
    raise exception 'customer_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.enforce_customer_limit() from public, anon, authenticated;

drop trigger if exists customers_enforce_limit on public.customers;
create trigger customers_enforce_limit before insert or update of status on public.customers
  for each row execute function public.enforce_customer_limit();
