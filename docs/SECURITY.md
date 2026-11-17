# Seguridad de Cobra+

Cobra+ guarda información comercial y financiera de terceros. Este documento dice qué hacemos y qué **todavía no** hacemos. No declaramos certificaciones ni cumplimientos que no hayan sido verificados.

## Aislamiento entre empresas
- Hay doble barrera: autorización en el servidor (`requireOrg(minRole)`) y RLS en Postgres.
- Los ids que llegan del navegador nunca se usan como prueba de pertenencia. Siempre se cruzan con `organization_members`.
- Las pruebas de autorización (`tests/authz`) verifican que un usuario de la empresa A no lee ni escribe datos de B.

## Autenticación
- Supabase Auth con email y contraseña:
  - El email se verifica antes de entrar al producto.
  - El recupero es por link con vencimiento.
- La sesión vive en cookies `httpOnly` gestionadas por `@supabase/ssr` y se refresca en el middleware.
- El middleware protege `/app` y `/onboarding`. Además, cada página y cada acción vuelve a verificar la sesión: el middleware no es la única barrera.
- **Pendiente:** 2FA (TOTP de Supabase) para los owners en la Fase 5.

## Entradas y endpoints
- Todo input pasa por zod en el servidor, aunque ya se haya validado en el cliente.
- Las Server Actions de Next incluyen protección de origen (CSRF).
- Los endpoints de cron exigen `Authorization: Bearer ${CRON_SECRET}`, que se compara en tiempo constante.
- Los webhooks validan firma y timestamp, y se procesan de forma idempotente (`billing_events`).
- **Rate limiting:** Supabase limita los intentos de login y registro. Para las acciones propias, como la importación CSV o el envío manual de recordatorios, habrá una tabla de cuotas por org en la Fase 3. **Pendiente.**

## Secretos
- Solo las variables `NEXT_PUBLIC_*` llegan al navegador: la URL de Supabase, la anon key y la URL del sitio.
- La service role key, `RESEND_API_KEY`, `CRON_SECRET` y las credenciales de proveedores solo se usan en módulos con `import 'server-only'`.
- `.env*` está en `.gitignore` y `.env.example` no contiene valores reales.

## Encabezados
- CSP restrictiva, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy` mínima. Se configuran en `next.config.ts`.

## Datos personales (Argentina)
- Rige la Ley 25.326 de Protección de Datos Personales. Cobra+ actúa como **encargado de tratamiento** de los datos de los clientes finales que carga cada empresa.
- Se aplica minimización: el CUIT y la dirección son opcionales.
- Los recordatorios por email respetan `contact_opt_out` e incluyen un pie que identifica a la empresa remitente.
- Exportación y borrado: el owner puede exportar todo y pedir la baja de la empresa. Hay que definir la retención de backups.
- **Antes de publicar:** los textos legales (`/legal/*`) son borradores y requieren revisión profesional. También queda pendiente evaluar la inscripción de bases ante la AAIP.

## Backups y monitoreo
- Supabase hace backups diarios en los planes pagos. PITR es opcional.
- **Pendiente para la Fase 5:** monitoreo de errores (por ejemplo, Sentry), alertas del cron y pruebas de restauración.

## Reporte de vulnerabilidades
Por ahora, por email al equipo. Hay que definir la casilla `security@`.
