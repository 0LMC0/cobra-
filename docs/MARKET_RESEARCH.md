# Estudio de mercado y de comportamiento

Fecha: 16 de noviembre de 2026. Alcance: Argentina, pymes y profesionales que cobran abonos o cuotas a clientes fijos.

## Cómo leer este documento
Cada afirmación lleva una etiqueta:

- **Dato:** lo dice una fuente citada al final.
- **Indicio:** evidencia de otro país, de otro tipo de deuda o de una empresa que vende software. Orienta, no prueba.
- **Hipótesis:** razonamiento propio sin fuente. Hay que validarlo con entrevistas (sección 8).

No hay encuestas ni entrevistas propias todavía. No existe, hasta donde se buscó, un experimento sobre recordatorios de facturas entre pymes: la evidencia más cercana es de préstamos, tarjetas, matrículas e impuestos.

## 1. Resumen: ocho hallazgos y qué cambia en COBRA

| # | Hallazgo | Tipo | Qué cambia en COBRA |
|---|---|---|---|
| 1 | En 2026 cobrar tarde es lo normal: 6 de cada 10 pymes industriales esperaron más de lo pactado | Dato | El problema es real y actual. El mensaje central se mantiene |
| 2 | WhatsApp es el canal: se abre 37 veces por día y 8 de cada 10 lo prefieren para hablar con empresas | Dato | **WhatsApp con un toque** entra en la Fase 3. El email solo no alcanza |
| 3 | Recordar a tiempo rinde; insistir después rinde poco | Indicio | Secuencia por defecto con el peso antes y en el vencimiento. Después, pocos avisos y pasa a una persona |
| 4 | Escribirle a quien ya prometió una fecha puede salir mal | Indicio | **Promesa de pago:** silencio hasta la fecha prometida y un solo seguimiento |
| 5 | Los mensajes de presión social o moral dan resultados contradictorios | Indicio | Tono amable y concreto. Nada de "todos ya pagaron" ni de retos |
| 6 | La transferencia es el medio que más crece | Dato | **Datos para transferir** en cada aviso y comprobante por respuesta |
| 7 | Quien cobra pierde horas y a algunos les incomoda reclamar | Indicio | **Resumen por email** para quien cobra, revisar antes de enviar y pausar a un cliente |
| 8 | En Argentina el software se vende en pesos y se prueba sin tarjeta | Dato parcial | **Precios en pesos y en dólares** (hecho). Revisar la decisión de pedir tarjeta |

## 2. El mercado

**La cadena de pagos está estirada.**
- Dato: el 62 % de las pymes industriales sufrió una extensión de los plazos de cobro pactados (Fundación Observatorio PyME, 2.º trimestre de 2026) [1].
- Dato: el 24 % de esas pymes se atrasó en sus propios compromisos, el doble que un año antes [1].
- Dato: se atrasa con proveedores el 15,3 %, con impuestos el 17,3 % y con bancos el 8,6 % [2].
- Hipótesis: cuando la plata no alcanza para todos, cobra primero quien avisa a tiempo y con claridad. El banco cobra antes que el proveedor porque tiene sistema; COBRA le da ese sistema a quien no lo tiene.

**Cuántos pueden usarlo.**
- Dato sin verificar en fuente oficial: unos 2,2 millones de monotributistas y 388 mil autónomos a junio de 2026 [3].
- No se sabe qué parte cobra abonos mensuales a clientes fijos. Sin ese dato, cualquier número de mercado sería inventado. Se calcula así: cantidad de prestadores de servicios con clientes recurrentes × porcentaje con 10 clientes o más × disposición a pagar. Las tres cifras salen de las entrevistas y de datos de ARCA por actividad.

**Segmento para empezar.** Servicios con abono mensual y entre 10 y 200 clientes: agencias, estudios contables y de diseño, mantenimiento, consultoras. Coincide con el PRD.

## 3. Cómo se comporta la gente

### Quien paga (el cliente de tu cliente)

