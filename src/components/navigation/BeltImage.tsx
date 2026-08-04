import Image from 'next/image'
import { BELTS, type BeltId, type BeltGeometry } from './belts'

interface BeltImageProps {
  belt: BeltId
  geometry: BeltGeometry
  priority?: boolean
}

/**
 * La fotografía del cinturón dentro de la ventana de recorte.
 *
 * El marco NO representa al cinturón: es la ventana visible. El cinturón es
 * más grande y se sale por arriba, por abajo y por los lados — así ninguno de
 * sus extremos queda a la vista y se lee como una foto que continúa fuera de
 * pantalla.
 *
 * El centrado horizontal usa `left: 50%` más un `translateX` en % del ancho de
 * la propia imagen, lo que sitúa el centro del bbox del cinturón en el centro
 * del marco sin depender de píxeles.
 *
 * Solo se fija `height`: el ancho queda implícito, así que la proporción
 * original de la foto es matemáticamente imposible de romper.
 */
export function BeltImage({ belt, geometry, priority }: BeltImageProps) {
  const { src, canvas } = BELTS[belt]
  const { imageHeight, imageTop, imageShiftX } = geometry

  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={canvas[0]}
      height={canvas[1]}
      priority={priority}
      draggable={false}
      className="absolute left-1/2 max-w-none select-none pointer-events-none"
      style={{
        height: `${imageHeight}%`,
        width: 'auto',
        top: `${imageTop}%`,
        transform: `translateX(${imageShiftX}%)`,
      }}
    />
  )
}
