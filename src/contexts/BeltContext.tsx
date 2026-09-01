'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { fetchApi } from '@/lib/api/fetch-cliente'
import { BELTS, DEFAULT_BELT, type BeltId } from '@/components/navigation/belts'

const STORAGE_KEY = 'bruma.belt'

function isBeltId(value: string | null | undefined): value is BeltId {
  return typeof value === 'string' && value in BELTS
}

interface BeltContextValue {
  belt: BeltId
  /** Aplica el cinturón al instante y lo persiste en el perfil en segundo plano. */
  setBelt: (next: BeltId) => void
}

const BeltContext = createContext<BeltContextValue | undefined>(undefined)

/**
 * Cinturón activo, compartido por toda la zona admin.
 *
 * Antes este estado vivía dentro de `BeltNavigation`, que era el único que lo
 * usaba porque el selector estaba sobre el propio cinturón. Al mudarse el
 * selector al perfil quedaron **dos componentes distintos** que tienen que
 * coincidir —el que elige y el que pinta—, y sin un estado común el cambio solo
 * se vería al recargar.
 */
export function BeltProvider({ children }: { children: React.ReactNode }) {
  const [belt, setBeltState] = useState<BeltId>(DEFAULT_BELT)

  // La preferencia se lee tras el montaje, no durante el render: servidor y
  // primer render de cliente coinciden. Si el valor guardado difiere hay un
  // único frame con el cinturón por defecto — deliberado, para no repetir el
  // desajuste de hidratación que ya arrastra ThemeContext.
  //
  // `localStorage` primero y el perfil después, a propósito: lo local pinta en
  // el mismo frame y el perfil llega por red. Al revés se vería el cinturón por
  // defecto durante toda la petición. El perfil manda cuando llega —es lo que
  // hace que la elección siga al usuario entre equipos—; `localStorage` queda
  // como caché para que la próxima carga en ESTE navegador ya arranque bien.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isBeltId(stored)) setBeltState(stored)

    let vigente = true
    fetchApi('/api/perfil')
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!vigente || !res?.success) return
        const guardado = res.data?.preferencia_cinturon
        if (isBeltId(guardado)) {
          setBeltState(guardado)
          window.localStorage.setItem(STORAGE_KEY, guardado)
        }
      })
      .catch(() => {
        // Sin sesión o sin red se sigue con lo local: la barra nunca debe
        // quedar sin cinturón por un problema de perfil.
      })

    return () => {
      vigente = false
    }
  }, [])

  const setBelt = useCallback((next: BeltId) => {
    setBeltState(next)
    window.localStorage.setItem(STORAGE_KEY, next)

    // Persistir es lo que hace que la elección sobreviva al navegador. No se
    // espera ni se revierte si falla: el cambio visual ya ocurrió, y bloquear
    // la interfaz por guardar una preferencia sería peor que perderla.
    fetchApi('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferencia_cinturon: next }),
    }).catch(() => {})
  }, [])

  return (
    <BeltContext.Provider value={{ belt, setBelt }}>{children}</BeltContext.Provider>
  )
}

export function useBelt(): BeltContextValue {
  const ctx = useContext(BeltContext)
  if (!ctx) throw new Error('useBelt debe usarse dentro de <BeltProvider>')
  return ctx
}
