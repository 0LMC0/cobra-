# Base de datos de COBRA

Postgres en Supabase. Las migraciones versionadas viven en `supabase/migrations/` y se aplican en orden.

## Vocabulario (evita ambigüedades)

| Término de negocio | Tabla | Qué es |
|---|---|---|
| Suscripción **de COBRA** | `billing_subscriptions` | Lo que la empresa le paga a COBRA. |
| **Abono** | `agreements` | Contrato recurrente entre la empresa y su cliente. |
| **Cobro** (obligación) | `charges` | Un importe que alguien debe en una fecha. No implica que se haya pagado. |
| **Pago** (transacción) | `payments` | Dinero que efectivamente entró, según quien lo registró o verificó. |
| **Imputación** | `payment_allocations` | Qué parte de un pago cancela qué cobro. |

## Convenciones

- PK `uuid default gen_random_uuid()`. `audit_logs` usa `bigint identity`.
- `created_at` y `updated_at timestamptz`. `updated_at` lo mantiene un trigger.
- Dinero: `*_minor bigint` más `currency char(3)`, con `check` de no negatividad donde corresponde.
- Fechas de vencimiento: `date`, sin hora. "Hoy" se evalúa en `organizations.timezone`.
- Toda tabla de negocio tiene `org_id uuid not null references organizations on delete cascade` y un índice que empieza por `org_id`.
- RLS activado en **todas** las tablas, con políticas explícitas por operación.

## Roles

Enum `org_role`: `owner > admin > operator > viewer`.

La función `public.has_org_role(org uuid, min_role org_role) returns boolean` es `security definer` y `stable`. Es la base de todas las políticas.

| Acción | Viewer | Operator | Admin | Owner |
|---|---|---|---|---|
| Ver datos | ✓ | ✓ | ✓ | ✓ |
| Crear/editar clientes, cobros, pagos | | ✓ | ✓ | ✓ |
| Anular pagos, cancelar cobros | | | ✓ | ✓ |
| Plantillas, reglas y reportes completos | | | ✓ | ✓ |
| Invitar o quitar miembros | | | ✓ (no owners) | ✓ |
| Facturación, borrar empresa | | | | ✓ |

## Tablas por fase

### Fase 1 — Fundaciones (`0001_foundations.sql`)
- `profiles`: 1:1 con `auth.users`, con nombre visible. Se crea por trigger al registrarse.
- `organizations`: nombre, rubro, país, moneda, zona horaria, contacto, frecuencia habitual, `onboarding_step`, `onboarded_at`, `is_demo`.
- `organization_members (org_id, user_id, role)`, con PK compuesta.
- `organization_invitations`: email, rol, `token_hash` (nunca el token en claro), vencimiento y aceptación.
- `audit_logs`: solo inserción. No hay política de update ni delete, ni siquiera para el owner.
- `product_events`: instrumentación.
- RPC `create_organization(...)`: crea la empresa y la membresía *owner* en una transacción.

### Fase 2 — Núcleo de cobranzas
- `customers`:
  - Datos: nombre o razón social, email, teléfono, CUIT opcional, dirección, organización relacionada, moneda preferida, notas, `status` (`active` | `archived`) y `contact_opt_out`.
  - Índice único parcial `(org_id, lower(email)) where status='active' and email is not null` para prevenir duplicados.
  - Índice único parcial por `(org_id, tax_id)`.
- `agreements`: nombre, `price_minor`, `currency`, `frequency` (`weekly` | `biweekly` | `monthly` | `quarterly` | `semiannual` | `annual`), `start_date`, `end_date`, `next_charge_date`, `status` (`active` | `paused` | `ended`) y `due_day_offset`.
- `agreement_price_changes`: precio anterior y nuevo, fecha de vigencia, autor y motivo. Los ajustes programados son filas con `effective_on` futura.
- `charges`:
  - Campos: `customer_id`, `agreement_id` (nullable para cobros únicos), concepto, `amount_minor`, `currency`, `due_date`, `state` (`draft` | `open` | `cancelled`), `period_start`, `period_end` y `payment_link_url`.
  - Unique `(agreement_id, period_start)`, para que un abono nunca genere dos veces el mismo período.
- `charge_adjustments`: `kind` (`discount` | `surcharge` | `credit` | `reschedule`), `amount_minor` con signo, motivo y autor. Los cambios de vencimiento se registran como `reschedule` con la fecha anterior y la nueva.
- `payments`:
  - Campos: `customer_id`, `amount_minor`, `currency`, `paid_on`, método, referencia, `status` (`pending_verification` | `confirmed` | `voided`), `confirmed_by`, `confirmed_at` y `idempotency_key` (único por org).
- `payment_allocations`:
  - Campos: `(payment_id, charge_id, amount_minor > 0)`.
  - Un trigger impide asignar más que el monto del pago y exige que la moneda coincida con la del cobro.
- `attachments`: archivos en Supabase Storage, en un bucket privado con la ruta `org_id/...`.
- Vista `charge_balances`: total ajustado, pagado (solo `confirmed`), saldo. Es `security_invoker` para respetar RLS.

### Fase 3 — Automatizaciones
- `message_templates`: clave, asunto y cuerpo con variables `{{cliente}}`, `{{empresa}}`, `{{importe}}`, `{{vencimiento}}`, `{{concepto}}` y `{{link_pago}}`.
- `reminder_rules`: secuencia por org y `enabled`.
- `reminder_rule_steps`:
  - `offset_days`, `template_id` y `action` (`email_customer` | `notify_admin`).
- `reminder_deliveries`:
  - Unique `(charge_id, step_id)`. Esa unicidad es la idempotencia.
  - `status` (`queued` | `sent` | `skipped` | `failed`), `attempts`, `next_attempt_at`, `last_error` y `provider_message_id`.
- Campos en `organization_settings`: ventana horaria de envío, días para "próximo a vencer" y remitente.

### Fase 4 — Monetización
- `billing_subscriptions`: una por org, con `plan`, `interval`, `status` (`trialing` | `active` | `past_due` | `cancelled` | `expired`), `trial_ends_at`, `current_period_end`, `cancel_at_period_end`, `provider` y `provider_ref`.
- `billing_events`: unique `(provider, provider_event_id)`, más `payload` y `processed_at`. Sirve para que el webhook sea idempotente.
- Los **límites** se verifican en el servidor con funciones SQL (`org_active_customer_count`) más `src/config/plans.ts`.

## Integridad financiera

- No hay `delete` sobre `payments`, `charges` ni `charge_adjustments` para ningún rol. Se anula (`voided` o `cancelled`) y queda auditado.
- Los triggers de auditoría escriben en `audit_logs` el `before` y el `after` de cada cambio en `charges`, `payments`, `agreements` y `agreement_price_changes`.
- `payments.idempotency_key` evita el doble registro por doble clic o reintento de red.
