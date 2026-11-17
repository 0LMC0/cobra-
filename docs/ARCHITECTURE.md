# Arquitectura de Cobra+

## 1. Decisiones fundamentales

| Decisión | Elección | Por qué |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript estricto** | Server Components y Server Actions dejan la lógica sensible en el servidor sin montar una API aparte. Además se despliega en Vercel sin configuración. |
| Estilos | **Tailwind CSS v4 + componentes propios al estilo shadcn** (`src/components/ui`) | Seguimos la filosofía shadcn (componentes copiados, nuestros y tipados) sin sumar Radix ni CLI mientras no hagan falta: menos dependencias y menos superficie. Si aparece un componente complejo (combobox, dialog accesible avanzado), se incorpora la primitiva de Radix puntual. |
| Íconos | **lucide-react** | Liviano, consistente y tree-shakeable. |
| Validación | **zod** | Un único esquema valida formularios, Server Actions, importación CSV y webhooks. |
| Auth + DB | **Supabase (Auth + Postgres + RLS + Storage)** | Postgres real con RLS como segunda barrera de aislamiento multi-tenant. |
| Jobs | **Vercel Cron → Route Handler protegido → cola en Postgres** | Para el volumen del MVP (cientos de empresas) una tabla con `FOR UPDATE SKIP LOCKED` alcanza y es auditable. Si el volumen crece, se migra el *runner* a un worker persistente (por ejemplo Inngest o un contenedor) sin cambiar el dominio. |
| Email | **Resend** detrás de la interfaz `MessageProvider` | API simple. Cambiar de proveedor o sumar WhatsApp oficial es implementar otro adaptador. |
| Facturación del SaaS | Interfaz **`BillingProvider`**; primer adaptador candidato: **Mercado Pago Suscripciones (preapproval)** | Ver §7. Ningún proveedor se da por disponible sin verificarlo. |
| Tests | **Vitest** (dominio, validaciones, autorización), **Playwright** (recorrido E2E, se suma en Fase 2 cuando haya flujo completo) | |

## 2. Capas

```
src/
  app/                 ← rutas (UI). Solo componen; no tienen reglas de negocio.
    (marketing)/       ← landing y páginas legales (públicas)
    (auth)/            ← ingresar, registro, recuperar, nueva-clave
    auth/              ← callbacks de Supabase (confirmación de email, OAuth)
    onboarding/        ← alta de la empresa
    app/               ← producto autenticado (/app, /app/clientes, …)
    api/               ← route handlers: cron, webhooks
  components/
    ui/                ← sistema de diseño (botón, input, tarjeta, badge…)
    marketing/ app/    ← componentes de cada superficie
  domain/              ← lógica pura y testeable: dinero, estados, fechas, permisos
  server/              ← acceso a datos y casos de uso (solo servidor)
    auth.ts            ← requireUser / requireOrg(minRole)
    actions/           ← Server Actions (validan con zod → autorizan → ejecutan)
  integrations/        ← adaptadores: email, billing, (futuro) mercadopago, whatsapp
  lib/supabase/        ← clientes de Supabase (browser, server, middleware, admin)
  config/              ← planes, sitio, constantes
supabase/migrations/   ← SQL versionado
tests/                 ← unit + integration (Vitest), e2e (Playwright)
docs/                  ← esta documentación
```

**Regla de dependencia:**
- `app → server → domain`.
- `integrations` solo se usa desde `server`.
- `domain` no importa nada de Next ni de Supabase.

## 3. Multi-tenancy

- Cada fila de negocio tiene `org_id`.
- **Primera barrera:** cada Server Action llama a `requireOrg('operator')`. Esa función resuelve la organización activa a partir de una cookie y **siempre la vuelve a validar contra `organization_members`**, así que nunca se confía en un id que venga del cliente.
- **Segunda barrera:** RLS en todas las tablas. Las consultas usan el cliente con la sesión del usuario, no la service key.
- La service key (`SUPABASE_SERVICE_ROLE_KEY`) se usa **solo** en el cron, en webhooks y en la consola interna. Vive en `src/lib/supabase/admin.ts`, que importa `server-only`.

## 4. Dinero

- Los importes se guardan como **`bigint` en unidades menores** (centavos) más `currency char(3)`. Nunca `float` ni `numeric` convertido a `number` sin control.
- En TypeScript el dominio usa enteros validados con `Number.isSafeInteger`. El tope es de alrededor de 9×10¹⁵ centavos.
- Parsear y formatear (`"150.000,50"` ↔ `15000050`) se resuelve en `src/domain/money.ts`, con tests.
- **Las monedas nunca se suman entre sí.** Los totales del dashboard se agrupan por moneda. Una conversión futura exigirá una tasa explícita, con fecha y fuente guardadas.

