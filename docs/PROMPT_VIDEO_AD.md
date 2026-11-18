# Prompt para armar el video promocional de Cobra+

Copiá todo lo que está debajo de la línea y pegalo en un chat nuevo.

---

Quiero que me armes un **video promocional tipo anuncio, con motion graphics**, para **Cobra+**, una app de PrimerosPrecios. Hacelo con **Remotion** (React + TypeScript) en una carpeta nueva `C:\Users\lauty\OneDrive\Desktop\Work\cobra-video`, renderizalo a MP4 y mostrame el resultado. Hablame en español rioplatense (voseo) y no me mandes 800 mensajes: hacé todo vos y avisame cuando esté.

## Qué es Cobra+ (usá sólo esto, no inventes funciones)
- Una app que **les recuerda a tus clientes que te paguen**.
- Cargás a quién le cobrás, cuánto y cuándo vence. Cobra+ le manda un **email amable antes y después del vencimiento** (5 días antes, el día anterior, el día que vence y a los 3 y 7 días si se atrasa; sólo días hábiles).
- **Cuando te paga, tocás "Pagó" y deja de escribirle.** La plata va directo a tu cuenta: Cobra+ no toca tu plata.
- **WhatsApp con un toque:** te deja el mensaje escrito y lo mandás desde tu teléfono.
- **A vos te llega un resumen**: quién pagó, qué vence hoy y quién está atrasado.
- Si el cliente promete pagar otro día, lo anotás y Cobra+ no le escribe hasta esa fecha.
- Importás tus clientes desde Excel.
- **Gratis para siempre, sin tarjeta** (5 clientes, 10 avisos por mes, 3 WhatsApp por mes). Planes pagos desde **$ 18.900 por mes** (Starter: avisos sin tope). Pagando anual, 20% menos.
- Para quién: quienes les cobran a los mismos clientes todos los meses (agencias, estudios contables y de diseño, mantenimiento, consultoras, independientes).
- Web: **cobra.primerosprecios.com**

## Datos reales que podés usar (con la fuente chiquita en pantalla)
- "6 de cada 10 pymes industriales cobran más tarde de lo pactado" — Fundación Observatorio PyME, 2.º trimestre de 2026.
- "8 de cada 10 argentinos prefieren WhatsApp para hablar con empresas" — El Cronista, mayo de 2026.
No inventes otros números, testimonios, clientes ni logos de empresas.

## Marca (tiene que verse igual que la app)
- Fondo crema `#fbf7f1` con una cuadrícula muy suave (como papel cuadriculado).
- Texto azul tinta `#16233b`. Azul de la marca `#1d4ed8` para botones y acentos. Marcador amarillo `#ffde5c` para resaltar palabras (como resaltador, detrás del texto). Verde de "pagado" `#13b58c`. Rojo de "atrasado" `#ef4d52`. Naranja de PrimerosPrecios `#ff6a1a` sólo para la firma.
- Tipografías: **Poppins** (títulos, peso 800–900, tracking apretado) y **Figtree** (textos). Cargalas con `@remotion/google-fonts`.
- Tarjetas blancas con borde fino y la "sombra dura" de PrimerosPrecios (sombra sólida azul tinta desplazada, sin blur).
- Logo: copiá `C:\Users\lauty\OneDrive\Desktop\Work\cobra\public\brand\cobra-plus-blue-sm.png` (y la versión blanca `cobra-plus-white-sm.png`) a `public/` del proyecto del video.
- **Prohibido** lo que delata IA o plantilla: degradados violetas, manchas difuminadas, vidrio esmerilado, partículas, todo centrado y genérico. Tiene que parecer hecho por un estudio de motion design.

## Formatos
1. **Reel vertical 1080×1920, 30 segundos, 30 fps** (Instagram, TikTok, WhatsApp). Es el principal.
2. **Horizontal 1920×1080, la misma historia** (YouTube, landing).
3. **Versión de 15 segundos** del vertical, para anuncios pagos.

## Guion (vertical de 30 s, ajustá los tiempos si hace falta)
1. **0–3 s, gancho:** el celular de quien cobra con el chat "¿Me pasás lo de este mes?" escrito y borrado varias veces. Texto grande: **"¿Otra vez reclamándole a un cliente?"**
2. **3–6 s, el problema:** el dato "6 de cada 10 pymes cobran tarde" con la fuente chiquita.
3. **6–9 s, presentación:** aparece el logo de Cobra+ y "Una app que les recuerda a tus clientes **que te paguen**" (con "que te paguen" resaltado en amarillo).
4. **9–21 s, cómo funciona en 4 pasos** (un paso cada 3 s, con pantallas de la app animadas, no capturas estáticas):
   - **Cargás a tu cliente**: una tarjeta "Nuevo cliente" que se completa sola (Estudio Rivas · $ 150.000 · vence el día 10).
   - **Cobra+ le avisa por vos**: un email que entra a la bandeja: "Tu cuota vence el martes 10".
   - **Te paga y lo marcás**: toque en "Pagó", el sello verde PAGADO y los avisos que faltaban se tachan.
   - **A vos también te avisa**: el resumen del día con quién pagó, qué vence y quién está atrasado.
5. **21–25 s, beneficio:** "Cobrá más. Perseguí menos." + "Tus clientes te pagan a vos, como siempre."
6. **25–30 s, cierre:** "**Gratis para siempre · Sin tarjeta**", botón azul "Empezá gratis" y **cobra.primerosprecios.com**. Firma chiquita "by PrimerosPrecios" en naranja.

## Movimiento
- Transiciones con resortes (`spring` de Remotion), rápidas y limpias; nada de zooms mareantes.
- Kinetic typography en los títulos: las palabras entran de a una, con el resaltador amarillo que se "pinta" de izquierda a derecha.
- Las pantallas de la app aparecen dentro de un marco de celular simple (dibujado con CSS, sin marcas reales).
- Subtítulos siempre visibles (mucha gente lo ve sin sonido), en zona segura para Reels/TikTok: nada importante en el 15 % de arriba ni en el 20 % de abajo.
- Sonido: dejá preparado el lugar para una pista de música (`public/musica.mp3`) y efectos de "pop" sincronizados con cada paso; si no hay archivo, que renderice igual sin audio.

## Entregables
- `out/cobra-reel-30s.mp4`, `out/cobra-reel-15s.mp4` y `out/cobra-horizontal-30s.mp4`.
- Una **miniatura** (PNG 1080×1920) del mejor cuadro.
- **El caption listo para pegar** en Instagram/TikTok: corto, en voseo, con el link y 5–8 hashtags relevantes (#pymes #emprendedores #cobranzas #argentina…). Sin emojis de más.
- Un resumen corto de cómo cambiar textos o precios y volver a renderizar (`npx remotion render`).

Antes de darlo por terminado, renderizá, mirá los cuadros clave (un PNG por escena con `npx remotion still`) y corregí textos cortados, superposiciones o cosas fuera de la zona segura.
