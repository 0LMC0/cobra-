# Roadmap de Cobra+

Estado al **15/11/2026**.

**Leyenda:**
- ✅ hecho y verificado
- 🟡 hecho pero sin verificar contra un Supabase real
- ⬜ pendiente

## Fase 0 — Arquitectura ✅
- ✅ Inspección: proyecto nuevo, separado de PrimerosPrecios. No reutiliza código ni base de datos.
- ✅ Documentos: PRD, ARCHITECTURE, DATABASE, SECURITY, DESIGN_SYSTEM, SETUP y este ROADMAP.
- ✅ Decisiones de stack, modelo de dinero y estados calculados.
- ✅ Separación entre la facturación del SaaS y los cobros de clientes.

## Fase 1 — Fundaciones (en curso)

| Ítem | Estado | Notas |
|---|---|---|
| Proyecto base (Next 15, TS estricto, Tailwind 4) | ✅ | `npm run check` pasa |
| Sistema de diseño (tokens claro/oscuro, botón, campos, badge, alert, empty state) | ✅ | |
| Dominio: dinero, fechas, estados de cobro, roles, planes | ✅ | 40 tests unitarios |
| Migración `foundations`: perfiles, orgs, miembros, roles, invitaciones, auditoría, eventos y RLS | 🟡 | Falta aplicarla en el proyecto Supabase |
| Auth: registro, verificación de email, login, recupero, nueva clave, logout | 🟡 | Compila y muestra los estados sin configuración. Falta el recorrido real |
| Middleware y protección de `/app` y `/onboarding` | ✅ | Sin sesión redirige a `/ingresar` (verificado en el navegador) |
| Onboarding paso 1 (empresa) con RPC atómica | 🟡 | |
| Shell de la app (sidebar, barra mobile, cambio de empresa, modo demo identificado) | ✅ | Las secciones no construidas dicen "Pronto" y no tienen link |
| Configuración: datos de la empresa y equipo (lectura real) | 🟡 | |
| Landing completa, legales en borrador, SEO, robots y sitemap | ✅ | Sin indexar hasta el lanzamiento |
| Encabezados de seguridad (CSP, frame-ancestors y otros) | ✅ | |
| Tests de autorización RLS contra la base (`tests/authz`) | ⬜ | Requiere el proyecto Supabase |

**Para cerrar la Fase 1:**
1. Crear el proyecto Supabase.
2. Aplicar la migración.
3. Recorrer registro → email → onboarding → `/app` → logout → login.
4. Escribir los tests de aislamiento entre organizaciones.

## Fase 2 — Producto principal 🟡
- 🟡 **Pantallas de clientes y cobros** (`/app/clientes`, `/app/clientes/nuevo`, `/app/clientes/[id]`): lista con lo que debe cada uno, alta con celular de WhatsApp, ficha con cobros, "Pagó" (total o parcial, sin duplicar con doble clic) y botón de WhatsApp. Validaciones en `src/domain/forms.ts` (14 tests). Se ven con datos de ejemplo en `/vista-previa/clientes` (sólo en desarrollo). Falta probarlas contra Supabase.
- ✅ **Migración del núcleo** (`20261117000001_core.sql`, 23 tests en `tests/db/core.test.ts`): clientes (con celular de WhatsApp y permiso), abonos, cobros (con promesa de pago), pagos, imputaciones, vista `charge_balances` y RPC `record_payment` idempotente. Referencias con `org_id` para que nada apunte a otra empresa; pagos inmutables que sólo se anulan con motivo; nunca se mezclan monedas ni se cobra de más.
- Migración: `customers`, `agreements`, `agreement_price_changes`, `charges`, `charge_adjustments`, `payments`, `payment_allocations`, `attachments`, vista `charge_balances`, triggers de auditoría.
- Clientes: CRUD, archivo, búsqueda, filtros, deduplicación, CSV in/out, ficha con línea de tiempo.
- Abonos y generación idempotente de cobros por período.
- Cobros únicos, descuentos, recargos, reprogramación y cancelación.
- Registro manual de pagos parciales y totales con imputación y comprobante.
- Dashboard real: KPIs por moneda, gráficos y "Necesitan tu atención".
- Onboarding pasos 2 y 3.
- Playwright: recorrido del MVP hasta el paso 7.

