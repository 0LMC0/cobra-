-- Cobra+ · Resumen por email para quien cobra.
-- Cada miembro elige cada cuánto lo recibe; por defecto, cada 3 días.
alter table public.organization_members
  add column digest_frequency text not null default 'every_3_days'
    check (digest_frequency in ('daily', 'every_3_days', 'weekly', 'off')),
  add column digest_last_sent_on date;

-- La política de members_update es sólo para dueños; para la preferencia
-- propia hay una función que toca únicamente la fila de quien la llama.
create or replace function public.set_digest_frequency(p_org uuid, p_frequency text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  update public.organization_members
     set digest_frequency = p_frequency
   where org_id = p_org and user_id = auth.uid();
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;
revoke all on function public.set_digest_frequency(uuid, text) from public, anon;
grant execute on function public.set_digest_frequency(uuid, text) to authenticated;
