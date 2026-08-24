import {
  LayoutDashboard,
  Package,
  ArrowUpDown,
  ShoppingCart,
  FileText,
  Tag,
  History,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'

/**
 * Navegación admin. Movida tal cual desde AdminLayout.tsx — estos ids,
 * labels, rutas e íconos son los reales y no deben inventarse ni renombrarse.
 */
export interface NavItem {
  id: string
  icon: LucideIcon
  label: string
  href: string
}

export const NAV: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { id: 'inventory', icon: Package, label: 'Inventory', href: '/inventory' },
  { id: 'movements', icon: ArrowUpDown, label: 'Movements', href: '/movements' },
  { id: 'orders', icon: ShoppingCart, label: 'Orders', href: '/orders' },
  { id: 'invoicing', icon: FileText, label: 'Invoicing', href: '/invoicing' },
  { id: 'catalog', icon: Tag, label: 'Catalog', href: '/catalog' },
  { id: 'reporting', icon: History, label: 'Activity Log', href: '/reporting' },
  { id: 'statistics', icon: BarChart3, label: 'Statistics', href: '/statistics' },
]

export type BeltId = 'white' | 'blue' | 'purple' | 'brown' | 'black'

export const BELT_IDS: BeltId[] = ['white', 'blue', 'purple', 'brown', 'black']

export const TAPE_SRC = '/brand/BJJ-belts/Tape.png'

/** Canvas completo de Tape.png. */
export const TAPE_CANVAS = [772, 323] as const

/**
 * Bbox opaco de la cinta dentro de su canvas: [x0, y0, x1, y1], medido.
 * El PNG trae márgenes transparentes —la cinta visible es apenas el 83.8%
 * del ancho del canvas—, así que encuadrar contra el canvas la dejaba
 * visiblemente más angosta que el cinturón.
 */
export const TAPE_BBOX = [76, 39, 722, 279] as const

/**
 * Proporción de la cinta *visible* (647/241), no la del canvas (2.3901).
 * Gobierna el ALTO de la cinta una vez fijado su ancho (100% del marco, ver
 * `BeltMarker.tsx`). Es la proporción real del PNG: respetarla es lo que
 * mantiene intactos los bordes dentados de arriba y abajo — cualquier
 * esquema que fije el alto por otra vía obliga a recortarlos.
 */
export const TAPE_ASPECT =
  (TAPE_BBOX[2] - TAPE_BBOX[0] + 1) / (TAPE_BBOX[3] - TAPE_BBOX[1] + 1)

/** Encuadre de la imagen de la cinta dentro de su rect visible, en %. */
export const TAPE_IMAGE = {
  width: (TAPE_CANVAS[0] / (TAPE_BBOX[2] - TAPE_BBOX[0] + 1)) * 100,
  left: (-TAPE_BBOX[0] / (TAPE_BBOX[2] - TAPE_BBOX[0] + 1)) * 100,
  top: (-TAPE_BBOX[1] / (TAPE_BBOX[3] - TAPE_BBOX[1] + 1)) * 100,
}

interface BeltSpec {
  src: string
  /** Dimensiones del PNG completo. */
  canvas: readonly [number, number]
  /** Recorte del cinturón dentro del canvas: [x0, y0, x1, y1], inclusivo. */
  bbox: readonly [number, number, number, number]
  /** Panel de grados (zona funcional), como fracción de la altura del cinturón. */
  panel: readonly [number, number]
  /** Parche de branding inferior, como fracción de la altura del cinturón. */
  patch: readonly [number, number]
  /** Color del punto en el selector de grado. */
  swatch: string
  label: string
  /**
   * Filtro CSS opcional aplicado a la foto. Hoy solo lo usa `blue` (color
   * percibido como demasiado brillante/saturado) — no es un mecanismo
   * genérico de "corrección de color" para los cinco, es un ajuste puntual.
   * Valor de partida, no medido a píxel como bbox/panel/patch — ajustable
   * editando esta única línea si hace falta más o menos.
   */
  filter?: string
}

/**
 * Medido decodificando cada PNG (inflate + defiltrado) y analizando píxeles,
 * no estimado a ojo. Los canvas no son homogéneos —blanco/morado/marrón son
 * landscape con el cinturón centrado, azul/negro son portrait— por eso todo
 * se posiciona contra `bbox` y nunca contra `canvas`.
 *
 * `panel` se mide con un umbral **relativo** al color del propio cinturón
 * (mediana del 12% superior), no absoluto. Un umbral fijo de luminancia <70
 * fusionaba el cuerpo del cinturón con el panel en azul (lum 68) y marrón
 * (lum 65), inflando sus paneles a 0.386 y 0.385 y descuadrando el reparto
 * de los ítems respecto de los otros grados.
 *
 * El negro es doble caso especial: su panel es rojo (no oscuro) y está
 * enmarcado por dos franjas blancas que forman parte del panel visual, así
 * que se mide de franja a franja. Detectarlo solo por la zona roja lo dejaba
 * en 0.283 y con slots notoriamente más apretados.
 *
 * Resultado: los cinco paneles caen en 0.328–0.337, como corresponde a una
 * misma línea de producto fotografiada en cinco colores.
 *
 * El parche del negro es negro sobre negro: se detectó por textura (banda lisa
 * frente al tejido). Su borde inferior se acotó a 0.955 porque la punta
 * deshilachada del cinturón también lee como superficie lisa.
 */
