# Roadmap de Cobra+

Estado al **15/11/2026**.

**Leyenda:**
- ✅ hecho y verificado
- 🟡 hecho pero sin verificar contra un Supabase real
- ⬜ pendiente

## Decisiones de ecosistema (17/11)
- Cobra+ es una app de **PrimerosPrecios** (que va a tener varias apps; hoy la Academia y Cobra+).
- Vive en **cobra.primerosprecios.com**, con despliegue propio: un problema en Cobra+ no toca la Academia.
- **Cuentas separadas por ahora** (login y base propios). Unificar la cuenta de PrimerosPrecios queda para más adelante.
- Emails desde el dominio de PrimerosPrecios (`avisos@primerosprecios.com`), que ya está en Resend.

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
| Migración `foundations`: perfiles, orgs, miembros, roles, invitaciones, auditoría, eventos y RLS | ✅ | Aplicada en el proyecto Supabase `cobra-plus` (12 tablas con RLS) |
| Auth: registro, verificación de email, login, recupero, nueva clave, logout | 🟡 | Login probado contra Supabase real (17/11) con un usuario de prueba (`scripts/crear-usuario-prueba.mjs`). Falta probar registro con email real (necesita Resend) |
| Middleware y protección de `/app` y `/onboarding` | ✅ | Sin sesión redirige a `/ingresar` (verificado en el navegador) |
| Onboarding paso 1 (empresa) con RPC atómica | ✅ | Simplificado a nombre y moneda; lo demás se completa solo. Probado contra Supabase |
| Shell de la app (sidebar, barra mobile, cambio de empresa, modo demo identificado) | ✅ | Las secciones no construidas dicen "Pronto" y no tienen link |
| Configuración: datos de la empresa y equipo (lectura real) | 🟡 | |
| Landing completa, legales en borrador, SEO, robots y sitemap | ✅ | Sin indexar hasta el lanzamiento |
| Encabezados de seguridad (CSP, frame-ancestors y otros) | ✅ | |
| Tests de autorización RLS contra la base (`tests/authz`) | ⬜ | Requiere el proyecto Supabase |

**Para cerrar la Fase 1:**
1. ✅ Crear el proyecto Supabase y aplicar las migraciones.
2. ✅ Recorrido login → onboarding → cliente → cobro → "Pagó" → inicio con totales reales (17/11, Supabase real).
3. Probar registro con verificación de email (cuando esté Resend).
4. ✅ Aislamiento entre organizaciones: cubierto por los tests de base con PGlite (`tests/db`).