## Fase 3 — Automatización ⬜
- 🟡 **Reglas de avisos** (`src/domain/reminders.ts`, 14 tests): secuencia por defecto −5, −1, 0, +3 y +7, sólo días hábiles y sin feriados, promesa de pago, corte al pagar, pausa, baja y pase a quien cobra. Falta conectarlas a la base y al envío.
- **Promesa de pago:** anotar la fecha prometida, silencio hasta ese día y un solo seguimiento.
- 🟡 **WhatsApp con un toque** (`src/domain/whatsapp.ts`, 21 tests; botón en `src/components/app/whatsapp-button.tsx`; lista "Para avisar hoy" en el inicio): convierte el celular argentino al formato de WhatsApp (saca el 0 y el 15), arma el mensaje según el momento (antes, vence hoy, atrasado, último aviso, promesa) y abre el chat listo para enviar. Falta conectarlo a los datos reales (Fase 2) y registrar cuándo se usó.
- **WhatsApp automático (etapa 2):** API oficial de WhatsApp Business con un número de Cobra+ que escribe en nombre de cada empresa. Requiere cuenta comercial de Meta verificada, número propio, plantillas aprobadas y permiso del cliente. Costo por mensaje a confirmar en la tabla oficial de Meta. Después, opción de que cada empresa conecte su propio número (plan Business).
- **Datos para transferir** por empresa en cada aviso. **Modo revisión** y **pausa por cliente**.
- Plantillas editables con variables, reglas y pasos de recordatorio, `reminder_deliveries` idempotente.
- Adaptador Resend, cron por hora, ventana horaria, reintentos con backoff, opt-out.
- Corte automático de la secuencia al pagar. Historial de envíos por cliente.
- 🟡 **Resumen por email para quien cobra** (decidido el 16/11/2026; frecuencia elegible el 17/11): reglas en `src/domain/digest.ts` (10 tests), preferencia por persona en `organization_members.digest_frequency` (por defecto cada 3 días; también diario, semanal o apagado) y selector en Configuración. Sólo sale si hay algo para mirar y nunca los fines de semana. Falta el envío (cron + Resend).
- Onboarding paso 4.

## Fase 4 — Monetización ⬜
- `billing_subscriptions`, `billing_events` y trial de 14 días **con tarjeta** (ver PRD): se pide la tarjeta al empezar la prueba, se informa la fecha y el monto del primer cobro y se avisa por email antes de cobrar. La landing no menciona la tarjeta.
- Límites en el servidor (clientes activos y usuarios), invitaciones de equipo.
- Panel de facturación. Adaptador `manual` y luego el proveedor elegido.
- **Decisión pendiente:** proveedor de cobro recurrente (ver ARCHITECTURE §7).

## Fase 5 — Calidad y lanzamiento ⬜
- E2E completo de los 18 pasos del MVP, auditoría de seguridad, accesibilidad y performance.
- Monitoreo de errores, alertas del cron, prueba de restauración de backup.
- Revisión legal de términos y privacidad.

**Checklist de producción:**
- Dominio.
- SMTP propio.
- `NEXT_PUBLIC_LAUNCHED=true`.

## Posteriores
- Mercado Pago para cobros de clientes con conciliación.
- WhatsApp Business oficial.
- Portal del cliente final con tokens revocables.
- API pública.
- Insights con IA (con las restricciones del PRD).
- Consola interna del operador (MRR, ARR, salud de workers).

## Limitaciones conocidas hoy
- **La landing muestra precios en pesos que todavía no confirmaste** y funciones de la Fase 3 que salieron del estudio de mercado (WhatsApp con un toque, promesa de pago, revisar antes de enviar, pausa por cliente, resumen por email).
- Sin un proyecto Supabase no se puede crear cuenta. La UI lo indica con "Entorno sin configurar".
- **La landing describe funciones de las Fases 2 a 4 como disponibles. No publicarla hasta terminar la Fase 3.** WhatsApp y cobro online ya aparecen como "Próximamente".
- La CSP permite `'unsafe-inline'` en scripts (requisito actual de Next sin nonces). Migrar a nonces en la Fase 5.
- Supabase muestra un aviso de Edge Runtime en el middleware. Es conocido y no afecta el funcionamiento.