| Conducta | Evidencia | Decisión de diseño |
|---|---|---|
| **Se olvida.** | Indicio: en un experimento con un microprestamista de Uganda, un mensaje de texto antes del vencimiento mejoró el pago a tiempo tanto como bajar 25 % el costo del préstamo [4] | El aviso previo y el del día de vencimiento son los más importantes |
| **Patea.** | Indicio: en tres experimentos con 32.000 deudores en Letonia, cada recordatorio adicional sumó poco [5] | Después del vencimiento van dos avisos y el caso pasa a una persona. No hay insistencia infinita |
| **Promete.** | Indicio: las promesas firmadas casi no cambiaron el pago en un prestamista online de EE. UU. [6]. Además, recordar a quien ya prometió puede provocar un nuevo incumplimiento [5] | La promesa sirve para ordenar, no para presionar: se anota la fecha, hay silencio hasta ese día y un solo seguimiento |
| **Responde distinto a la presión.** | Indicio: decir "la mayoría ya pagó" funcionó con impuestos en el Reino Unido y no funcionó con matrículas universitarias [7][8]. Un mensaje moral funcionó con tarjetas en Indonesia [9] | No se usa presión social ni moral. Son clientes que van a seguir trabajando con vos |
| **Responde a la amabilidad.** | Indicio débil: en facturas de FreshBooks, las que decían "por favor" y "gracias" se cobraron algo más. Es una correlación y la fuente vende software [10] | Plantillas amables y con los datos exactos: importe, concepto y fecha |
| **Vive en WhatsApp.** | Dato: en Argentina WhatsApp se abre 37 veces por día, contra 20,7 de promedio mundial, y lo usa el 93,5 % de los internautas [11]. Dato de Meta: 8 de cada 10 lo prefieren al teléfono, al correo y a los chatbots para hablar con empresas, y el 74 % ya lo usó con algún negocio [12] | Un aviso sólo por email llega a menos gente. WhatsApp con un toque primero; la API oficial después |
| **Paga por transferencia.** | Dato: las transferencias inmediatas siguen creciendo a dos dígitos y el BCRA creó el Cobro con Transferencia para cobros recurrentes [13] | Cada aviso lleva alias y titular. A futuro, el Cobro con Transferencia es el camino para el cobro automático |

### Quien cobra (tu usuario)

| Conducta | Evidencia | Decisión de diseño |
|---|---|---|
| **Pierde horas.** | Indicio: en una encuesta a 2.008 pymes británicas, el 20 % dedica de 1 a 4 horas por semana a reclamar facturas [14] | El valor se cuenta en tiempo: "vos no escribís ninguno" |
| **Le incomoda reclamar.** | Indicio viejo: un 10 % de las empresas británicas directamente no reclamaba, por incomodidad o por miedo a perder al cliente [15]. Hipótesis: en Argentina pesa más, porque el cliente suele ser un conocido | "COBRA le avisa por vos": el aviso sale amable y a tiempo, sin que tengas que escribir "che, ¿me pagás?" |
| **No abre otra app todos los días.** | Hipótesis | El resumen le llega por email. A futuro, marcar "pagó" desde el mismo resumen |
| **Teme que el sistema mande algo mal.** | Hipótesis | Modo revisión: los primeros avisos se aprueban a mano. Pausa por cliente |
| **No va a cargar 40 clientes a mano.** | Hipótesis | Importar desde Excel y poder empezar con tres clientes |

## 4. Competencia

| Producto | Qué es | Para COBRA |
|---|---|---|
| YoFacturo | Gestión para pymes con cuenta corriente y recordatorios de cobranza. Prueba de un mes sin tarjeta [16] | El competidor local más directo en recordatorios |
| Xubio, Colppy, Contabilium | Gestión y contabilidad. Precios en pesos, de decenas de miles a más de cien mil por mes más IVA, según una comparativa no oficial. Xubio ajusta cada tres meses y prueba 14 días sin tarjeta [17] | Fijan lo que una pyme espera pagar y cómo espera probar |
| Cresium | Identifica y vincula pagos de pymes de forma automática [18] | Posible integración futura para saber quién pagó |
| CuotaQ | Cobros y recordatorios para clubes, academias y asociaciones [19] | Mismo problema, otro público |
| Moonflow | Cobranzas con agentes de IA por WhatsApp, voz, email y SMS. Con sede en Lima y dos rondas de inversión [20] | Apunta a carteras más grandes. COBRA compite por simple |
| Holded, Xero, Quipu | Facturación con recordatorios. En Holded, desde el plan de 99 € por mes [21] | Caros y pensados para otro país |

**Dónde se para COBRA:** la herramienta más simple para quien cobra abonos. No hace contabilidad ni facturación. Se entiende en cuatro pasos y habla como habla la gente.

**Nombre:** una búsqueda rápida no encontró otro producto de cobranzas llamado "Cobra" en la región. No es un chequeo legal: hay que consultar el registro de marcas del INPI.