export const BELTS: Record<BeltId, BeltSpec> = {
  white: {
    src: '/brand/BJJ-belts/Whitebelt-Photoroom.png',
    canvas: [1334, 800],
    bbox: [613, 27, 728, 785],
    panel: [0.191, 0.527],
    patch: [0.789, 0.974],
    swatch: '#E8E4DA',
    label: 'Cinturón blanco',
  },
  blue: {
    src: '/brand/BJJ-belts/Bluebelt-Photoroom.png',
    // Reemplazada 2026-08-04 por una foto landscape (1627x967), similar a la
    // blanca en formato — la vieja era portrait (841x1264).
    //
    // panel/patch: se probó copiar los valores de `white` (a simple vista el
    // patrón parecía igual), pero un barrido de píxeles fila por fila mostró
    // que el final del panel de blanco (f=0.527) cae en tela azul pura
    // (rgb 10,72,183), no en negro — esta foto tiene el panel más corto. Se
    // volvió a la medición directa de esta imagen, confirmada por dos
    // métodos independientes (detección por bloque + barrido fila a fila):
    // negro entre f=0.169-0.463 (panel) y f=0.783-0.978 (parche).
    canvas: [1627, 967],
    bbox: [724, 30, 846, 925],
    panel: [0.169, 0.463],
    patch: [0.783, 0.978],
    swatch: '#2F4E9E',
    label: 'Cinturón azul',
    filter: 'brightness(0.9) saturate(0.88)',
  },
  purple: {
    src: '/brand/BJJ-belts/Purplebelt-Photoroom.png',
    canvas: [1334, 800],
    bbox: [617, 23, 734, 787],
    panel: [0.193, 0.525],
    patch: [0.790, 0.973],
    swatch: '#5B3A82',
    label: 'Cinturón morado',
  },
  brown: {
    src: '/brand/BJJ-belts/Brownbelt-Photoroom.png',
    // Reemplazada 2026-08-04 (mismo nombre de archivo, foto nueva): pasó de
    // 1334x800 a 1619x972. Los valores de abajo son de la foto actual,
    // medidos por decodificación PNG + barrido fila a fila (negro entre
    // f=0.164-0.462 para el panel, f=0.778-0.976 para el parche),
    // confirmados visualmente contra la imagen.
    canvas: [1619, 972],
    bbox: [721, 34, 848, 922],
    panel: [0.164, 0.462],
    patch: [0.778, 0.976],
    swatch: '#5A3A24',
    label: 'Cinturón marrón',
  },
  black: {
    src: '/brand/BJJ-belts/Blackbelt-Photoroom.png',
    canvas: [842, 1264],
    bbox: [338, 61, 504, 1154],
    panel: [0.167, 0.502],
    patch: [0.742, 0.955],
    swatch: '#161310',
    label: 'Cinturón negro',
  },
}

export const DEFAULT_BELT: BeltId = 'black'

/** Fracción del alto del marco que se recorta del borde superior del cinturón. */
export const TOP_CROP = 0.1

/**
 * Multiplicador global aplicado a `beltScale` para que el panel de grados
 * (la franja funcional donde van los botones de navegación) ocupe más
 * proporción del marco visible.
 *
 * Es un factor único compartido por los cinco cinturones, no un objetivo
 * independiente por cinturón — así el ancho renderizado sigue siendo
 * idéntico entre blanco/azul/morado/marrón (la garantía que `WIDTH_TARGET`
 * ya construye para esos cuatro — ver `beltScale` más abajo para por qué
 * el negro queda excluido de esa garantía), en vez de romperla. Con este
 * valor, el panel pasa de ~47–50% a ~56–60% del alto del marco según el
 * cinturón (ver docs/superpowers/specs/2026-08-14-beltnav-redesign-design.md
 * para la tabla completa por cinturón).
 */
export const PANEL_BOOST = 1.2

