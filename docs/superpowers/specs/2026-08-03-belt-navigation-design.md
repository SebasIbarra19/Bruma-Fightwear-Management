# Diseño: BeltNavigation — navegación lateral sobre fotografía de cinturón BJJ

**Fecha:** 2026-08-03
**Agentes:** developer (arquitectura de componentes, estado, geometría) + visual-designer (tratamiento fotográfico, animación de la cinta)
**Fuente de verdad de assets:** `public/brand/BJJ-belts/`

## Qué se construye

Reemplazar `AdminSidebar` por `BeltNavigation`: una barra lateral cuyo
soporte visual es la fotografía real de un cinturón de Brazilian Jiu-Jitsu.
Los 8 ítems de navegación viven dentro del panel de grados (la sección
oscura del cinturón) y el indicador de ruta activa es una fotografía de
cinta de esparadrapo que se desliza verticalmente entre ellos.

## Decisiones tomadas (y desviaciones respecto del brief original)

El brief pedía una implementación **en paralelo** conservando la
navegación actual. El usuario revirtió esa restricción durante la
auditoría PASO 0: **se reemplaza `AdminSidebar` directamente**, sin
toggle ni ruta de demo. Las demás desviaciones acordadas:

1. **Se eliminan** el botón `Disconnect`, el HUD "Admin HUD" y el footer
   "System Online / Bruma Protocol V.3". Consecuencia registrada en
   FINDINGS.md: la app queda sin ruta de logout en la UI; reubicarlo está
   fuera de alcance.
2. **Selector de grado visible** para el usuario (el brief solo pedía una
   prop), persistido en `localStorage`, default `black`.
3. **Ítems icon-only**: el cinturón mide ~15% de su altura en ancho
   (~122px a 800px de alto); no caben labels. Los labels sobreviven como
   `aria-label` + `title`.
4. **La cinta se superpone a los slots vecinos**: es geométricamente
   inevitable (ver "Conflicto de la cinta"), y es el comportamiento
   aprobado — una cinta física pegada sobre el panel se ve así.

## Auditoría de assets (medida, no estimada)

Decodificación real de los PNG (zlib + defiltrado) para obtener el
bounding box del cinturón dentro de cada canvas y las zonas funcionales
como fracción de la altura del cinturón:

| Grado | canvas | bbox `[x0,y0,x1,y1]` | aspect (w/h) | panel de grados | parche |
|---|---|---|---|---|---|
| white | 1334×800 | 613, 27, 728, 785 | 0.1528 | 0.192 – 0.526 | 0.789 – 0.974 |
| blue | 841×1264 | 333, 44, 508, 1228 | 0.1485 | 0.170 – 0.556 | 0.785 – 0.970 |
| purple | 1334×800 | 617, 23, 734, 787 | 0.1542 | 0.193 – 0.529 | 0.790 – 0.973 |
| brown | 1334×800 | 611, 27, 727, 784 | 0.1544 | 0.181 – 0.566 | 0.790 – 0.979 |
| black | 842×1264 | 338, 61, 504, 1154 | 0.1527 | 0.194 – 0.476 | 0.742 – 0.955 |

`Tape.png`: 772×323 → aspect 2.3902.

Notas de medición:
- Los canvas no son homogéneos (blanco/morado/marrón son landscape con el
  cinturón centrado; azul/negro son portrait). Por eso **todo se posiciona
  contra el bbox del cinturón, nunca contra el canvas**.
- El panel del cinturón negro es rojo, no negro: se detectó por saturación
  (`r - (g+b)/2 > 25`) en vez de por luminancia.
- El parche del negro es negro-sobre-negro: se detectó por textura (banda
  de baja desviación estándar frente al tejido del cinturón). El detector
  devolvió `[0.742, 0.981]`; el extremo inferior se acotó a `0.955` porque
  la punta deshilachada del cinturón también lee como superficie lisa.

## Modelo geométrico

Todo deriva de la altura del contenedor. No hay medición en JS, ni
`ResizeObserver`, ni listeners de resize: la geometría completa se expresa
en CSS con porcentajes y `aspect-ratio`.

**Encuadre del cinturón.** Un wrapper de `height: 100%` y
`aspect-ratio: <aspect>` define el rectángulo del cinturón. Dentro, la
`<img>` se posiciona en absoluto y se escala para que su bbox coincida
exactamente con el wrapper:

```
img.width  = canvasW / bboxW · 100%    // % del ancho del wrapper
img.left   = −x0 / bboxW · 100%        // % del ancho del wrapper
img.top    = −y0 / bboxH · 100%        // % de la altura del wrapper
```

