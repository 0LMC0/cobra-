-- Cobra+ · Fase 2 · Núcleo: clientes, abonos, cobros, pagos e imputaciones.
-- Plata siempre en unidades menores (centavos) y con su moneda; nunca se mezclan.
-- Cada fila lleva org_id y las referencias entre tablas incluyen org_id, así
-- es imposible apuntar a un cliente o cobro de otra empresa.

-- ─────────────────────────────────────────────────────────────── clientes
create table public.customers (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations on delete cascade,
  name              text not null check (char_length(trim(name)) between 1 and 160),
  contact_name      text check (char_length(contact_name) <= 120),
  email             citext check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone             text check (char_length(phone) <= 40),
  -- WhatsApp: el número convertido (sólo dígitos) y si el cliente aceptó mensajes por ahí.
  whatsapp_number   text check (whatsapp_number is null or whatsapp_number ~ '^[0-9]{8,15}$'),
  whatsapp_ok       boolean not null default false,
  tax_id            text check (char_length(tax_id) <= 20),
  notes             text check (char_length(notes) <= 2000),
  status            text not null default 'active' check (status in ('active', 'archived')),
  -- El cliente pidió no recibir avisos: no se le escribe por ningún canal.
  contact_opt_out   boolean not null default false,
  reminders_paused  boolean not null default false,
  created_by        uuid references auth.users on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (org_id, id)
);
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create unique index customers_active_email_uniq on public.customers (org_id, email)
  where status = 'active' and email is not null;
create unique index customers_tax_id_uniq on public.customers (org_id, tax_id)
  where tax_id is not null;
create index customers_org_name_idx on public.customers (org_id, lower(name));

-- ─────────────────────────────────────────────────────────────── abonos
create table public.agreements (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations on delete cascade,
  customer_id       uuid not null,
  name              text not null check (char_length(trim(name)) between 1 and 160),
  amount_minor      bigint not null check (amount_minor > 0),
  currency          char(3) not null check (currency ~ '^[A-Z]{3}$'),
  frequency         text not null check (frequency in ('weekly','biweekly','monthly','quarterly','semiannual','annual')),
  start_date        date not null,
  end_date          date check (end_date is null or end_date >= start_date),
  next_charge_date  date,
  status            text not null default 'active' check (status in ('active', 'paused', 'ended')),
  created_by        uuid references auth.users on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (org_id, id),
  foreign key (org_id, customer_id) references public.customers (org_id, id) on delete cascade
);
create trigger agreements_updated_at before update on public.agreements
  for each row execute function public.set_updated_at();
create index agreements_due_idx on public.agreements (org_id, status, next_charge_date);

-- ─────────────────────────────────────────────────────────────── cobros
create table public.charges (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations on delete cascade,
  customer_id       uuid not null,
  agreement_id      uuid,
  concept           text not null check (char_length(trim(concept)) between 1 and 200),
  amount_minor      bigint not null check (amount_minor > 0),
  currency          char(3) not null check (currency ~ '^[A-Z]{3}$'),
  due_date          date not null,
  -- El estado de cobranza (vencido, parcial, pagado…) se calcula; acá sólo lo editorial.
  state             text not null default 'open' check (state in ('draft', 'open', 'cancelled')),
  period_start      date,
  -- Promesa de pago: hasta esa fecha no se le escribe.
  promised_for      date,
  promised_on       date,
  created_by        uuid references auth.users on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (org_id, id),
  -- Un abono nunca genera dos veces el mismo período.
  unique (agreement_id, period_start),
  check (promised_for is null or promised_on is not null),
  foreign key (org_id, customer_id) references public.customers (org_id, id) on delete cascade,
  foreign key (org_id, agreement_id) references public.agreements (org_id, id) on delete set null (agreement_id)
);
create trigger charges_updated_at before update on public.charges
  for each row execute function public.set_updated_at();
create index charges_org_due_idx on public.charges (org_id, state, due_date);
create index charges_customer_idx on public.charges (org_id, customer_id);

