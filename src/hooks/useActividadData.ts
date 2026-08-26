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

  const refetch = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    // Cambiar de filtro rápido dispara varias peticiones; sin esto, una
    // respuesta vieja que llega tarde repinta la lista con el filtro anterior.
    let vigente = true

    setLoading(true)
    setError(null)

    const qs = new URLSearchParams({ limit: '100' })
    if (categoria) qs.set('categoria', categoria)

    fetch(`/api/actividad?${qs}`)
      .then((r) => r.json())
      .then((result) => {
        if (!vigente) return
        if (result.success) setRegistros(result.data)
        else setError(result.error?.message || 'Error cargando la bitácora')
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