/**
 * Relación que gobierna el ANCHO renderizado por unidad de escala. No es la
 * proporción del bbox (`bboxW/bboxH`) — se probó así originalmente y produce
 * anchos desiguales entre cinturones (hasta 2.3x de diferencia, medido en
 * DOM real, 2026-08-14). La causa: `<Image>` renderiza el canvas COMPLETO
 * del PNG (fijado por `height`, con `width: auto`), no un recorte al bbox —
 * el bbox solo se usa para centrar (`imageShiftX`) y posicionar el panel,
 * nunca para cortar la fuente. El ancho real en pantalla es entonces
 * `beltScale(id) * canvasW / bboxH`, así que igualar canvasW/bboxH entre
 * cinturones es lo que realmente iguala el ancho — no bboxW/bboxH.
 */
function beltAspect(id: BeltId): number {
  const [, y0, , y1] = BELTS[id].bbox
  const bboxH = y1 - y0 + 1
  return BELTS[id].canvas[0] / bboxH
}

/**
 * Ancho de referencia, fijado una única vez a partir de `white` tal como se
 * ve hoy. Antes de este cambio, blanco no tenía una escala propia: heredaba
 * la de negro (el cinturón cuyo parche empieza más temprano) por ser
 * BELT_SCALE una constante global compartida por los cinco. Esta constante
 * reproduce ese mismo ancho, ahora como referencia explícita.
 */
const WIDTH_TARGET = ((1 + TOP_CROP) / BELTS.black.patch[0]) * beltAspect('white')

/**
 * Escala del cinturón `id`: alto del cinturón en múltiplos del alto del
 * marco. Es el máximo entre dos requisitos, ambos expresados en fracción de
 * la altura del marco —nunca en píxeles absolutos, para que la garantía de
 * recorte se mantenga a cualquier altura de viewport:
 *
 *   safetyScale: lo mínimo para que el parche de ESTE cinturón quede tapado
 *   (mismo mecanismo que antes, ahora por cinturón en vez de un peor-caso
 *   global — nunca puede violar la seguridad de recorte de otro cinturón,
 *   porque cada uno usa su propio patch[0]).
 *
 *   widthScale: lo necesario para que el ancho renderizado de este cinturón
 *   iguale WIDTH_TARGET (ver `beltAspect` arriba para qué relación gobierna
 *   ese ancho). Blanco/azul/morado/marrón quedan con el ancho exactamente
 *   igual entre sí por este mecanismo.
 *
 * El NEGRO es un caso aparte, excluido a propósito de `widthScale`: su
 * canvas (842×1264, portrait) tiene tanto margen vacío alrededor de la
 * franja real que igualar su ancho contra los otros cuatro por canvas
 * completo exige una escala tan grande que el panel se desborda del marco
 * (medido: 136% de alto de marco, en vez de <=100%) — un cinturón
 * inutilizable, ya que es además el que se ve por defecto (`DEFAULT_BELT`).
 * Se decidió (2026-08-14, con el usuario) dejarlo con un ancho propio,
 * gobernado solo por su seguridad de recorte, en vez de forzar la igualdad.
 *
 * Ver docs/superpowers/specs/2026-08-04-belt-width-normalization.md para
 * los valores originales, y
 * docs/superpowers/specs/2026-08-14-beltnav-redesign-design.md para este
 * ajuste.
 */
function beltScale(id: BeltId): number {
  const safetyScale = (1 + TOP_CROP) / BELTS[id].patch[0]
  if (id === 'black') return safetyScale * PANEL_BOOST
  const widthScale = WIDTH_TARGET / beltAspect(id)
  return Math.max(safetyScale, widthScale) * PANEL_BOOST
}

/**
 * Geometría relativa al **marco de recorte**, no al cinturón.
 *
 * El marco es la ventana visible (100vh × ancho de columna); el cinturón es
 * más grande que ella y se sale por arriba, por abajo y por los lados. Todo va
 * en % del marco, sin medición en JS.
 */
export interface BeltGeometry {
  /**
   * Alto de la imagen como expresión CSS (no un número): el cinturón se
   * escala con un piso en `px` para que su panel negro siempre pueda alojar
   * las 8 filas — ver `MIN_SLOT_PX` y `beltGeometry`.
   */
  imageHeight: string
  /**
   * Ancho MÍNIMO de la imagen, en % del ancho del marco (220px). Normalmente
   * el ancho que resulta de `imageHeight` (vía `width: auto` + aspect ratio
   * del canvas) desborda el marco por un margen enorme, así que este piso no
   * hace nada. Pero `imageHeight` es una fracción de la ALTURA del marco
   * (100vh), y el ancho del marco es un `220px` literal — dos ejes que no
   * escalan igual bajo zoom real del navegador (vh se achica con el zoom, el
   * px literal no). Por debajo de cierta altura de viewport (~795px medido
   * para el morado, a 175% de zoom real) el ancho derivado de la altura cae
   * por debajo del ancho del marco, y como el PNG tiene fondo transparente
   * (recorte tipo Photoroom), eso deja ver el fondo de la página a los
   * costados — la cinta, que sí es 100% ancho fijo, entonces "sobresale" del
   * cinturón. Ver `BeltImage.tsx` para cómo se aplica junto con
   * `object-fit: cover` (evita que este piso estire la foto).
   */
  imageMinWidth: number
  /** Desplazamiento vertical de la imagen, como expresión CSS. */
  imageTop: string
  /** Centrado horizontal: translateX en % del ancho de la propia imagen. */
  imageShiftX: number
  /** Rect del panel de grados, como expresiones CSS. */
  panel: { top: string; height: string }
}