donde `bboxW = x1 − x0 + 1` y `bboxH = y1 − y0 + 1`. Solo se fija `width`
en la imagen; la altura queda implícita, así que la proporción original es
matemáticamente imposible de romper.

Con `overflow: hidden` en el wrapper, el canvas sobrante queda recortado y
el cinturón llena el marco sin deformarse. La proporción se preserva
siempre porque solo se fija `width` en la imagen.

**Zonas.** Como el wrapper *es* el cinturón, panel y parche son
porcentajes directos de su altura:

```
track (panel):  top = panel0·100%      height = (panel1 − panel0)·100%
patch:          top = patch0·100%      height = (patch1 − patch0)·100%
```

**Slots.** El track contiene 8 filas iguales (`flex-direction: column`,
`flex: 1` cada una). No hay cálculo de posición por ítem.

**Posición de la cinta.** La cinta vive dentro del track, con
`width: 100%` y `aspect-ratio: 2.3902` (conserva su proporción real). Su
desplazamiento se expresa en porcentaje **de su propia altura**, lo que
elimina toda dependencia de píxeles:

```
k = ((panel1 − panel0) / 8) · 2.3902 / aspect     // slotH / tapeH, constante por grado
translateY(%) = (i · k − (1 − k) / 2) · 100
```

`k` por grado: white 0.653, blue 0.777, purple 0.651, brown 0.745,
black 0.552. Es decir, la cinta mide entre 1.29× (azul) y 1.81× (negro) la
altura de un slot.

**Conflicto de la cinta.** `tapeH = beltW / 2.3902 = aspect · beltH /
2.3902` y `slotH = (panel1 − panel0) · beltH / 8`. Ambos escalan
linealmente con `beltH`, así que su razón es constante: **la cinta siempre
es más alta que un slot, a cualquier escala**. Escalar el cinturón no lo
resuelve. La resolución aprobada es dejar que se superponga, con
`pointer-events: none` para no bloquear los clics de los ítems vecinos.

## Estado de ruta activa

El índice activo se deriva de `usePathname()` **durante el render**, no en
un `useEffect`:

```
activeIndex = NAV.findIndex(item => pathname.startsWith(item.href))
```

Consecuencia buscada: al entrar directo a `/inventory` o al recargar, el
primer render ya emite `translateY` en la posición final. Las transiciones
CSS solo se disparan ante un *cambio* de valor computado, así que no hay
animación de entrada — la cinta simplemente aparece donde corresponde.
Esto satisface el requisito de estado de ruta sin flag de "montado" ni
lógica extra.

`AdminLayout` es un layout de Next App Router: persiste entre rutas del
grupo `(admin)`, así que navegar de `/dashboard` a `/inventory` cambia el
`translateY` de un componente ya montado y la cinta se desliza de verdad.

**Sin coincidencia** (ej. `/profile`, que está fuera del grupo admin pero
podría alcanzarse): `activeIndex === -1` → la cinta se renderiza con
`opacity: 0`, conservando su última posición. No se oculta con
`display: none` para no perder la transición al volver a una ruta válida.

## Animación

```css
transition: transform 260ms cubic-bezier(0.4, 0, 0.2, 1);
```

Dentro del rango pedido (220–300ms), easing estándar sin overshoot ni
rebote. Solo se anima `transform` (compuesto en GPU, sin recálculo de
layout). Se respeta `prefers-reduced-motion: reduce` desactivando la
transición.

## Componentes

| Archivo | Responsabilidad | `'use client'` propio |
|---|---|---|
| `src/components/navigation/belts.ts` | Metadata de los 5 grados, `TAPE_ASPECT`, lista `NAV`, cálculo de `k` | — |
| `src/components/navigation/BeltNavigation.tsx` | Orquesta: resuelve grado activo y `activeIndex`, compone el resto | sí |
| `src/components/navigation/BeltImage.tsx` | Encuadra la foto del cinturón según metadata | no |
| `src/components/navigation/BeltMarker.tsx` | La cinta: `translateY` + transición | no |
| `src/components/navigation/NavigationItems.tsx` | El track de 8 slots dentro del panel | no |
| `src/components/navigation/NavigationButton.tsx` | Un slot: `<Link>` real con ícono, `aria-label`, focus ring | no |
| `src/components/navigation/BrandPatch.tsx` | Contenedor vacío en la zona del parche | no |
| `src/components/navigation/BeltPicker.tsx` | Selector de grado (5 puntos de color) | sí |

Solo `BeltNavigation` y `BeltPicker` declaran `'use client'`. Los demás
son componentes de presentación puros sin estado ni hooks; al ser
importados desde `BeltNavigation` forman parte del bundle de cliente de
todos modos, pero no necesitan la directiva propia y pueden testearse o
reutilizarse en contexto de servidor sin cambios.

