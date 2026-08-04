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
      style={{ top: `${panel.top}%`, height: `${panel.height}%` }}
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
