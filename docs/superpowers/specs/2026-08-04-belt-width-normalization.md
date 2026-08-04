# Spec: BeltNavigation — escala por cinturón (ancho consistente + marrón recalculado)

**Fecha:** 2026-08-04
**Base:** `2026-08-03-belt-navigation-fixed-crop.md`
**Alcance:** cambia `BELT_SCALE` (constante global) por una escala por
cinturón en `belts.ts`. No cambia componentes React, el modelo de estado de
ruta, la animación de la cinta, ni `TOP_CROP`.

## Problema

1. **Azul se ve visiblemente más delgado que blanco/morado.** Medido: su
   bbox tiene aspect ratio (ancho/alto) 0.1373, contra 0.1527–0.1542 de
   blanco/morado/negro — 10.7% más angosto en la foto real, no un bug de
   renderizado. El sistema actual escala todos los cinturones por la misma
   fracción de altura del marco (`BELT_SCALE` global) y deja que el ancho
   siga la proporción natural de cada foto — por eso una foto con aspect
   más angosto renderiza visiblemente más delgada.
2. **Marrón tiene metadata completamente obsoleta.** Su archivo fuente
   (`Brownbelt-Photoroom.png`, mismo nombre, contenido reemplazado el
   2026-08-04) cambió de 1334×800 a 1619×972. `belts.ts` todavía tenía
   `canvas`/`bbox`/`panel`/`patch` de la foto anterior — no solo
   desalineado, sino midiendo un archivo que ya no existe.

## Por qué "ancho fijo en px" no es viable

La columna (`aside`) es fija en 176px, pero el marco (`h-screen`) mide
`100vh` — varía con la altura del viewport. Anclar el ancho del cinturón a
un valor fijo en px fija también su altura en px (mismo aspect ratio), y en
un viewport suficientemente alto esa altura fija dejaría de alcanzar para
tapar el parche — rompiendo la garantía de recorte que el diseño anterior
(`fixed-crop`) estableció deliberadamente en fracciones de altura del
marco, precisamente para que escalara con el viewport y esa garantía nunca
se rompiera.

## Diseño: escala por cinturón, no una constante global

Cada cinturón obtiene su propia escala (`beltHeight / frameHeight`),
calculada como el **máximo** de dos requisitos, ambos expresados en
fracción de la altura del marco — nunca en píxeles absolutos, así que la
garantía de recorte se mantiene a cualquier altura de viewport:

```
escala_seguridad_i = (1 + TOP_CROP) / patch_i[0]   // lo mínimo para tapar el parche (mecanismo ya existente)
escala_ancho_i     = k_width / aspect_i             // lo necesario para igualar el ancho de referencia
escala_i           = max(escala_seguridad_i, escala_ancho_i)
```

`k_width` es una constante fijada una única vez, derivada de blanco tal
como se ve **hoy** (la escala global actual, 1.4825, es en los hechos "la
escala que necesita negro para taparse, aplicada a todos" — blanco no
tiene una escala propia hoy, hereda la de negro por ser una constante
compartida):

```
k_width = BELT_SCALE_actual · aspect_white = 1.4825 · 0.1528 = 0.22655
```

Por construcción, `escala_ancho_i` nunca puede violar la seguridad de
recorte de OTRO cinturón (cada uno usa su propio `patch_i[0]`), y el `max`
garantiza que ningún cinturón quede por debajo de lo que su propia foto
necesita para taparse — la propiedad de robustez del diseño anterior se
preserva exactamente, ahora por cinturón en vez de por un peor-caso
compartido.

## Valores resultantes (medidos, no estimados)

| Cinturón | aspect | patch[0] | escala hoy | escala nueva | Δ |
|---|---|---|---|---|---|
| blanco | 0.1528 | 0.789 | 1.4825 | 1.4825 | 0% (referencia) |
| morado | 0.1542 | 0.790 | 1.4825 | 1.4693 | −0.9% |
| negro | 0.1527 | 0.742 | 1.4825 | 1.4836 | +0.07% |
| azul | 0.1373 | 0.783 | 1.4825 | **1.6501** | **+11.3%** |
| marrón | 0.1440 | 0.778 | *(obsoleta)* | **1.5733** | recalculado desde cero |

Blanco, morado y negro cambian menos de 1% — imperceptible, preserva la
apariencia ya aprobada. Azul y marrón se escalan hacia arriba (más anchos
**y** más altos, proporcionalmente — nunca se deforma un eje sin el otro).

**Efecto colateral no buscado pero verificable:** el slot de azul pasa de
40.9px (bajo el mínimo de accesibilidad de 44px, hallazgo abierto en
FINDINGS.md) a un estimado ~54.6px a 900px de alto de marco — la
normalización de ancho resuelve también ese hallazgo, sin que se pidiera
explícitamente. Se verifica en ejecución, no se asume.

## Datos de marrón (remedidos de la foto actual)

```
canvas: [1619, 972]
bbox:   [721, 34, 848, 922]   (aspect 0.1440)
panel:  [0.164, 0.462]
patch:  [0.778, 0.976]
```

Medido con la misma metodología que el resto (decodificación PNG +
barrido fila a fila para localizar transiciones negro/tela), confirmado
por dos métodos independientes.

## Cambios de código

`src/components/navigation/belts.ts`:

- `BELT_SCALE` (constante global, `(1+TOP_CROP)/EARLIEST_PATCH`) se
  reemplaza por una función que calcula la escala por cinturón según la
  fórmula de arriba. `EARLIEST_PATCH` deja de usarse como tal — cada
  cinturón usa su propio `patch[0]`, no el mínimo compartido.
- `beltGeometry(id)` usa la escala del cinturón `id`, no la constante
  global, en el cálculo de `imageHeight`, `imageTop` y `panel`.
- `BELTS.brown` se actualiza con los valores medidos arriba.
- `k_width` se calcula una vez a partir de los valores *actuales* de
  `white` (no se hardcodea el número 0.22655 directamente, para que quede
  trazable si alguna vez cambia la foto de blanco).

Ningún componente (`BeltImage`, `BeltMarker`, `NavigationItems`,
`NavigationButton`, `BeltPicker`, `BeltNavigation`) cambia — todos ya
consumen `beltGeometry(id)` sin saber si la escala es global o por
cinturón.

## Verificación

`npm run type-check` + navegador, para los 5 grados:

1. Blanco, morado, negro: ancho renderizado cambia menos de 1% respecto de
   antes de este cambio.
2. Azul, marrón: ancho renderizado igual (dentro de tolerancia de
   redondeo) al de blanco.
3. Los 5: cinturón sin deformar (`renderedAspect ≈ naturalAspect`).
4. Los 5: borde superior oculto, parche fuera del marco (la garantía de
   recorte del diseño anterior, ahora por cinturón).
5. Los 5: slots dentro del panel, ≥44px de alto.
6. Marrón específicamente: panel/parche caen en píxeles negros reales de
   la foto actual (no en tela), verificable por muestreo de color o por
   inspección visual del render.
7. Estado de ruta y animación de la cinta sin regresión (ya cubiertos por
   trabajo anterior, se revalida que nada se rompió).
