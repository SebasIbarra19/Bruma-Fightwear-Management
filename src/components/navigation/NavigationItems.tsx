import { NAV, type BeltGeometry } from './belts'
import { NavigationButton } from './NavigationButton'
import { BeltMarker } from './BeltMarker'

interface NavigationItemsProps {
  activeIndex: number
  geometry: BeltGeometry
}

/**
 * El track: el rect exacto del panel de grados del cinturón.
 *
 * No lleva ningún ajuste propio para el zoom: quien garantiza que los slots
 * no queden apretados es el CINTURÓN, que se escala con un piso en px para
 * que su panel negro siempre pueda alojar las 8 filas (ver `MIN_SLOT_PX` en
 * belts.ts). Así los ítems nunca se salen del negro.
 *
 * Los 8 slots son filas flex iguales (`flex-1`), así que ninguna posición se
 * calcula por ítem — el reparto lo hace el navegador. La cinta vive dentro del
 * track en posición absoluta, fuera del flujo flex.
 */
export function NavigationItems({ activeIndex, geometry }: NavigationItemsProps) {
  const { panel } = geometry

  return (
    <nav
      aria-label="Navegación principal"
      className="absolute left-0 flex w-full flex-col"
      style={{ top: panel.top, height: panel.height }}
    >
      <BeltMarker activeIndex={activeIndex} slots={NAV.length} />

      {NAV.map((item, index) => (
        <NavigationButton
          key={item.id}
          item={item}
          isActive={index === activeIndex}
        />
      ))}
    </nav>
  )
}
