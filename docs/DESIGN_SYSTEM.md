# Sistema de diseño de Cobra+ (by PrimerosPrecios)

## Principio: familia PrimerosPrecios, y que se entienda al toque
Cobra+ usa el mismo lenguaje visual que primerosprecios.com (toolkit y Academia). Lo que la distingue es el contenido: el mes de un cliente contado día por día.

Regla número uno: **en cinco segundos se tiene que entender qué es y qué hace.** Primero viene la explicación literal ("Anotás a quién le cobrás… Cobra+ les manda el recordatorio por email… deja de escribirles cuando te pagan"). La personalidad viene después y nunca reemplaza la explicación.

## Logo y nombre
El producto se llama **Cobra+** (se lee "cobra plus"). El logo es la palabra "Cobra" dibujada a mano con un "+" arriba a la derecha (original en `public/brand/cobra-plus-original.png`, azul `#1D4ED8`).

| Uso | Archivo |
|---|---|
| Sobre fondo claro | `public/brand/cobra-plus-blue-sm.png` (azul) |
| Sobre azul tinta (barra lateral, login) | `public/brand/cobra-plus-white-sm.png` (blanco) |
| Ícono del sitio y de la app | `src/app/icon.png` y `src/app/apple-icon.png`: la "C" con el "+" sobre azul |

Siempre con el componente `Logo` (`withBy` suma "by PrimerosPrecios"; `withWord={false}` deja sólo el ícono). En textos se escribe "Cobra+", nunca "COBRA" ni "Cobra Plus".

## Color (tokens en `src/app/globals.css`, tema único claro como PrimerosPrecios)

**Marca**

| Token | Valor | Uso |
|---|---|---|
| `--bg` / `--bg-deep` | `#FBF7F1` / `#F5EEE3` | Crema de PrimerosPrecios. Las secciones alternan entre los dos |
| `--surface` / `--surface-2` / `--surface-3` | `#FFF` / `#FCFAF7` / `#F4EEE6` | Tarjetas, campos y pastillas neutras |
| `--ink` / `--navy` | `#16233B` | Texto, bordes duros, barra lateral, bloques azules |
| `--brand` | `#FF6A1A` | Botón principal (con texto tinta), íconos y acentos. **Nunca como texto sobre claro** |
| `--brand-text` | `#C2410C` | Naranja legible sobre claro |
| `--marker` | `#FFDE5C` | Resaltado de titulares y rótulos "Ejemplo" |

**Acentos**

`*-bright` se usa para rellenos e íconos; el tono base, para texto, porque pasa AA.

| Acento | Base | Bright | Soft |
|---|---|---|---|
| Menta (`ok`) | `#0B7F62` | `#13B58C` | `#E4F6F0` |
| Ámbar (`warn`) | `#9A5B00` | `#F5A623` | `#FDF1DD` |
| Rojo (`danger`) | `#C7353A` | `#EF4D52` | `#FDE9EA` |
| Azul (`info`) | `#2456D6` | `#2F6BFF` | `#EAF1FF` |
| Violeta (`purple`) | `#6A3DF0` | `#7C4DFF` | `#F0EAFF` |

## Tipografía
| Rol | Fuente |
|---|---|
| Titulares, botones e importes (`.money`) | **Poppins** 800–900, apretada (−0.03 a −0.045 em) |
| Texto | **Figtree** |
| Libreta escrita a mano (`.birome`) | **Caveat**, sólo en la sección "Por qué existe" |
| Rótulos (`.label`, `.eyebrow`) | Figtree 800 en mayúsculas espaciadas. El eyebrow lleva el guion naranja del toolkit |

En CSS propio, las fuentes se referencian con las variables de `next/font` (`--font-poppins`, `--font-body`, `--font-caveat`).

