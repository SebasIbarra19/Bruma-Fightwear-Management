'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from 'lucide-react'
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
import { MobileNav } from './MobileNav'

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
  //
  // `localStorage` primero y el perfil después, a propósito: lo local pinta en
  // el mismo frame y el perfil llega por red. Al revés se vería el cinturón por
  // defecto durante toda la petición. El perfil manda cuando llega, que es lo
  // que hace que la elección siga al usuario entre equipos; `localStorage`
  // queda como caché para que la próxima carga en ESTE navegador ya arranque
  // bien.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isBeltId(stored)) setBelt(stored)

    let vigente = true
    fetch('/api/perfil')
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!vigente || !res?.success) return
        const guardado = res.data?.preferencia_cinturon
        if (isBeltId(guardado)) {
          setBelt(guardado)
          window.localStorage.setItem(STORAGE_KEY, guardado)
        }
      })
      .catch(() => {
        // Sin sesión o sin red: se sigue con lo local. La barra nunca debe
        // quedar sin cinturón por un problema de perfil.
      })

    return () => {
      vigente = false
    }
  }, [])

  const selectBelt = (next: BeltId) => {
    setBelt(next)
    window.localStorage.setItem(STORAGE_KEY, next)

    // Persistir en el perfil es lo que hace que la elección sobreviva al
    // navegador. No se espera ni se revierte si falla: el cambio visual ya
    // ocurrió y bloquear la interfaz por guardar una preferencia sería peor
    // que perderla.
    fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferencia_cinturon: next }),
    }).catch(() => {})
  }

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
      <MobileNav belt={belt} onBeltChange={selectBelt} activeIndex={activeIndex} />

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
            <BeltPicker value={belt} onChange={selectBelt} />
          </div>
        </div>
      </aside>
    </>
  )
}