## 5. Precios y prueba

**Precios en pesos.** La lista quedó en $ 18.900, $ 45.900 y $ 108.900 por mes. Sale del dólar oficial (Banco Nación, venta) a $ 1.570, de la primera semana de noviembre [22], redondeado. Son una propuesta: falta que la confirmes.
- Con inflación, la lista en pesos hay que revisarla cada tres meses, como hace la competencia.
- El plan anual en pesos congela el precio doce meses. Es atractivo para el cliente y un riesgo para vos. Alternativa: anual sólo en dólares.

**Tarjeta en la prueba.** Hoy está decidido pedirla.
- Indicio: pedir tarjeta sube mucho la conversión de quienes prueban, pero reduce la cantidad de gente que prueba. Las cifras varían mucho entre fuentes [23].
- Dato: Xubio y YoFacturo ofrecen prueba sin tarjeta [16][17].
- Recomendación: no pedir tarjeta al registrarse y pedirla recién al activar los envíos automáticos, que es cuando la persona ya vio el valor. Queda como decisión pendiente.

**WhatsApp oficial.** La API cobra por mensaje y las tarifas publicadas por proveedores no coinciden entre sí [24]. Por eso el primer paso es "con un toque": el mensaje sale del WhatsApp de quien cobra, sin costo y sin riesgo para su número.

## 6. Qué cambió en COBRA con este estudio

**Hecho hoy**
- Precios en pesos y en dólares, con selector. Arranca en pesos.
- El hero suma el cuarto paso, "A vos también te avisa", y el segundo paso pasa a ser "COBRA le avisa por vos".
- Sección nueva "Cobrar es tratar con personas", con cuatro situaciones reales y la respuesta de COBRA.
- El email de ejemplo lleva los datos para transferir y pide el comprobante por respuesta. Antes mostraba un link de pago que no está en el plan cercano.
- Reglas de avisos programadas y probadas en `src/domain/reminders.ts`: días hábiles, feriados, promesa de pago, corte al pagar, pausa, baja y pase a una persona.

**Al ROADMAP (Fase 3)**
- WhatsApp con un toque.
- Promesa de pago.
- Datos para transferir por empresa.
- Modo revisión y pausa por cliente.
- Resumen por email para quien cobra.

## 7. Lo que no se pudo confirmar
- Que el plazo promedio de cobro sea de 49 días: aparece en notas periodísticas, pero la fuente original no se pudo leer.
- Que la transferencia sea el principal medio de cobro del 82 % de los comercios (relevamiento de Getnet y Somos PyMEs): la nota no se pudo leer completa.
- Los precios oficiales de la competencia: los citados vienen de la comparativa de un competidor.
- Cuánto mejora el cobro de facturas entre empresas con recordatorios: no hay experimentos publicados.

## 8. Cómo validarlo: diez entrevistas
Diez personas del segmento, veinte minutos cada una. Se pregunta por lo que hicieron, no por lo que harían.

1. Contame la última vez que un cliente te pagó tarde. ¿Qué hiciste y cuándo?
2. ¿Cómo sabés hoy quién te pagó y quién no? ¿Cada cuánto lo mirás?
3. ¿Por dónde les recordás? ¿Qué te contestan?
4. ¿Alguna vez no reclamaste por no quedar mal? ¿Con quién?
5. Cuando te dicen "te pago el viernes", ¿qué hacés el viernes?
6. ¿Dejarías que un sistema le escriba a tus clientes sin que lo revises? ¿A todos?
7. ¿Cuánto pagás hoy por herramientas de gestión y en qué moneda?

**Qué cambiaría el plan**
- Si casi nadie usa email con sus clientes, WhatsApp con un toque pasa antes que el email automático.
- Si la mayoría tiene menos de diez clientes, hace falta un plan más barato o gratuito.
- Si nadie deja que el sistema escriba solo, el modo revisión pasa a ser el modo por defecto.

