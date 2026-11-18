-- Endurecimiento pedido por el Security Advisor de Supabase (18/11).
-- Sólo agrega restricciones: no cambia datos ni la lógica de ninguna función.

-- 1) search_path fijo: nadie puede "colar" una función o tabla con el mismo nombre
--    en otro esquema para que la use una de estas funciones.
alter function public.set_updated_at() set search_path = public;
alter function public.role_rank(public.org_role) set search_path = public;
alter function public.protect_last_owner() set search_path = public;
alter function public.check_allocation() set search_path = public;
alter function public.protect_payment() set search_path = public;

-- 2) Funciones de trigger: sólo las dispara la base, nadie las llama por la API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.audit_customer_change() from public, anon, authenticated;
revoke execute on function public.audit_charge_change() from public, anon, authenticated;

-- 3) Funciones de la app: sólo para quien inició sesión (nunca anónimos).
revoke execute on function public.has_org_role(uuid, public.org_role) from public, anon;
revoke execute on function public.create_organization(text, text, text, text, text, text, text) from public, anon;
revoke execute on function public.record_payment(uuid, uuid, bigint, text, date, text, text, jsonb, text) from public, anon;
revoke execute on function public.set_digest_frequency(uuid, text) from public, anon;
grant execute on function public.has_org_role(uuid, public.org_role) to authenticated;
grant execute on function public.create_organization(text, text, text, text, text, text, text) to authenticated;
grant execute on function public.record_payment(uuid, uuid, bigint, text, date, text, text, jsonb, text) to authenticated;
grant execute on function public.set_digest_frequency(uuid, text) to authenticated;