**`NAV` es importado, no reescrito.** Los 8 ítems se mueven tal cual desde
`AdminLayout.tsx` a `belts.ts`, con los mismos íconos de `lucide-react`:

| id | ícono | label | href |
|---|---|---|---|
| `dashboard` | `LayoutDashboard` | Dashboard | `/dashboard` |
| `inventory` | `Package` | Inventory | `/inventory` |
| `movements` | `ArrowUpDown` | Movements | `/movements` |
| `orders` | `ShoppingCart` | Orders | `/orders` |
| `invoicing` | `FileText` | Invoicing | `/invoicing` |
| `catalog` | `Tag` | Catalog | `/catalog` |
| `reporting` | `History` | Activity Log | `/reporting` |
| `statistics` | `BarChart3` | Statistics | `/statistics` |

## Selector de grado y persistencia

`BeltPicker` renderiza 5 botones circulares (uno por grado) debajo del
cinturón, en el espacio que liberan Disconnect y el footer.

Persistencia sin romper la hidratación: `useState('black')` en el render
inicial (servidor y primer render de cliente coinciden), y lectura de
`localStorage` en `useEffect`. Si el valor guardado difiere, hay un único
frame con el cinturón negro antes del swap — aceptable, y evita
deliberadamente el patrón que ya produce el warning de hidratación
`data-theme` de `ThemeContext.tsx`.

Clave: `bruma.belt`. Valor inválido o ausente → `black`.

## Accesibilidad

- Cada slot es un `<Link>` real (navegación con teclado y click derecho
  nativos), no un `div` con `onClick`.
- `aria-label` con el label completo ("Activity Log") y `title` para
  tooltip nativo, ya que el ícono va solo.
- `aria-current="page"` en el ítem activo.
- Anillo de foco visible (`focus-visible:ring-1 ring-ember`) por encima de
  la fotografía, con z-index superior al de la cinta.
- La cinta y todas las capas fotográficas llevan `pointer-events: none` y
  `aria-hidden`, para que nunca intercepten interacción ni ruido de
  lectores de pantalla.
- El slot mide ~33px de alto × ~122px de ancho (≈4000px² de área de
  click). Está bajo la recomendación de 44px de alto, pero es una
  consecuencia directa de la geometría del cinturón aprobada.

## Rendimiento

- Las 5 fotos + la cinta se cargan mediante `next/image`. Solo se monta la
  imagen del grado activo; cambiar de grado cambia el `src`.
- El `priority` va únicamente en el cinturón por defecto; los demás cargan
  bajo demanda al seleccionarlos.
- El único valor que cambia al navegar es el `transform` de la cinta. No
  se remonta ningún componente.

## Cambios en archivos existentes

- `src/components/layout/AdminLayout.tsx`: `AdminSidebar` (la función
  local completa, incluidos NAV, HUD, Disconnect y footer) se elimina y se
  reemplaza por `<BeltNavigation />`. La columna pasa de `lg:w-[280px]` a
  `lg:w-[150px]`.
- Ningún otro archivo cambia.

## Alcance explícitamente excluido

- **Mobile**: por debajo de `lg` el aside actual pasa a `w-full` y se
  apila. Un cinturón vertical ahí daría slots de ~17px. Este trabajo es
  desktop-first (igual que el diseño actual, que ya asume una columna
  lateral de 280px); no se construye una navegación mobile alternativa.
  Se registra como limitación conocida en FINDINGS.md.
- **Imagen de branding del parche**: `BrandPatch` queda como contenedor
  vacío y posicionado, listo para recibir la imagen oficial cuando exista.
- **Reubicar el logout**: fuera de alcance, registrado en FINDINGS.md.

## Verificación

Sin framework de tests instalado en el proyecto (`package.json` no incluye
jest/vitest/testing-library/playwright), la verificación es
`npm run type-check` + comprobación en navegador vía el servidor de
desarrollo:

1. `/dashboard` carga con la cinta alineada al primer slot, sin animación
   de entrada.
2. Entrar directo a `/inventory` (recarga completa): la cinta aparece ya
   en el segundo slot desde el primer frame.
3. Navegar `/inventory` → `/statistics`: la cinta se desliza suavemente,
   sin remount.
4. Los 5 grados renderizan con el cinturón encuadrado y los ítems
   contenidos dentro del panel — verificable midiendo en el navegador que
   el rect de cada slot cae dentro del rect del panel.
5. El cinturón nunca se deforma: comprobar que
   `img.naturalWidth / img.naturalHeight` coincide con el aspect renderizado.
6. Tab recorre los 8 ítems con foco visible.