export function beltGeometry(id: BeltId): BeltGeometry {
  const { canvas, bbox, panel } = BELTS[id]
  const [canvasW, canvasH] = canvas
  const [x0, y0, x1, y1] = bbox
  const bboxH = y1 - y0 + 1
  const bboxW = x1 - x0 + 1
  const crop = TOP_CROP * 100
  const panelFrac = panel[1] - panel[0]

  // Alto del cinturón (su bbox) en unidades del marco. Ya no es un número:
  // es una expresión CSS que mezcla `vh` (el reparto proporcional de
  // siempre) con `px` (el piso de MIN_SLOT_PX y la reserva del picker),
  // unidades que solo el navegador puede comparar en tiempo de layout.
  const beltFloorPx = (NAV.length * MIN_SLOT_PX) / panelFrac
  const belt =
    `min(max(${beltScale(id) * 100}vh, ${beltFloorPx}px), ` +
    `calc((100vh - ${PICKER_RESERVE_PX}px) / ${panelFrac}))`

  const panelHeight = `calc(${panelFrac} * ${belt})`

  // Posición natural del panel, pero sin dejar que se salga de la banda útil
  // del marco: al crecer el cinturón, el panel se correría hacia abajo y la
  // última opción terminaría fuera del negro. El `min` lo sube lo justo para
  // que su borde inferior toque la franja del picker; el `max` evita que en
  // el extremo opuesto se recorte por arriba.
  const panelTop =
    `max(0px, min(calc(${-crop}vh + ${panel[0]} * ${belt}), ` +
    `calc(100vh - ${PICKER_RESERVE_PX}px - ${panelHeight})))`

  return {
    imageHeight: `calc(${canvasH / bboxH} * ${belt})`,
    imageMinWidth: (canvasW / bboxW) * 100,
    // La foto se ancla al panel, no al revés: así el desplazamiento vertical
    // acompaña a `panelTop` y el panel siempre cae donde van los ítems. Se
    // resta también `y0/bboxH` porque el bbox del cinturón no empieza en el
    // borde del canvas: sin ese término la tela negra queda corrida respecto
    // de las filas.
    imageTop: `calc(${panelTop} - ${panel[0] + y0 / bboxH} * ${belt})`,
    imageShiftX: -(((x0 + x1) / 2 / canvasW) * 100),
    panel: { top: panelTop, height: panelHeight },
  }
}

/**
 * Alto minimo de un slot, en pixeles literales.
 *
 * El contenido de cada ítem (ícono 16px + texto 12px) está en `px`: NO se
 * achica cuando baja la altura de viewport. El slot, en cambio, es una
 * fracción del panel del cinturón, que es una fracción del marco (`100vh`)
 * — con zoom real del navegador el viewport en px CSS se achica, así que el
 * slot se achica mientras el contenido se queda igual, y los ítems quedan
 * apretados contra sus vecinos (a 175% de zoom real, medido con el usuario:
 * slot 39.6px para un contenido de ~16px, contra los 69px que tiene a 100%).
 *
 * Se aplica escalando el CINTURÓN (ver `beltGeometry`), no estirando el
 * track: el panel negro es lo que tiene que crecer, porque los ítems viven
 * dentro de él. Estirar solo el track dejaba la última opción fuera del
 * negro y tela negra sin usar arriba.
 *
 * Valor elegido para no alterar nada en desktop a 100% de zoom (donde el
 * reparto proporcional ya da ~63-69px por slot, holgadamente por encima).
 */
export const MIN_SLOT_PX = 56

/**
 * Banda inferior del marco reservada al `BeltPicker` (vive en `bottom-5`,
 * ver BeltNavigation.tsx): sus 20px de margen + 16px de alto propio. Es la
 * huella exacta del picker — el panel puede llegar a tocar su borde
 * superior. En `px` porque el picker se posiciona en `px`, no en %.
 */
const PICKER_RESERVE_PX = 36

/**
 * Coincidencia exacta o de segmento completo. `startsWith` a secas haría que
 * /dashboard-custom (que existe en este proyecto) activara /dashboard.
 */
export function activeNavIndex(pathname: string): number {
  return NAV.findIndex(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )
}

export function canvasHeightOf(id: BeltId): number {
  return BELTS[id].canvas[1]
}
