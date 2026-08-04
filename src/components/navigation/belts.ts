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
 * Es la que gobierna la altura de la cinta y, por tanto, `k`.
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

function beltAspect(id: BeltId): number {
  const [x0, y0, x1, y1] = BELTS[id].bbox
  return (x1 - x0 + 1) / (y1 - y0 + 1)
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
 *   iguale WIDTH_TARGET. Fotos con aspect ratio más angosto (blue: 0.1373
 *   vs. 0.1527-0.1542 de white/purple/black) necesitan más escala para
 *   llegar al mismo ancho — y al escalar sube proporcionalmente también su
 *   alto, nunca se deforma un eje solo.
 *
 * Ver docs/superpowers/specs/2026-08-04-belt-width-normalization.md para
 * los valores medidos y la tabla de resultados por cinturón.
 */
function beltScale(id: BeltId): number {
  const safetyScale = (1 + TOP_CROP) / BELTS[id].patch[0]
  const widthScale = WIDTH_TARGET / beltAspect(id)
  return Math.max(safetyScale, widthScale)
}

/**
 * Geometría relativa al **marco de recorte**, no al cinturón.
 *
 * El marco es la ventana visible (100vh × ancho de columna); el cinturón es
 * más grande que ella y se sale por arriba, por abajo y por los lados. Todo va
 * en % del marco, sin medición en JS.
 */
export interface BeltGeometry {
  /** Alto de la imagen, en % del alto del marco. */
  imageHeight: number
  /** Desplazamiento vertical de la imagen, en % del alto del marco. */
  imageTop: number
  /** Centrado horizontal: translateX en % del ancho de la propia imagen. */
  imageShiftX: number
  /** Rect del panel de grados, en % del marco. */
  panel: { top: number; height: number }
}

export function beltGeometry(id: BeltId): BeltGeometry {
  const { canvas, bbox, panel } = BELTS[id]
  const [canvasW, canvasH] = canvas
  const [x0, y0, x1, y1] = bbox
  const bboxH = y1 - y0 + 1
  const crop = TOP_CROP * 100
  const belt = beltScale(id) * 100

  return {
    imageHeight: belt * (canvasH / bboxH),
    imageTop: -crop - belt * (y0 / bboxH),
    imageShiftX: -(((x0 + x1) / 2 / canvasW) * 100),
    panel: {
      top: -crop + panel[0] * belt,
      height: (panel[1] - panel[0]) * belt,
    },
  }
}

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