## Componentes y recursos
| Recurso | Clase / componente | Notas |
|---|---|---|
| Botón principal | `Button` / `ButtonLink` | Naranja con texto tinta, borde de 2 px y sombra dura que se hunde. `secondary` es blanco y `dark` es azul con sombra naranja |
| Tarjeta secundaria | `.soft`, `Card` | Blanca, radio de 22–28 px, borde fino `--line-2` |
| Tarjeta protagonista | `.hard`, `Card hard` | Borde tinta + sombra dura. Una por sección como mucho |
| Encabezado azul | — | Franja `bg-navy` arriba de la tarjeta protagonista, como "Costos y ganancia" del toolkit |
| Baldosa de ícono | `IconTile` | Fondo soft + ícono del color del acento |
| Pastilla de estado | `Badge` | Redonda, Figtree 800 |
| Campos | `Input`, `Select`, `Field` | Crema con foco naranja y halo, como el registro de PrimerosPrecios |
| Marcador | `.marker` | Resalta una frase por titular, no más |
| Fondo cuadriculado | `.grid-paper` | Hero, autenticación y fondo de la app |
| Sello | `.stamp` | **PAGADO**, sólo para pagos |

## La landing: 9 bloques, una idea cada uno
1. **¿Qué es Cobra+?** La pregunta enorme y la respuesta con marcador, a la izquierda; el botón a la derecha. Debajo, `HeroSteps`: los 4 pasos a la vista, cada uno con su pantalla de ejemplo.
2. **Para quién:** franja azul con los rubros.
3. **Un ejemplo completo:** `MonthStrip`, el mes de un cliente.
4. **Personas:** `HumanCases`, cuatro situaciones reales ("Mañana te transfiero") y lo que hace Cobra+ en cada una. Sale de `MARKET_RESEARCH.md`.
5. **Tu panel:** `PanelDemo`.
6. **Los emails:** bloque azul con `EmailPreview` (el que recibe el cliente) y `DigestPreview` (el resumen que recibe quien cobra).
7. **Precios:** con selector de moneda (pesos o dólares) y de frecuencia.
8. **Preguntas:** título a la izquierda y lista con líneas a la derecha.
9. **Cierre** naranja con el eslogan.

Antes de agregar una sección, preguntarse cuál sale. Cada bloque tiene un solo protagonista.

## Lo que no se usa
Nada de esto explica el producto, así que no va: manchas de color difuminadas, degradados, brillos, vidrio esmerilado, elementos flotando, apariciones al hacer scroll, tarjetas que se elevan al pasar el mouse, semáforos de ventana en las capturas, pastillas arriba del titular y todo centrado. Los titulares van a la izquierda, las secciones se separan con una línea fina y el fondo es el cuadriculado de PrimerosPrecios en toda la página.

## Piezas propias de Cobra+
- **`HeroSteps`**: los 4 pasos (cargás a tu cliente, Cobra+ le avisa, te paga y lo marcás, a vos también te avisa). En escritorio es una tira de izquierda a derecha unida por una línea punteada; en celular, una línea de tiempo vertical. No tiene JavaScript.
- **`MonthStrip`**: el mes de un cliente de ejemplo, del 1 al 21 de noviembre. Se reproduce sola cuando entra en pantalla y cuenta en una frase lo que pasa cada día. Se puede tocar otro día de pago o "¿Y si no paga?". En escritorio es una tira de una fila; en celular, un calendario de 7 columnas.
- **`PanelDemo`**: tres totales y cuatro clientes. "Pagó" hace caer el sello y recalcula los totales.
- **`EmailPreview`** y **`DigestPreview`**: los dos emails, con lo variable resaltado en el del cliente.
- **Fuera de la landing, pero en el repo:** `ChaseCalculator` (calculadora de horas) y, en `story.tsx`, `LibretaVsCobra` y `ExcuseBubbles`.

## App
- Barra lateral azul (`bg-navy`) con el ítem activo en naranja y texto tinta, como "Mi negocio" de PrimerosPrecios. Lo que todavía no existe dice "Pronto" y no tiene link.
- Contenido sobre crema cuadriculada. Los títulos de página llevan eyebrow y marcador.

## Reglas
- Toda demo con datos inventados lleva el rótulo **"Ejemplo"**.
- Nada de testimonios, cantidad de usuarios ni calificaciones inventadas.
- El naranja va de fondo con texto tinta, o como acento. Sobre azul sí puede ir como texto.
- `prefers-reduced-motion` apaga la reproducción automática, las etiquetas flotantes, las apariciones al scrollear y los sellos animados.

## Voz
- Voseo rioplatense y frases literales: "Cargás tus clientes", "Cobra+ les avisa", "Marcás quién pagó".
- Antes de ser ingeniosa, que se entienda.
- Los botones dicen lo que pasa: "Probalo gratis 14 días", "Crear mi cuenta gratis", "Pagó".
