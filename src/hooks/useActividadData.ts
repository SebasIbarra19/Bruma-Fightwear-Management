import { fetchConCache, invalidarCache } from '@/lib/api/cache-cliente'
import { useEffect, useState } from 'react'
import type {
  CategoriaActividad,
  RegistroActividad,
} from '@/lib/database/adapters/actividad-adapter'

interface UseActividadDataResult {
  registros: RegistroActividad[]
  loading: boolean
  error: string | null
  categoria: CategoriaActividad | null
  setCategoria: (c: CategoriaActividad | null) => void
  refetch: () => void
}

export function useActividadData(): UseActividadDataResult {
  const [registros, setRegistros] = useState<RegistroActividad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoria, setCategoria] = useState<CategoriaActividad | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Invalida antes de volver a pedir: si no, la caché devolvería lo mismo que
  // ya se muestra y el botón de recargar no haría nada.
  const refetch = () => {
    invalidarCache('/api/actividad')
    setRefreshKey((k) => k + 1)
  }

  useEffect(() => {
    // Cambiar de filtro rápido dispara varias peticiones; sin esto, una
    // respuesta vieja que llega tarde repinta la lista con el filtro anterior.
    let vigente = true

    setLoading(true)
    setError(null)

    const qs = new URLSearchParams({ limit: '100' })
    if (categoria) qs.set('categoria', categoria)

    // La caché se indexa por URL, así que cada filtro guarda lo suyo y volver a
    // uno ya visto pinta al instante. `onDatos` puede llamarse dos veces —
    // cacheado y luego fresco—: `loading` se apaga en la primera para que la
    // revalidación no reabra los esqueletos.
    fetchConCache<RegistroActividad[]>(`/api/actividad?${qs}`, (filas) => {
      if (!vigente) return
      setRegistros(filas)
      setLoading(false)
    })
      .catch((e) => {
        if (vigente) setError(e.message)
      })
      .finally(() => {
        if (vigente) setLoading(false)
      })

    return () => {
      vigente = false
    }
  }, [categoria, refreshKey])

  return { registros, loading, error, categoria, setCategoria, refetch }
}