## Fase 2 — Producto principal 🟡
- 🟡 **Pantallas de clientes y cobros** (`/app/clientes`, `/app/clientes/nuevo`, `/app/clientes/[id]`): lista con lo que debe cada uno, alta con celular de WhatsApp, ficha con cobros, "Pagó" (total o parcial, sin duplicar con doble clic) y botón de WhatsApp. Validaciones en `src/domain/forms.ts` (14 tests). Se ven con datos de ejemplo en `/vista-previa/clientes` (sólo en desarrollo). Probadas contra Supabase el 17/11. El alta de cliente pide sólo nombre, email y celular; lo demás va en "Más datos".
- ✅ **Migración del núcleo** (`20261117000001_core.sql`, 23 tests en `tests/db/core.test.ts`): clientes (con celular de WhatsApp y permiso), abonos, cobros (con promesa de pago), pagos, imputaciones, vista `charge_balances` y RPC `record_payment` idempotente. Referencias con `org_id` para que nada apunte a otra empresa; pagos inmutables que sólo se anulan con motivo; nunca se mezclan monedas ni se cobra de más.
- Migración: `customers`, `agreements`, `agreement_price_changes`, `charges`, `charge_adjustments`, `payments`, `payment_allocations`, `attachments`, vista `charge_balances`, triggers de auditoría.
- ✅ **Pantalla Cobros** (`/app/cobros`): todos los cobros con su cliente, atrasados primero, "Pagó" y WhatsApp en cada uno, y pestaña de pagados. El menú sólo muestra lo que ya funciona.
- ✅ **Clientes: editar, archivar/reactivar, buscar y filtrar** (Todos, Deben, Atrasados, Archivados; búsqueda sin acentos por nombre, contacto, email, celular o CUIT; `src/domain/customer-filter.ts`). Pausar avisos desde Editar.
- ✅ **Historial del cliente** (`src/domain/timeline.ts` + migración `20261119000001_history.sql`, aplicada en Supabase el 17/11): la base registra sola los cambios de clientes y cobros con triggers; la ficha muestra cobros, pagos, avisos enviados o fallidos, promesas, ediciones y archivado. Probado contra Supabase.
- ✅ **Exportar a CSV** (`/app/exportar/clientes|cobros|pagos`, `src/domain/csv.ts` y `exports.ts`, 7 tests): separador ";", BOM UTF-8, importes con coma decimal, fechas dd/mm/aaaa, una columna de deuda por moneda y protección contra fórmulas (CSV injection). Botones en Clientes y Cobros. Probado contra Supabase. Falta: importar CSV y límite por plan (Growth en adelante).
- Clientes: CRUD, archivo, búsqueda, filtros, deduplicación, CSV in/out, ficha con línea de tiempo.
- ✅ **Generación de cobros de abonos** (`src/domain/agreements.ts`, 7 tests): el proceso diario crea el cobro 7 días antes del vencimiento (así sale el aviso de −5), cambia el mes en el concepto y avanza la próxima fecha. Idempotente por `unique (agreement_id, period_start)`; probado contra Supabase corriéndolo dos veces. Falta: pantalla de abonos (pausar, editar precio, fecha de fin).
- Cobros únicos, descuentos, recargos, reprogramación y cancelación.
- Registro manual de pagos parciales y totales con imputación y comprobante.
- 🟡 Dashboard real: totales del mes en la moneda principal (`src/domain/home.ts`, 5 tests) y "Para avisar hoy" con los datos reales. Faltan gráficos y totales de otras monedas.
- Onboarding pasos 2 y 3.
- Playwright: recorrido del MVP hasta el paso 7.

## Fase 3 — Automatización 🟡
- 🟡 **Envío automático por email** (armado y probado; falta conectarlo a Supabase y a Resend): migración `20261118000001_reminders.sql` (`reminder_deliveries` con unicidad cobro + paso + canal, y datos de envío de la empresa), textos en `src/domain/emails.ts`, plan del día en `src/domain/daily-plan.ts` (12 tests), envío con Resend en `src/server/email/mailer.ts` y proceso diario en `/api/cron/daily` (lunes a viernes 9:00 de Argentina, `vercel.json`, protegido con `CRON_SECRET`). Sin `RESEND_API_KEY` corre en modo prueba y no manda nada. Se activa desde Configuración → "Avisos automáticos". ✅ Reintentos: hasta 3 intentos ante errores pasajeros de Resend, con `Idempotency-Key` para no duplicar; un aviso fallido se reintenta si el proceso vuelve a correr el mismo día. ✅ Baja con un clic: link firmado en cada email (`/baja`, con botón de confirmación para que los antivirus no den de baja a nadie) y encabezado `List-Unsubscribe` para el botón de Gmail (`/api/baja`). La ficha del cliente avisa si se dio de baja. Requiere `UNSUBSCRIBE_SECRET`.
- 🟡 **Reglas de avisos** (`src/domain/reminders.ts`, 14 tests): secuencia por defecto −5, −1, 0, +3 y +7, sólo días hábiles y sin feriados, promesa de pago, corte al pagar, pausa, baja y pase a quien cobra. Falta conectarlas a la base y al envío.
- ✅ **Promesa de pago:** botón "Prometió pagar" en cada cobro (ficha y Cobros), fecha de hoy a 60 días; los avisos se frenan hasta ese día y después sale un solo seguimiento. Se puede sacar. Probado contra Supabase.
- 🟡 **WhatsApp con un toque** (`src/domain/whatsapp.ts`, 21 tests; botón en `src/components/app/whatsapp-button.tsx`; lista "Para avisar hoy" en el inicio): convierte el celular argentino al formato de WhatsApp (saca el 0 y el 15), arma el mensaje según el momento (antes, vence hoy, atrasado, último aviso, promesa) y abre el chat listo para enviar. Falta conectarlo a los datos reales (Fase 2) y registrar cuándo se usó.
- **WhatsApp automático (etapa 2):** API oficial de WhatsApp Business con un número de Cobra+ que escribe en nombre de cada empresa. Requiere cuenta comercial de Meta verificada, número propio, plantillas aprobadas y permiso del cliente. Costo por mensaje a confirmar en la tabla oficial de Meta. Después, opción de que cada empresa conecte su propio número (plan Business).
- **Datos para transferir** por empresa en cada aviso. **Modo revisión** y **pausa por cliente**.
- Plantillas editables con variables, reglas y pasos de recordatorio, `reminder_deliveries` idempotente.
- Adaptador Resend, cron por hora, ventana horaria, reintentos con backoff, opt-out.
- Corte automático de la secuencia al pagar. Historial de envíos por cliente.
- 🟡 **Resumen por email para quien cobra** (decidido el 16/11/2026; frecuencia elegible el 17/11): reglas en `src/domain/digest.ts` (10 tests), preferencia por persona en `organization_members.digest_frequency` (por defecto cada 3 días; también diario, semanal o apagado) y selector en Configuración. Sólo sale si hay algo para mirar y nunca los fines de semana. Falta el envío (cron + Resend).
- Onboarding paso 4.

