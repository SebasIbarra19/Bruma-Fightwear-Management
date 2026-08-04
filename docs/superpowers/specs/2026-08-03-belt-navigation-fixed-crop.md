# Spec: BeltNavigation — barra fija y cinturón recortado en ambos extremos

**Fecha:** 2026-08-03
**Base:** `2026-08-03-belt-navigation-scale-up.md`
**Alcance:** cambia el modelo geométrico (el marco deja de ser el cinturón).
No cambia componentes, estado de ruta ni la duración de la animación.

## Objetivo

1. La barra deja de scrollear con la página: queda fija.
2. No se ven los extremos del cinturón. Debe leerse como una foto recortada
   que continúa fuera de pantalla, arriba y abajo.
3. El corte inferior cae justo por encima del parche negro, que deja de
   verse.
4. El ancho de la columna no cambia: sigue en 176px.

## Restricción geométrica

Para que el parche quede fuera del marco **y** el borde superior quede
cortado hace falta:

```
patchTop_px > alturaViewport
patchTop_px = patchFraction · beltH = patchFraction · beltW / aspect
```

Con `beltW = 176px` y viewport de 900px, el peor caso (negro, patch en
0.742) da `patchTop = 855px < 900px`. **A la escala actual las dos
condiciones son incompatibles**: o asoma el parche, o asoma el borde
superior.

La única salida que mantiene la columna en 176px es **agrandar la imagen y
recortarla** — literalmente "solo cortar la imagen". El cinturón pasa a ser
más ancho que la columna y se sale por los lados.

## Modelo nuevo

El marco deja de representar al cinturón y pasa a representar la **ventana
de recorte**: `100vh` de alto, 176px de ancho, `overflow: hidden`. El
cinturón es más grande que la ventana en los tres ejes visibles.

```
TOP_CROP        = 0.10                          // 10% del viewport recortado arriba
EARLIEST_PATCH  = min(patch[0]) = 0.742         // el negro, el que antes empieza
BELT_SCALE      = (1 + TOP_CROP) / EARLIEST_PATCH = 1.4825
```

`BELT_SCALE` es la altura del cinturón en múltiplos del alto del marco. Se
deriva del parche que empieza antes, así que **un único valor sirve para
los cinco grados**: garantiza que ningún parche entre en la ventana.

Que la altura del cinturón sea la misma en los cinco preserva la
consistencia de slots lograda en el ajuste anterior (dispersión 1.5px).

Todo se expresa en % del marco, sin medición en JS:

```
imageHeight = BELT_SCALE · (canvasH / bboxH) · 100        // % del alto del marco
imageTop    = −TOP_CROP·100 − BELT_SCALE · (y0/bboxH) · 100
imageShiftX = −((x0+x1)/2 / canvasW) · 100                // % del ancho de la imagen
panel.top    = −TOP_CROP·100 + panel[0] · BELT_SCALE · 100
panel.height = (panel[1] − panel[0]) · BELT_SCALE · 100
```

El centrado horizontal usa `left: 50%` más `translateX(imageShiftX%)`: el
porcentaje es del ancho de la propia imagen, así que sitúa el centro del
bbox en el centro del marco sin depender de píxeles.

## Fijado

`lg:sticky lg:top-0 lg:h-screen` en el `<aside>`.

Se usa `sticky` y no `fixed` porque mantiene el elemento en el flujo: la
columna sigue reservando sus 176px y el contenido no queda por debajo. Con
`h-screen` el elemento mide exactamente el viewport, que es la condición
que antes faltaba — un elemento más alto que la pantalla nunca llega a
mostrar su mitad inferior al fijarse.

El `pt-4` del contenedor de `AdminLayout` se mueve al `<main>`, para que la
columna arranque pegada al borde superior y el corte del cinturón llegue
hasta arriba.

## Simplificación del marcador

`k` y `markerOffset` desaparecen. Con el marco desacoplado del cinturón,
`k` dejaba de ser constante: dependía de la razón alto/ancho del marco, que
ahora varía con el viewport.

Se reemplaza por un envoltorio del alto de **un slot** (`100/8 %` del
track) desplazado `translateY(activeIndex · 100%)` — porcentaje de su
propia altura, es decir exactamente un slot por unidad. La cinta va
centrada dentro de ese envoltorio con su propia proporción.

Más simple que la fórmula anterior, y robusto ante cualquier dimensión del
marco.

## Consecuencias

- El cinturón pasa a ~204px de ancho dentro de una columna de 176px: se
  recortan ~14px por lado. Se pierden los bordes tejidos laterales.
- El parche queda fuera del marco, así que **`BrandPatch` deja de tener
  sentido** y se elimina junto con su render. El selector de grado, que
  vivía dentro del parche, pasa a estar superpuesto al pie de la columna.
- Si más adelante llega la imagen oficial de Bruma para el parche, habrá
  que decidir otro emplazamiento. Queda en FINDINGS.md.

## Verificación

`npm run type-check` + navegador:

1. El borde superior del cinturón queda fuera del marco (imagen con `top`
   negativo).
2. El parche queda fuera del marco en los cinco grados.
3. La columna mide 176px y el cinturón la desborda por ambos lados.
4. El cinturón no se deforma.
5. La barra no se mueve al scrollear la página.
6. Slots consistentes entre grados y ≥44px.
7. Estado de ruta al cargar y deslizamiento de la cinta siguen intactos.
