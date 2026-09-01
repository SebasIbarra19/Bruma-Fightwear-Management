import { fetchApi } from '@/lib/api/fetch-cliente'
import { fetchConCache, invalidarCache } from '@/lib/api/cache-cliente'
import { useEffect, useState } from 'react'
import type { Perfil, PerfilEditable } from '@/lib/database/adapters/perfil-adapter'

interface UsePerfilDataResult {
  perfil: Perfil | null
  loading: boolean
  saving: boolean
  error: string | null
  guardar: (campos: PerfilEditable) => Promise<void>
  subirAvatar: (file: File) => Promise<void>
}

export function usePerfilData(): UsePerfilDataResult {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    fetchConCache<Perfil>('/api/perfil', (p) => {
      if (!vigente) return
      setPerfil(p)
      setLoading(false)
    })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setLoading(false))
    return () => {
      vigente = false
    }
  }, [])

  const guardar = async (campos: PerfilEditable) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetchApi('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campos),
      }).then((r) => r.json())
      if (!res.success) throw new Error(res.error?.message || 'Error guardando')
      // Sin esto, salir del perfil y volver mostraria lo anterior al guardado.
      invalidarCache('/api/perfil')
      // La respuesta trae el perfil ya releído, así que la pantalla queda
      // sincronizada con lo que quedó en la base y no con lo que se envió.
      setPerfil(res.data)
    } catch (e: any) {
      setError(e.message)
      throw e
    } finally {
      setSaving(false)
    }
  }

  const subirAvatar = async (file: File) => {
    setSaving(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      // Sin Content-Type a mano: el navegador tiene que ponerlo con el boundary.
      const res = await fetchApi('/api/perfil', { method: 'PATCH', body: fd }).then((r) => r.json())
      if (!res.success) throw new Error(res.error?.message || 'Error subiendo el avatar')
      invalidarCache('/api/perfil')
      setPerfil((p) => (p ? { ...p, avatar_url: res.data.avatar_url } : p))
    } catch (e: any) {
      setError(e.message)
      throw e
    } finally {
      setSaving(false)
    }
  }

  return { perfil, loading, saving, error, guardar, subirAvatar }
}