## Fuentes
1. Forbes Argentina, 20/8/2026, sobre la Encuesta Coyuntural de la Fundación Observatorio PyME: <https://www.forbesargentina.com/negocios/tension-pymes-industriales-duplican-atrasos-pagos-6-cada-10-sufren-demoras-cobro-n95916>
2. iProfesional, 10/9/2026, con datos del Observatorio PyME: <https://www.iprofesional.com/economia/464205-morosidad-empresarial-quintuplico-puso-alerta-pymes-argentinas>
3. Contexto Tucumán, sobre la evolución del monotributo: <https://www.contextotucuman.com/nota/417931/en-casi-15-anos-aumento-70_por_ciento-el-numero-de-monotributistas.html>
4. Cadena y Schoar, "Remembering to Pay? Reminders vs. Financial Incentives for Loan Payments", NBER 17020: <https://www.nber.org/papers/w17020>
5. Saulītis, "Nudging debtors with non-performing loans: Evidence from three field experiments" (2023): <https://science.rsu.lv/en/publications/nudging-debtors-with-non-performing-loans-evidence-from-three-fie/>. Lo de los recordatorios sucesivos y lo de las promesas figura en el resumen del registro del ensayo, no se leyó el artículo completo: <https://www.socialscienceregistry.org/trials/1043>
6. Bhanot, "Cheap promises: Evidence from loan repayment pledges in an online experiment": <https://cenfri.org/research-paper/cheap-promises-evidence-from-loan-repayment-pledges-in-an-online-experiment/>
7. Ensayo con recordatorios de matrícula a 4.298 estudiantes: <https://pmc.ncbi.nlm.nih.gov/articles/PMC5443476>
8. Hallsworth y otros, "The Behavioralist as Tax Collector", NBER 20007: <https://www.nber.org/papers/w20007.pdf>
9. Bursztyn y otros, "Moral Incentives in Credit Card Debt Repayment", NBER 21611: <https://nber.org/system/files/working_papers/w21611/w21611.pdf>
10. FreshBooks, análisis de sus propias facturas: <https://www.freshbooks.com/blog/invoice-payment-terms>
11. NoticiasNQN, 29/10/2026, sobre el informe Digital 2027 de DataReportal: <https://www.noticiasnqn.com.ar/noticias/2026/10/29/358767-los-argentinos-abren-whatsapp-37-veces-por-dia-casi-el-doble-que-el-promedio-mundial>
12. El Cronista, 18/5/2026, con datos de Meta: <https://www.cronista.com/infotechnology/it-business/asi-funciona-la-novedad-de-whatsapp-que-usan-las-pymes-para-vender-mas-sin-sumar-personal/>
13. BCRA, informes de pagos minoristas: <https://www.bcra.gob.ar/publicaciones/informe-de-pagos-minoristas-2025/> y <https://www.bcra.gob.ar/publicaciones/informe-de-pagos-minoristas-marzo-de-2026/>
14. QuickBooks Reino Unido, impacto de los pagos tardíos: <https://quickbooks.intuit.com/uk/blog/late-payments-impact-on-businesses/>
15. HRreview, pymes y pagos tardíos: <https://hrreview.co.uk/hr-news/reward-news/small-businesses-are-victims-of-late-payments/10684>
16. YoFacturo: <https://yo-facturo.com/crm/>
17. Comparativa de un competidor, no oficial: <https://app.spomsolutions.com/blog/xubio-vs-colppy-vs-spombridge>
18. iProUP, sobre Cresium: <https://www.iproup.com/finanzas/55501-cresium-asi-es-la-nueva-solucion-clave-con-ia-para-simplificar-los-cobros-en-pymes>
19. Forbes México, sobre CuotaQ: <https://forbes.com.mx/ad-cuotaq-busca-llevar-la-gestion-de-cuotas-a-una-nueva-etapa-en-mexico/>
20. Latam Fintech, sobre Moonflow: <https://www.latamfintech.co/articles/fintech-moonflow-recauda-us-1-74m-para-acelerar-el-desarrollo-de-productos-en-latam-y-mejorar-su-plataforma-de-cobros>
21. Hackceleration, comparativa de software de cobros: <https://hackceleration.com/es/labs/mejor/software-gestion-cobros-pymes>
22. El Cronista, cotización del dólar oficial: <https://www.cronista.com/finanzas-mercados/dolar-blue-hoy-a-cuanto-cotiza-el-sabado-7-de-noviembre-con-el-mep-y-el-ccl/>
23. Userpilot, conversión de pruebas gratis: <https://userpilot.com/blog/saas-conversion-rate/>. Chargebee, pruebas con y sin tarjeta: <https://www.chargebee.com/blog/credit-card-trials-credit-card-trials-go/>
24. Mercately, precios de la API de WhatsApp: <https://blog.mercately.com/nuevos-precios-whatsapp-api-octubre-2026/>
