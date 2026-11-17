-- Cobra+ · Historial del cliente.
-- La base registra sola cada cambio de clientes y cobros en audit_logs, con
-- triggers: ningún camino de la app (ni el link de baja) puede saltearlo.
-- Sólo agrega (funciones, triggers y una política): no borra ni cambia nada existente.

-- ─────────────────────────────────────────────────────────────── clientes
create or replace function public.audit_customer_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_action text;
  v_before jsonb := '{}';
  v_after  jsonb := '{}';
  v_field  text;
begin
  if new.status is distinct from old.status then
    v_action := case when new.status = 'archived' then 'customer.archived' else 'customer.restored' end;
  elsif new.contact_opt_out is distinct from old.contact_opt_out then
    v_action := case when new.contact_opt_out then 'customer.opted_out' else 'customer.opted_in' end;
  elsif new.reminders_paused is distinct from old.reminders_paused then
    v_action := case when new.reminders_paused then 'customer.paused' else 'customer.resumed' end;
  else
    v_action := 'customer.updated';
  end if;

  foreach v_field in array array['name', 'contact_name', 'email', 'phone', 'whatsapp_ok', 'tax_id', 'notes'] loop
    if (to_jsonb(new) -> v_field) is distinct from (to_jsonb(old) -> v_field) then
      v_before := v_before || jsonb_build_object(v_field, to_jsonb(old) -> v_field);
      v_after  := v_after  || jsonb_build_object(v_field, to_jsonb(new) -> v_field);
    end if;
  end loop;

  -- Guardar sin cambiar nada no deja rastro.
  if v_action = 'customer.updated' and v_after = '{}'::jsonb then
    return new;
  end if;

  insert into public.audit_logs (org_id, actor_id, action, entity_type, entity_id, before, after)
  values (new.org_id, auth.uid(), v_action, 'customer', new.id, nullif(v_before, '{}'::jsonb), nullif(v_after, '{}'::jsonb));
  return new;
end $$;
revoke all on function public.audit_customer_change() from public, anon, authenticated;

create trigger customers_audit after update on public.customers
  for each row execute function public.audit_customer_change();

-- ─────────────────────────────────────────────────────────────── cobros
create or replace function public.audit_charge_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_action text;
  v_before jsonb;
  v_after  jsonb;
begin
  if new.promised_for is distinct from old.promised_for then
    v_action := case when new.promised_for is null then 'charge.promise_cleared' else 'charge.promise_set' end;
    v_before := jsonb_build_object('promised_for', old.promised_for);
    v_after  := jsonb_build_object('promised_for', new.promised_for);
  elsif new.state is distinct from old.state then
    v_action := case new.state when 'cancelled' then 'charge.cancelled' when 'open' then 'charge.reopened' else 'charge.drafted' end;
    v_before := jsonb_build_object('state', old.state);
    v_after  := jsonb_build_object('state', new.state);
  elsif new.amount_minor is distinct from old.amount_minor
     or new.due_date is distinct from old.due_date
     or new.concept is distinct from old.concept then
    v_action := 'charge.updated';
    v_before := jsonb_build_object('amount_minor', old.amount_minor, 'due_date', old.due_date, 'concept', old.concept);
    v_after  := jsonb_build_object('amount_minor', new.amount_minor, 'due_date', new.due_date, 'concept', new.concept);
  else
    return new;
  end if;

  insert into public.audit_logs (org_id, actor_id, action, entity_type, entity_id, before, after)
  values (new.org_id, auth.uid(), v_action, 'charge', new.id, v_before, v_after);
  return new;
end $$;
revoke all on function public.audit_charge_change() from public, anon, authenticated;

create trigger charges_audit after update on public.charges
  for each row execute function public.audit_charge_change();

-- ─────────────────────────────────────────────────────────────── lectura
-- El historial de clientes, cobros y pagos lo ve todo el equipo; el resto
-- de la auditoría (empresa, miembros, roles) sigue siendo sólo de administración
-- (política audit_select, que no se toca). Las políticas se suman con OR.
create policy audit_select_history on public.audit_logs for select to authenticated
  using (entity_type in ('customer', 'charge', 'payment') and public.has_org_role(org_id, 'viewer'));
