'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from 'lucide-react'
import { activeNavIndex, beltGeometry } from './belts'
import { BeltImage } from './BeltImage'
import { NavigationItems } from './NavigationItems'
import { MobileNav } from './MobileNav'
import { useBelt } from '@/contexts/BeltContext'
import { precargarRuta } from '@/lib/api/cache-cliente'

export function BeltNavigation() {
  const pathname = usePathname()
  // El cinturón ya no se elige acá: vive en el perfil. Este componente solo lo
  // consume (ver `BeltContext`), así que la barra queda para navegar y nada más.
  const { belt } = useBelt()

  // Derivado durante el render, no en un efecto. Así el primer render ya emite
  // el translateY final: entrar directo a /inventory pinta la cinta alineada
  // desde el primer frame, y como las transiciones CSS solo disparan ante un
  // cambio, no hay animación de entrada.
  const activeIndex = activeNavIndex(pathname)
  const geometry = beltGeometry(belt)

  return (
    <>
      {/* <lg: el rail fotográfico de abajo está dimensionado solo para una
          columna de 220px (ver belts.ts) — por debajo de `lg` se oculta por
          completo y esta variante compuesta aparte lo reemplaza (ver
          MobileNav.tsx). No comparte geometría con el rail: es markup nuevo
          en paralelo, no un ajuste de `beltGeometry`. */}
      <MobileNav activeIndex={activeIndex} />

      {/* >=lg (sin cambios de comportamiento respecto de antes, solo ahora
          oculto por debajo de `lg` en vez de renderizarse a ancho completo).
          `sticky` (no `fixed`) para que la columna siga en el flujo y reserve
          sus 220px. Con `h-screen` mide exactamente el viewport, que es la
          condición que faltaba: un elemento más alto que la pantalla nunca
          llega a mostrar su mitad inferior al fijarse. */}
      <aside className="z-40 hidden h-screen shrink-0 lg:block lg:sticky lg:top-0 lg:w-[220px]">
        {/* La ventana de recorte. El cinturón es más grande y la desborda por
            arriba, por abajo y por los lados. */}
        <div className="relative h-full w-full overflow-hidden">
          <BeltImage belt={belt} geometry={geometry} priority />
          <NavigationItems activeIndex={activeIndex} geometry={geometry} />

          {/* El acceso al perfil va acá y NO como un noveno ítem de `NAV`:
              los slots se reparten sobre el panel del cinturón, así que sumar
              uno cambiaría la geometría de las ocho secciones reales. Además
              el perfil no es una sección del sistema, es la cuenta. */}
          <div className="absolute bottom-5 left-0 z-30 flex w-full flex-col items-center gap-3">
            <Link
              href="/profile"
              onMouseEnter={() => precargarRuta('/profile')}
              onFocus={() => precargarRuta('/profile')}
              aria-label="Perfil"
              aria-current={pathname === '/profile' ? 'page' : undefined}
              className={`flex items-center gap-2 rounded-[2px] border px-3 py-1.5 font-geist text-[10px] font-bold uppercase tracking-widest outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ember ${
                pathname === '/profile'
                  ? 'border-ember/40 bg-ember/10 text-ember'
                  : 'border-bone/20 bg-obsidian/70 text-bone/70 hover:border-bone/50 hover:text-bone'
              }`}
            >
              <User size={12} /> Perfil
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