-- ─────────────────────────────────────────────────────────────── pagos
create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations on delete cascade,
  customer_id       uuid not null,
  amount_minor      bigint not null check (amount_minor > 0),
  currency          char(3) not null check (currency ~ '^[A-Z]{3}$'),
  paid_on           date not null,
  method            text not null default 'transfer'
                    check (method in ('transfer', 'cash', 'card', 'mercadopago', 'check', 'other')),
  reference         text check (char_length(reference) <= 120),
  status            text not null default 'confirmed' check (status in ('confirmed', 'voided')),
  voided_reason     text check (char_length(voided_reason) <= 300),
  idempotency_key   text check (char_length(idempotency_key) <= 80),
  created_by        uuid references auth.users on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, idempotency_key),
  check (status <> 'voided' or voided_reason is not null),
  foreign key (org_id, customer_id) references public.customers (org_id, id) on delete cascade
);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
create index payments_customer_idx on public.payments (org_id, customer_id, paid_on desc);

-- ─────────────────────────────────────────────────────────────── imputaciones
-- Qué parte de cada pago cancela qué cobro (un pago puede cubrir varios).
create table public.payment_allocations (
  org_id        uuid not null,
  payment_id    uuid not null,
  charge_id     uuid not null,
  amount_minor  bigint not null check (amount_minor > 0),
  created_at    timestamptz not null default now(),
  primary key (payment_id, charge_id),
  foreign key (org_id, payment_id) references public.payments (org_id, id) on delete cascade,
  foreign key (org_id, charge_id) references public.charges (org_id, id) on delete cascade
);
create index payment_allocations_charge_idx on public.payment_allocations (charge_id);

-- Misma moneda, sin pasarse del pago ni del saldo del cobro, y el cliente tiene que ser el mismo.
create or replace function public.check_allocation()
returns trigger language plpgsql as $$
declare
  p record;
  c record;
  allocated_from_payment bigint;
  paid_on_charge bigint;
begin
  select * into p from public.payments where id = new.payment_id;
  select * into c from public.charges where id = new.charge_id;
  if p.currency <> c.currency then
    raise exception 'currency_mismatch' using errcode = 'P0001';
  end if;
  if p.customer_id <> c.customer_id then
    raise exception 'customer_mismatch' using errcode = 'P0001';
  end if;
  if c.state = 'cancelled' then
    raise exception 'charge_cancelled' using errcode = 'P0001';
  end if;
  select coalesce(sum(amount_minor), 0) into allocated_from_payment
    from public.payment_allocations where payment_id = new.payment_id and charge_id <> new.charge_id;
  if allocated_from_payment + new.amount_minor > p.amount_minor then
    raise exception 'allocation_exceeds_payment' using errcode = 'P0001';
  end if;
  select coalesce(sum(a.amount_minor), 0) into paid_on_charge
    from public.payment_allocations a join public.payments pp on pp.id = a.payment_id
    where a.charge_id = new.charge_id and pp.status = 'confirmed' and a.payment_id <> new.payment_id;
  if paid_on_charge + new.amount_minor > c.amount_minor then
    raise exception 'allocation_exceeds_charge' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger payment_allocations_check before insert or update on public.payment_allocations
  for each row execute function public.check_allocation();

-- ─────────────────────────────────────────────────────────────── saldos
-- Respeta la RLS de quien consulta (security_invoker).
create view public.charge_balances with (security_invoker = true) as
select
  c.id as charge_id,
  c.org_id,
  c.customer_id,
  c.currency,
  c.amount_minor,
  coalesce(sum(a.amount_minor) filter (where p.status = 'confirmed'), 0)::bigint as paid_minor,
  (c.amount_minor - coalesce(sum(a.amount_minor) filter (where p.status = 'confirmed'), 0))::bigint as balance_minor
from public.charges c
left join public.payment_allocations a on a.charge_id = c.id
left join public.payments p on p.id = a.payment_id
group by c.id;