## 5. Estados de un cobro

Se guarda solo lo que no depende del tiempo:
- `charges.state`: `draft` | `open` | `cancelled`.
- `charges.amount_minor`.
- Los ajustes y las imputaciones de pagos.

El resto **se calcula** en un solo lugar, `src/domain/charge-status.ts`, que tiene su espejo en la vista SQL `charge_balances` y tests que verifican que ambos coincidan:

| Estado mostrado | Regla |
|---|---|
| Borrador | `state = draft` |
| Cancelado | `state = cancelled` |
| Pagado | saldo ≤ 0 |
| Parcialmente pagado | 0 < pagado < total, y no vencido |
| Vencido | saldo > 0 y vencimiento < hoy (en la zona horaria de la empresa) |
| Próximo a vencer | saldo > 0 y vencimiento dentro de 7 días (configurable) |
| Pendiente | el resto |

"Hoy" siempre se calcula en la zona horaria de la organización, nunca en la del servidor.

## 6. Automatizaciones (Fase 3)

**Modelo:** Disparador → Condición → Acción. En el MVP:
- **Disparadores:** días relativos al vencimiento (−5, −1, 0, +3, +7…).
- **Condición:** saldo > 0, cliente activo y contacto permitido.
- **Acción:** enviar email con plantilla o notificar al administrador.

**Ejecución:**
1. Un cron corre cada hora y llama a `POST /api/cron/reminders` con `CRON_SECRET`.
2. Para cada organización cuya hora local esté dentro de su ventana de envío, se calculan los recordatorios *debidos* y se insertan en `reminder_deliveries` con la clave única `(charge_id, rule_step_id)`. Esa clave es la **idempotencia**: un recordatorio nunca se duplica.
3. Se toman filas `queued` con `FOR UPDATE SKIP LOCKED`.
4. Justo antes de enviar **se vuelve a verificar el saldo**. Si ya está pagado, la fila pasa a `skipped`.
5. Cada intento queda registrado (`attempts`, `last_error`, `provider_message_id`). Los reintentos usan backoff exponencial hasta 3 veces.

## 7. Dos flujos de dinero que nunca se mezclan

| | A. Cobra+ cobra su suscripción | B. Los clientes de la empresa le pagan |
|---|---|---|
| Quién paga | La empresa usuaria | El cliente final de la empresa |
| Tablas | `billing_subscriptions`, `billing_events` | `charges`, `payments`, `payment_allocations` |
| Cuenta receptora | La cuenta de Cobra+ | **La cuenta de la empresa.** Cobra+ nunca recibe ni custodia esa plata |
| MVP | Trial + adaptador de proveedor | Registro manual + link de pago externo |

**Proveedor para A (pendiente de verificación):**
- **Mercado Pago Suscripciones** cobra en ARS desde Argentina y sería el candidato natural para clientes locales. Por eso el precio en USD se convertiría a ARS en el momento del alta, o se publicaría un precio en ARS.
- **Stripe** no abre cuentas para empresas argentinas sin una entidad en el exterior.
- **Paddle o Lemon Squeezy** (*merchant of record*) podrían servir para cobrar en USD. Hay que confirmar elegibilidad y costos.
- **Nada de esto está confirmado.** Por eso la interfaz `BillingProvider` existe desde el día 1 y el MVP arranca con trial más un adaptador `manual`, en el que el operador activa el plan desde la consola, hasta elegir proveedor.

## 8. Configuración y secretos

- Todas las variables están en `.env.example`.
- Las variables públicas llevan el prefijo `NEXT_PUBLIC_`. Nada secreto lleva ese prefijo.
- `src/config/env.ts` valida el entorno con zod al arrancar.

## 9. Instrumentación

Tabla `product_events (org_id, user_id, name, props, created_at)`, alimentada desde Server Actions. Eventos:

- `signed_up`
- `email_verified`
- `org_created`
- `onboarding_completed`
- `customer_created` (con `first: true` la primera vez)
- `charge_created` (`first`)
- `reminder_rule_enabled`
- `reminder_sent`
- `payment_recorded`
- `export_downloaded`
- `plan_viewed`
- `checkout_started`
- `subscription_activated`
- `subscription_cancelled`

Las visitas de la landing se miden con analítica sin cookies, a definir. No se inventan datos.
