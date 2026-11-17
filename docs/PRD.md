# COBRA — Documento de producto (PRD)

> **Cobrá más. Perseguí menos.**
> SaaS B2B de cobranzas y gestión de ingresos recurrentes. Mercado inicial: Argentina.

## 1. Problema

Las pymes y profesionales que cobran abonos o servicios recurrentes llevan la cobranza en Excel, WhatsApp, transferencias y anotaciones sueltas. El resultado:

- Clientes que se olvidan de pagar y nadie les avisa a tiempo.
- Transferencias que no se sabe a qué deuda corresponden.
- Horas por semana mandando el mismo mensaje a mano.
- Nadie sabe con certeza cuánto se debe, cuánto está vencido ni cuánto entra el mes que viene.

## 2. Para quién

**Cliente ideal (ICP):** empresa o profesional con **20 a 200 clientes activos** que cobra todos los meses. Por ejemplo, agencias de marketing, estudios contables y de diseño, mantenimiento, servicio técnico, consultoras, limpieza y proveedores B2B.

**Persona principal:** la dueña o dueño, o la persona de administración. Usa el celular y la compu, no es técnica y hoy dedica entre 3 y 10 horas por semana a perseguir pagos. *Estimación de hipótesis: hay que validarla con entrevistas, no es un dato.*

**No es para:** quien necesita un ERP, contabilidad completa, facturación electrónica AFIP/ARCA o custodia de fondos. COBRA no toca el dinero.

## 3. Las 10 preguntas que COBRA responde al instante

1. ¿Cuánto tengo para cobrar?
2. ¿Cuánto cobré este mes?
3. ¿Quién no pagó?
4. ¿Qué vence pronto?
5. ¿Cuánto está vencido?
6. ¿Qué recordatorios salieron?
7. ¿Qué clientes requieren atención?
8. ¿Cómo evolucionan mis ingresos?
9. ¿Qué abonos se renuevan pronto?
10. ¿Qué tengo que hacer hoy?

## 4. Alcance del MVP

### Incluido
| Área | Qué hace |
|---|---|
| Cuenta | Registro, verificación de email, login, recuperación de contraseña, logout y rutas protegidas. |
| Empresa | Onboarding con datos de la empresa, moneda, zona horaria y frecuencia de cobro. Incluye progreso del onboarding y modo demo identificado. |
| Equipo | Roles Owner, Admin, Operator y Viewer, con permisos validados en el servidor. |
| Clientes | Alta, edición, archivo, búsqueda, filtros, CSV in/out y ficha con línea de tiempo. |
| Abonos | Contrato recurrente con precio, moneda, frecuencia, inicio y fin. Guarda el historial de cambios de precio. |
| Cobros | Únicos o generados por abono. El estado se calcula. Permite descuentos, recargos y reprogramación (todo auditado). |
| Pagos | Registro manual, pagos parciales e imputación a uno o varios cobros. Admite comprobante adjunto y registra quién lo confirmó. |
| Dashboard | Muestra pendiente, cobrado en el mes, vencido, % cobrado, próximos vencimientos y morosos, más el panel "Necesitan tu atención". |
| Recordatorios | Secuencia por email configurable con plantillas editables y variables. Se detiene sola al pagar. |
| Resumen para quien cobra | Email a dueño/a y administración con los pagos de ayer, lo que vence hoy y los atrasados. Sólo se envía los días con novedades. Hora configurable y baja por usuario. |
| Promesa de pago | Se anota la fecha que prometió el cliente. No recibe avisos hasta ese día y después hay un solo seguimiento. |
| WhatsApp con un toque | COBRA arma el mensaje y quien cobra lo envía desde su propio WhatsApp. No usa la API ni envía sola. |
| Datos para transferir | Alias y titular por empresa, incluidos en cada aviso. El cliente responde con el comprobante. |
| Control de los avisos | Modo revisión (aprobar antes de enviar), pausa por cliente, baja a pedido del cliente, sólo días hábiles y sin feriados. Después del último aviso, el caso pasa a quien cobra. |
| Reportes | Exportación CSV de cobros y pagos. |
| Plan de COBRA | Planes, trial de 14 días, límites en el servidor y panel de facturación. |

### Fuera del MVP (identificado como "Próximamente" u oculto)
- Cobro online con Mercado Pago para los clientes de la empresa, con conciliación automática.
- WhatsApp Business Platform (solo API oficial).
- Portal del cliente final.
- API pública.
- Insights con IA. El MVP usa solo reglas deterministas.
- Editor visual de automatizaciones.
- Conversión de monedas.

## 5. Recorrido que define "MVP terminado"

1. Registrarse.
2. Crear la empresa.
3. Completar el onboarding.
4. Crear un cliente.
5. Crear un abono mensual.
6. Generar una obligación de pago.
7. Verla en el dashboard.
8. Configurar recordatorios.
9. Enviar un recordatorio real por email.
10. Registrar un pago parcial.
11. Registrar el resto.
12. Verificar que el cobro figure como **Pagado**.
13. Verificar que los recordatorios se detienen.
14. Ver el historial del cliente.
15. Exportar un reporte.
16. Ver el plan.
17. Gestionar la suscripción.
18. Cerrar sesión, volver a entrar y comprobar que la información sigue ahí.

Todo con permisos de organización y límites de plan funcionando, y cubierto por tests.

## 6. Planes (configurables, en `src/config/plans.ts`)

| Plan | Precio | Clientes activos | Usuarios | Diferencial |
|---|---|---|---|---|
| Starter | US$12/mes | 30 | 1 | Recordatorios básicos |
| Growth | US$29/mes | 200 | 2 | Automatizaciones avanzadas, CSV y reportes |
| Business | US$69/mes | 1.000 | 5 | Portal de clientes y API (cuando existan) y soporte prioritario |

- El plan anual tiene 20% de descuento.
- Trial de 14 días **con tarjeta** (decisión del 15/11/2026). La landing no menciona la tarjeta. En el paso donde se carga, se informa con claridad cuándo es el primer cobro, cuánto y cómo cancelar antes; se avisa por email antes del primer cobro.
- **Precios en pesos y en dólares.** Lista en pesos: $ 18.900, $ 45.900 y $ 108.900 por mes (referencia: dólar oficial a $ 1.570, 7/11/2026). Falta confirmarla y definir cada cuánto se actualiza.
- **Pendiente de decidir** (ver `MARKET_RESEARCH.md` §5): pedir la tarjeta recién al activar los envíos automáticos, y ofrecer el plan anual sólo en dólares.
- **El precio se publica en USD, pero el cobro real depende del proveedor** (ver ARCHITECTURE.md §7).

## 7. Principios de producto

- **Simple antes que completo.** Si una función complica el uso diario, espera.
- **Nada falso en producción:** ni gráficos de ejemplo, ni botones que no hacen nada, ni integraciones que "parecen" funcionar.
- **El modo demo se ve como demo**, con una banda visible y datos aislados.
- **La plata no se pisa.** Todo cambio financiero queda auditado.
- **Obligación ≠ transacción.** Un cobro es lo que se debe; un pago es lo que entró.

## 8. Métricas (definición de eventos en ARCHITECTURE.md §9)

- **Activación:** primer cliente, primer cobro y primera regla de recordatorio activa dentro de los primeros 7 días.
- **North star:** % de importe vencido recuperado dentro de los 30 días.
- **Negocio:** trial→pago, churn mensual, MRR, ARR y ARPA.