-- ─────────────────────────────────────────────────────────────── registrar un pago
-- Pago + imputaciones + auditoría en una sola transacción. Idempotente: repetir
-- la misma clave devuelve el pago ya creado en lugar de duplicarlo.
create or replace function public.record_payment(
  p_org uuid,
  p_customer uuid,
  p_amount_minor bigint,
  p_currency text,
  p_paid_on date,
  p_method text,
  p_reference text,
  p_allocations jsonb,          -- [{"charge_id": "...", "amount_minor": 123}]
  p_idempotency_key text
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_payment uuid;
  v_item jsonb;
begin
  if not public.has_org_role(p_org, 'operator') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_idempotency_key is not null then
    select id into v_payment from public.payments where org_id = p_org and idempotency_key = p_idempotency_key;
    if v_payment is not null then return v_payment; end if;
  end if;

  insert into public.payments (org_id, customer_id, amount_minor, currency, paid_on, method, reference, idempotency_key, created_by)
  values (p_org, p_customer, p_amount_minor, upper(p_currency), p_paid_on, coalesce(p_method, 'transfer'),
          nullif(trim(p_reference), ''), p_idempotency_key, v_uid)
  returning id into v_payment;

  for v_item in select * from jsonb_array_elements(coalesce(p_allocations, '[]'::jsonb)) loop
    insert into public.payment_allocations (org_id, payment_id, charge_id, amount_minor)
    values (p_org, v_payment, (v_item ->> 'charge_id')::uuid, (v_item ->> 'amount_minor')::bigint);
  end loop;

  insert into public.audit_logs (org_id, actor_id, action, entity_type, entity_id, after)
  values (p_org, v_uid, 'payment.recorded', 'payment', v_payment,
          jsonb_build_object('amount_minor', p_amount_minor, 'currency', upper(p_currency), 'allocations', coalesce(p_allocations, '[]'::jsonb)));
  return v_payment;
end $$;
revoke all on function public.record_payment(uuid, uuid, bigint, text, date, text, text, jsonb, text) from public, anon;
grant execute on function public.record_payment(uuid, uuid, bigint, text, date, text, text, jsonb, text) to authenticated;

-- ─────────────────────────────────────────────────────────────── RLS
alter table public.customers            enable row level security;
alter table public.agreements           enable row level security;
alter table public.charges              enable row level security;
alter table public.payments             enable row level security;
alter table public.payment_allocations  enable row level security;

-- Leer: cualquier miembro. Crear y editar: operación o más. Borrar: administración o más
-- (en el uso normal se archiva o se anula, no se borra).
do $$
declare t text;
begin
  foreach t in array array['customers', 'agreements', 'charges', 'payments'] loop
    execute format('create policy %1$s_select on public.%1$s for select to authenticated using (public.has_org_role(org_id, ''viewer''))', t);
    execute format('create policy %1$s_insert on public.%1$s for insert to authenticated with check (public.has_org_role(org_id, ''operator''))', t);
    execute format('create policy %1$s_update on public.%1$s for update to authenticated using (public.has_org_role(org_id, ''operator'')) with check (public.has_org_role(org_id, ''operator''))', t);
    execute format('create policy %1$s_delete on public.%1$s for delete to authenticated using (public.has_org_role(org_id, ''admin''))', t);
  end loop;
end $$;

create policy allocations_select on public.payment_allocations for select to authenticated
  using (public.has_org_role(org_id, 'viewer'));
create policy allocations_insert on public.payment_allocations for insert to authenticated
  with check (public.has_org_role(org_id, 'operator'));
create policy allocations_delete on public.payment_allocations for delete to authenticated
  using (public.has_org_role(org_id, 'admin'));

-- Un pago confirmado no se edita: sólo se anula (con motivo). Así la plata queda trazable.
create or replace function public.protect_payment()
returns trigger language plpgsql as $$
begin
  if old.status = 'voided' then
    raise exception 'payment_voided' using errcode = 'P0001';
  end if;
  if new.amount_minor <> old.amount_minor or new.currency <> old.currency
     or new.customer_id <> old.customer_id or new.org_id <> old.org_id then
    raise exception 'payment_immutable' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger payments_protect before update on public.payments
  for each row execute function public.protect_payment();