## Fase 4 — Monetización 🟡
- ✅ **Plan Gratis** (decisión 17/11): para siempre, sin tarjeta, 10 avisos automáticos por mes (`MONTHLY_REMINDERS` en `src/config/plans.ts`). El tope lo aplica el proceso diario en el servidor y, si no alcanza, salen primero los más urgentes (`src/domain/quota.ts`). El botón de WhatsApp no cuenta. Uso del mes en Configuración y aviso en el inicio cuando quedan 2 o menos.
- ✅ **Qué incluye cada plan** (`planIncludes` en `src/config/plans.ts`, decisión 17/11): WhatsApp desde Starter (en Gratis se ve con candado y lleva a "Tu plan"); exportar CSV desde Growth, controlado también en el servidor. Los avisos que no salen por el tope quedan como `skipped` (`plan_limit`) y se muestran en "Tu plan", en el inicio y en el historial del cliente.
- ✅ **Tabla `subscriptions`** (migración `20261120000001`, aplicada): plan de cada empresa; sin fila = Gratis. Sólo escribe el servidor (webhooks); nadie puede cambiarse el plan desde el navegador (3 tests de base).
- 🟢 **Planes pagos con Mercado Pago** (Suscripciones/preapproval; app `cobra-plus` #705520747111548 creada el 17/11 en la cuenta de PrimerosPrecios): `src/domain/billing.ts` (6 tests), adaptador `src/server/billing/mercadopago.ts`, "Pasarme a…" mensual/anual y cancelar renovación en Configuración (sólo dueños), vuelta `/app/plan/volver` y webhook firmado `/api/mercadopago/webhook` que siempre vuelve a consultar a Mercado Pago. Cambio de plan cancela la suscripción vieja. **Probado el 17/11 con cuentas de prueba:** pago aprobado de Starter mensual ($18.900) → la vuelta activó Starter en la app → "Cancelar la renovación" dejó la suscripción `cancelled` en Mercado Pago y la app avisa que sigue con Starter hasta el fin del período. **Falta:** configurar el webhook (necesita URL pública / deploy y `MP_WEBHOOK_SECRET_COBRA`) y sacar el "(muy pronto)" de la landing al lanzar. Cuenta: la de PrimerosPrecios (decisión 17/11). Necesita sus credenciales de PRUEBA en `.env.local` (`MP_ACCESS_TOKEN_COBRA`, `MP_WEBHOOK_SECRET_COBRA`).
- 🟢 **Publicada en modo privado** (17/11): Vercel `cobra-plus` (conectado a GitHub, se publica solo con cada push), **https://cobra.primerosprecios.com** (CNAME `cobra` en DonWeb, con HTTPS desde el 18/11) y https://cobra-plus.vercel.app, sin indexar (`NEXT_PUBLIC_LAUNCHED=false`). Supabase Auth acepta el dominio. Webhook de Mercado Pago configurado (modo prueba y productivo, evento "Planes y suscripciones") y probado en producción el 18/11: firmado → sincroniza el plan; sin firma → 401. Desde el 18/11 usa las **credenciales de producción** de la cuenta de PrimerosPrecios (pagos reales); `MP_TEST_PAYER_EMAIL` se ignora en producción. Landing sin "(muy pronto)". Supabase Auth manda sus emails por Resend (SMTP `smtp.resend.com`, remitente `cuentas@primerosprecios.com`, hasta 30 por hora) con plantillas en español para confirmar cuenta y cambiar contraseña; probado el 18/11 con un registro a la casilla de prueba de Resend. **Lanzada al público el 18/11** (`NEXT_PUBLIC_LAUNCHED=true`, indexable). SEO: imagen para compartir (`src/app/opengraph-image.tsx`, Poppins), canónicas, datos estructurados SoftwareApplication (precios) + FAQPage, título y descripción con palabras clave, sitemap con landing, registro y legales. Google Search Console: propiedad `https://cobra.primerosprecios.com/` verificada con archivo HTML (`public/google832f1ce627a5348f.html`, no borrar), sitemap enviado e indexación de la portada solicitada.
- 🟢 **Conversión** (17/11): la landing ya no promete lo que no existe (importar CSV, editar textos, varios usuarios: marcados "próximamente"); Starter recomendado; CTAs en el medio de la página y "Gratis para siempre · Sin tarjeta" en el hero; registro sin casilla obligatoria y contraseña de 8; al llegar al tope de clientes, la app ofrece ver planes en vez de dar error.
- 🟢 **Seguridad y bugs** (18/11): base endurecida según el Security Advisor de Supabase (search_path fijo, funciones sin acceso anónimo; migración `20261121000001_hardening.sql`, aplicada en producción y con tests); textos que viajan en los emails sin links ni caracteres invisibles (anti-phishing); alias/CBU validado; tope de importe y fechas con sentido; redirecciones internas validadas (`src/domain/safe-redirect.ts`, sin open redirect); la vuelta de Mercado Pago sobrevive al login; confirmación de email y cambio de contraseña por token (sirven en otro dispositivo, probado en producción).
- 🟢 **"Ver el email que le llega"** (18/11): vista previa del aviso real en la ficha del cliente, aislada en un iframe sin scripts. Sale del estudio de mercado (miedo a que el sistema mande algo mal).
- 🟢 **WhatsApp en el plan Gratis: 3 por mes** (18/11, decisión del dueño): cada toque pasa por `/app/whatsapp` (sólo acepta links a wa.me), queda en `whatsapp_sends` (migración `20261122000001`, aplicada en producción, con tests de RLS) y cuenta para el cupo; al cuarto lleva a Configuración con el aviso. Starter en adelante, sin tope. Botón con "te quedan N".
- 🟢 **Precios como las apps grandes** (18/11): sin selector de moneda (sólo pesos), selector Mensual/Anual que arranca en Anual con "Ahorrá 20%", precio por mes con el mensual tachado y "Pagás $X por año · precio fijo por 12 meses". Igual en la app.
- 🟢 **Borrar mi cuenta** (18/11, Ley 25.326): en Configuración, con "BORRAR" escrito a mano. Borra las empresas donde sos la única persona dueña (con todo adentro) y cancela su plan de Mercado Pago antes; en las compartidas sólo salís vos. Probado de punta a punta y con test de base.
- 🟢 **Landing más simple** (18/11): frase que explica todo en el hero, sin las secciones repetidas "Tu panel" y "Los emails", precios sin "próximamente", 8 preguntas.
- 🟢 **Parte diario para el dueño** (18/11): el proceso diario manda a `OWNER_NOTIFY_EMAIL` un email con las últimas 24 h (personas y empresas nuevas, planes pagos activos, avisos enviados, errores del servidor y pedidos de baja/arrepentimiento pendientes). Asunto con "· revisar" si hay algo para mirar. `src/domain/owner-report.ts`.
- 🟢 **"Ya pagué" probado en producción** (18/11): link firmado → confirmación → avisos frenados 3 días, sin errores.
- 🟢 **Emails rediseñados** (18/11): molde único `src/domain/email-layout.ts` con la identidad de la página (crema, tarjeta con borde azul tinta y sombra dura, Poppins, botón azul, resaltador), hecho con tablas y estilos en línea (Gmail/Outlook/Apple Mail), texto de vista previa y botón a prueba de Outlook. Lo usan el aviso al cliente, el resumen, el "te falta un paso", los trámites de baja/arrepentimiento y las plantillas de Supabase (confirmar cuenta y cambiar contraseña, cargadas en el panel).
- 🟢 **"Ya pagué" en el aviso** (18/11): link firmado por cobro (`/ya-pague`), se confirma con un botón; frena los avisos de ese cobro 3 días (usa la promesa de pago) y le manda a quien cobra "X dice que ya te pagó" con botón para marcarlo. Nunca marca el pago solo.
- 🟢 **Email de "te falta un paso"** (18/11): el proceso diario le manda UNA vez, entre 1 y 4 días después de registrarse, un email al dueño que no terminó de configurar (primer cliente, primer cobro o prender avisos), con el botón directo a ese paso. Columna `organizations.onboarding_nudged_at` (aplicada en producción). `src/domain/onboarding-nudge.ts` con tests.
- 🟢 **Botón de arrepentimiento y botón de baja** (18/11, Disp. 954/2025 y 3/2026): `/arrepentimiento` y `/boton-de-baja`, sin iniciar sesión, en el pie de toda la web. Código de trámite al instante y por email; la baja se confirma desde el email de la cuenta y cancela la renovación de todos sus planes; el arrepentimiento avisa al dueño (`OWNER_NOTIFY_EMAIL`) para devolver el pago desde Mercado Pago. Tabla `consumer_requests` (sólo servidor), probado en producción.
- ⬜ **Para un lanzamiento completo (necesitan al dueño):** 1) datos del proveedor a la vista (razón social, CUIT, domicilio y email de atención; Res. 270/2020); 2) revisión de Términos y Privacidad por un abogado (hoy son borradores); 3) inscribir la base de datos en la AAIP (Ley 25.326); 4) facturar (ARCA) cada cobro de suscripción: Mercado Pago no factura solo; 5) un pago real de punta a punta.
- 🟢 **Errores de producción guardados** (18/11): `src/instrumentation.ts` guarda cada error del servidor en `app_errors` (ruta sin consulta, tipo, mensaje recortado y sin emails; sólo service role). Para verlos: en el SQL Editor de Supabase, `select * from app_errors order by at desc limit 50;`.
- 🟢 **Prompt del video promocional** en `docs/PROMPT_VIDEO_AD.md` (Remotion, reel 30 s/15 s y horizontal, marca exacta, guion y caption).
- 🟢 **CAPTCHA (Cloudflare Turnstile)** (18/11): widget "Cobra+" en la cuenta de Cloudflare de lautaroprimerosprecios@gmail.com (hosts: cobra.primerosprecios.com, cobra-plus.vercel.app, localhost; modo Managed). Clave pública `NEXT_PUBLIC_TURNSTILE_SITE_KEY` cargada en Vercel y en .env.local; el widget va en registro, login y recupero (`src/components/forms/turnstile.tsx`) y el token viaja a Supabase. Probado: en un Chrome normal se genera solo e invisible. **Activo desde el 18/11** (clave secreta en Supabase → Attack Protection). Verificado: sin token Supabase responde `captcha_failed`; con el widget, el login entra normal. Ojo: cualquier prueba de login por API necesita ahora un token de Turnstile.
- 🟢 **Medición** (18/11): Vercel Web Analytics activado (gratis, sin cookies; script `/_vercel/insights/script.js` sólo en Vercel). Embudo para mirar por páginas: `/` → `/registro` → `/verificar-email` → `/onboarding` → `/onboarding/avisos` → `/onboarding/como-funciona` → `/app/clientes/nuevo?primero=1`.
- 🟢 **Prueba real de emails** (18/11): aviso "vence hoy" enviado por el proceso diario de producción a una casilla real y resumen de ejemplo enviado; ambos aceptados por Resend. El proceso diario de producción corre (Vercel Cron) y saltea direcciones de prueba.
- 🟢 **Emails andando** (18/11): `RESEND_API_KEY` (la misma cuenta de Resend de la Academia, clave sólo de envío) y `EMAIL_FROM=Cobra+ <avisos@primerosprecios.com>` en Vercel; envío de prueba aceptado por Resend.
- 🟢 **"Lo que vence en las próximas semanas"** en el Inicio (18/11): 4 semanas de lunes a domingo (la primera arranca hoy), total por moneda, barra de peso y la lista de quién paga cada día; usa la fecha prometida si la hay. `upcomingByWeek` en `src/domain/home.ts` con tests.
- 🟢 **Gráfico "Cobrado por mes"** en el Inicio (18/11): últimos 6 meses en la moneda principal, mes actual destacado y comparado con el promedio anterior, hover/toque para ver cada mes, tabla oculta para lectores de pantalla. `collectedByMonth` en `src/domain/home.ts` con tests.
- 🟢 **Importar clientes desde Excel/CSV** (18/11, todos los planes): `/app/clientes/importar`. Detecta ";" "," o tabulación, reconoce títulos con o sin tildes (Nombre, Email, Celular, CUIT, Contacto, Notas), muestra antes qué entra, qué tiene errores (con número de fila) y qué ya estaba, respeta el tope de clientes del plan y el servidor vuelve a validar todo. Planilla de ejemplo para bajar. Tests en `tests/unit/import-customers.test.ts`.
- 🟢 **Onboarding guiado en 4 pasos** (18/11): 1) empresa · 2) "¿Cómo querés que trabaje Cobra+?": avisos a tus clientes sí/no + email de respuestas, y cada cuánto querés tu resumen · 3) "Así funciona" en 4 pasos · 4) primer cliente y su primer cobro, con mensajes que guían y un cierre "¡Cobra+ ya está trabajando!". Al cargar cualquier cliente, la casilla "Que Cobra+ le avise por email" está a la vista y tildada (si los avisos de la empresa estaban apagados, se prenden). Todo se cambia después en Configuración.
- 🟢 **Activación** (18/11): los avisos vienen apagados; ahora, apenas un cliente tiene cobros, su ficha muestra "Falta un paso: prendé los avisos" y se prenden con un toque (usa tu email para las respuestas si no había uno). Antes había que encontrarlo en Configuración.
- 🟢 **Tope de clientes activos por plan** (17/11, Gratis bajado a 5 el 18/11): Gratis 5 · Starter 30 · Growth 200 · Business 1.000 (`ACTIVE_CUSTOMERS` en `src/config/plans.ts`). Lo controla el servidor al crear un cliente y al reactivar uno archivado; archivar libera lugar. Configuración muestra "X de Y clientes activos". Tests en `tests/unit/customer-limit.test.ts`.
- ⬜ Pasar ese tope también a la base (trigger) y límite de usuarios cuando existan las invitaciones.
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
