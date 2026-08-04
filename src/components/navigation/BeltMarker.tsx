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
 * La cinta va centrada dentro de ese envoltorio con su propia proporción. Es
 * más alta que un slot, así que invade a los vecinos; `pointer-events: none`
 * evita que bloquee sus clics.
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
      {/* 96% de ancho, centrada: a 100% se salía unos px por los lados del panel. */}
      <div
        className="absolute top-1/2 -translate-y-1/2 overflow-hidden"
        style={{ aspectRatio: String(TAPE_ASPECT), width: '96%', left: '2%' }}
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
