# Spec: BeltNavigation — escalado, cinta a ancho completo y labels

**Fecha:** 2026-08-03
**Base:** `2026-08-03-belt-navigation-design.md` (implementado y verificado)
**Alcance:** ajuste directo sobre lo existente. No cambia la arquitectura de
componentes, el modelo de estado de ruta, ni la animación.

> **Ajuste posterior (mismo día):** el ancho de 280px resultó excesivo en
> pantalla. Se redujo a **220px** (cinturón ~1441px de alto, slots 50.8–71.5px,
> todos sobre 44px). El selector de grado se movió *dentro* del parche negro
> inferior en vez de encima del cinturón, y el padding superior del layout bajó
> de `py-12` a `pt-4`. Las cifras de abajo están actualizadas a 220px.

## Problemas a resolver

1. **La cinta se ve mucho más angosta que el cinturón.** Causa medida:
   `Tape.png` tiene márgenes transparentes. Canvas 772×323, pero el bbox
   opaco es `[76, 39, 722, 279]` → 647×241, es decir **83.8% del ancho del
   canvas**. Como el contenedor usaba el aspect del canvas (2.3901), la
   cinta *visible* quedaba en ~84% del ancho del cinturón. Su proporción
   real es **2.6846**, no 2.3901.
2. **El cinturón es demasiado pequeño** y sobra espacio horizontal
   alrededor: la columna medía 150px con un cinturón de 118.5px, dejando
   ~32px de holgura muerta.
3. **Los ítems perdieron sus nombres.** A 27.4px de alto y 118px de ancho
   solo cabía el ícono. Se pidió recuperar los labels reales.

## Cambios

### 1. Recorte de la cinta al bbox visible

Se aplica a `Tape.png` la misma técnica de encuadre que ya usa el
cinturón: el contenedor representa el rect *visible* de la cinta y la
imagen se escala y desplaza dentro con `overflow: hidden`.

```
TAPE_BBOX    = [76, 39, 722, 279]        // opaco, medido
TAPE_ASPECT  = 647 / 241 = 2.6846        // visible, reemplaza 2.3901 (canvas)

img.width = 772 / 647 · 100% = 119.32%
img.left  = −76 / 647 · 100% = −11.75%
img.top   = −39 / 241 · 100% = −16.18%
```

Resultado: la cinta visible ocupa **exactamente el 100% del ancho del
cinturón**, cumpliendo el mínimo pedido, y conserva su proporción real.

`TAPE_ASPECT` alimenta `k`, así que la razón cinta/slot se recalcula sola:

| grado | k (nuevo) | cinta / slot |
|---|---|---|
| white | 0.734 | 1.36× |
| blue | 0.872 | 1.15× |
| purple | 0.731 | 1.37× |
| brown | 0.837 | 1.20× |
| black | 0.620 | 1.61× |

Sigue superponiéndose a los vecinos (sigue siendo invariante a la escala),
pero menos que antes, porque la cinta real es más chata que su canvas.

### 2. El cinturón se dimensiona por ancho, no por alto

Antes: alto acotado al viewport (`h-[calc(100vh-6rem)]`) con `sticky`, y el
ancho salía de ahí (~118px).

Ahora: **el ancho manda**. La columna pasa a `lg:w-[220px]` y el marco lo
llena por completo; el alto lo deriva `aspect-ratio`:

```
beltH = 220 / aspect     // negro: 1441px · azul: 1481px · morado: 1426px
```

Se eliminan `sticky`, el tope de alto por viewport y `flex-1 min-h-0`. El
cinturón excede el viewport y la página scrollea, que es el comportamiento
pedido explícitamente.

`sticky` se retira porque es incompatible con un elemento más alto que el
viewport: se fijaría apenas su borde superior alcanza el offset y su mitad
inferior nunca sería alcanzable.

Con la columna igual al ancho del cinturón desaparece la holgura lateral.

Efecto sobre el panel (negro, el más ajustado de los cinco):

| | antes | ahora |
|---|---|---|
| ancho del cinturón | 118.5px | 220px |
| alto del cinturón | 776px | 1441px |
| alto de slot | 27.4px | **50.8px** |

50.8px (negro, el más ajustado; el resto va de 59.9 a 71.5px) supera la
recomendación de 44px, así que el hallazgo de accesibilidad abierto en
FINDINGS.md queda resuelto por este cambio.

Además el padding superior del layout baja de `py-12` a `pt-4`, para que el
cinturón y el encabezado de página arranquen más cerca del borde.

### 3. Labels restaurados

`NavigationButton` vuelve a mostrar ícono + nombre, con los labels reales
ya existentes en `NAV` (Dashboard, Inventory, Movements, Orders, Invoicing,
Catalog, Activity Log, Statistics). A 220px de ancho de panel, el más largo
("Activity Log") entra sin recortarse.

`aria-label` se conserva: ahora es redundante con el texto visible, pero
mantiene la etiqueta accesible estable e independiente del truncado. Se
retira `title`, porque un tooltip que repite texto ya visible es ruido.

**Legibilidad sobre la cinta.** El ítem activo queda sobre el esparadrapo
blanco: ícono y texto van en `text-obsidian`. Los inactivos van sobre el
panel oscuro, en `text-bone`.

Los vecinos no se solapan con la cinta pese a que ésta invade su slot: con
el peor caso (negro, 1.61×) la cinta entra 15.3px sobre un slot de 50.8px,
y el texto del vecino está centrado a 25.4px de la frontera — queda aire
suficiente.

### 4. Selector de grado dentro del parche

`BeltPicker` se monta como children de `BrandPatch`, es decir dentro del
parche negro cosido en la parte baja del cinturón. Deja de flotar fuera de
la fotografía y ocupa un espacio que ya existía vacío. Los puntos suben de
12 a 16px, que es lo que pide el nuevo tamaño del parche.

## Sin cambios

Arquitectura de componentes, `belts.ts` como fuente de geometría, derivación
del índice activo durante el render, transición de 260ms, encuadre del
cinturón por bbox, exclusión de mobile.

`BrandPatch` deja de estar vacío: aloja el selector de grado. Cuando llegue
la imagen oficial de Bruma habrá que decidir si conviven o si el selector se
reubica.

## Verificación

`npm run type-check` + navegador:

1. Ancho visible de la cinta == ancho del cinturón (medir el rect del
   contenedor de la cinta contra el del marco).
2. Cinta sin deformar: rect renderizado ≈ 2.6846.
3. Cinturón sin deformar en los 5 grados.
4. Slot ≥ 44px de alto en los 5 grados.
5. Los 8 labels visibles y sin truncar.
6. Slots contenidos dentro del panel en los 5 grados.
7. Estado de ruta al cargar directo, y deslizamiento al navegar, siguen
   funcionando (vía WAAPI: la pestaña de preview no compone cuadros).
