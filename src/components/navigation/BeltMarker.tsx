import Image from 'next/image'
import { TAPE_ASPECT, TAPE_CANVAS, TAPE_IMAGE, TAPE_SRC } from './belts'

interface BeltMarkerProps {
  /** Índice del slot activo, o -1 si la ruta no corresponde a ningún ítem. */
  activeIndex: number
  /** Cantidad de slots del track. */
  slots: number
}

/**
 * La cinta de esparadrapo: el indicador de ruta activa.
 *
 * El envoltorio mide exactamente **un slot** (100/slots % del track), así que
 * `translateY(index · 100%)` —porcentaje de su propia altura— lo desplaza
 * exactamente un slot por unidad. No hace falta ninguna constante derivada ni
 * medición en JS, y funciona con cualquier dimensión del marco.
 *
 * La cinta va centrada dentro de ese envoltorio con su proporción REAL: el
 * ancho manda (100% del marco de recorte) y el alto sale de `TAPE_ASPECT`.
 * Nada la recorta por arriba ni por abajo — se probó dimensionarla contra el
 * alto del slot y cubrir el sobrante con un `cover` calculado a mano, y el
 * precio era exactamente eso: la cinta perdía sus bordes dentados arriba y
 * abajo. Si a un zoom dado los slots quedan demasiado apretados para ella,
 * lo que se agranda es el slot (ver `MIN_SLOT_PX` en belts.ts), nunca se
 * recorta la cinta.
 *
 * Es más alta que un slot, así que invade a los vecinos; `pointer-events:
 * none` evita que bloquee sus clics.
 *
 * El contenedor de la cinta representa su rect *visible* (bbox opaco), no el
 * canvas del PNG: encuadrar contra el canvas la dejaba al 83.8% del ancho.
 */
export function BeltMarker({ activeIndex, slots }: BeltMarkerProps) {
  const visible = activeIndex >= 0

  return (
    <div
      aria-hidden
      className="absolute left-0 top-0 z-10 w-full pointer-events-none motion-reduce:transition-none"
      style={{
        height: `${100 / slots}%`,
        // Al perder coincidencia conserva la posición del slot 0 y solo se
        // desvanece, para no saltar al volver a una ruta válida.
        transform: `translateY(${(visible ? activeIndex : 0) * 100}%)`,
        opacity: visible ? 1 : 0,
        transition:
          'transform 260ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms linear',
      }}
    >
      {/* Ancho = 100% del marco de recorte (mismos 220px, en px literales,
          que el `overflow-hidden` de BeltNavigation.tsx usa para recortar el
          cinturón) — así la cinta iguala siempre el ancho VISIBLE del
          cinturón, no su imagen completa sin recortar. Alto derivado vía
          `aspectRatio`, sin recorte vertical. */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
        style={{ aspectRatio: String(TAPE_ASPECT), width: '100%', height: 'auto' }}
      >
        <Image
          src={TAPE_SRC}
          alt=""
          aria-hidden
          width={TAPE_CANVAS[0]}
          height={TAPE_CANVAS[1]}
          draggable={false}
          className="absolute max-w-none select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]"
          style={{
            width: `${TAPE_IMAGE.width}%`,
            height: 'auto',
            left: `${TAPE_IMAGE.left}%`,
            top: `${TAPE_IMAGE.top}%`,
          }}
        />
      </div>
    </div>
  )
}
