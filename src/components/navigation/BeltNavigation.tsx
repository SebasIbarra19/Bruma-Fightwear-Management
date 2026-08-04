'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  BELTS,
  DEFAULT_BELT,
  activeNavIndex,
  beltGeometry,
  type BeltId,
} from './belts'
import { BeltImage } from './BeltImage'
import { NavigationItems } from './NavigationItems'
import { BeltPicker } from './BeltPicker'

const STORAGE_KEY = 'bruma.belt'

function isBeltId(value: string | null): value is BeltId {
  return value !== null && value in BELTS
}

export function BeltNavigation() {
  const pathname = usePathname()
  const [belt, setBelt] = useState<BeltId>(DEFAULT_BELT)

  // La preferencia se lee tras el montaje, no durante el render: servidor y
  // primer render de cliente coinciden. Si el valor guardado difiere hay un
  // único frame con el cinturón por defecto — es deliberado, para no repetir
  // el desajuste de hidratación que ya arrastra ThemeContext.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isBeltId(stored)) setBelt(stored)
  }, [])

  const selectBelt = (next: BeltId) => {
    setBelt(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  // Derivado durante el render, no en un efecto. Así el primer render ya emite
  // el translateY final: entrar directo a /inventory pinta la cinta alineada
  // desde el primer frame, y como las transiciones CSS solo disparan ante un
  // cambio, no hay animación de entrada.
  const activeIndex = activeNavIndex(pathname)
  const geometry = beltGeometry(belt)

  return (
    // `sticky` (no `fixed`) para que la columna siga en el flujo y reserve sus
    // 176px. Con `h-screen` mide exactamente el viewport, que es la condición
    // que faltaba: un elemento más alto que la pantalla nunca llega a mostrar
    // su mitad inferior al fijarse.
    <aside className="z-40 h-screen w-full shrink-0 lg:sticky lg:top-0 lg:w-[176px]">
      {/* La ventana de recorte. El cinturón es más grande y la desborda por
          arriba, por abajo y por los lados. */}
      <div className="relative h-full w-full overflow-hidden">
        <BeltImage belt={belt} geometry={geometry} priority />
        <NavigationItems activeIndex={activeIndex} geometry={geometry} />

        <div className="absolute bottom-5 left-0 z-30 flex w-full justify-center">
          <BeltPicker value={belt} onChange={selectBelt} />
        </div>
      </div>
    </aside>
  )
}
