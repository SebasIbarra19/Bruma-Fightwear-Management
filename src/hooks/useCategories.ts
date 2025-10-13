import { useState, useEffect } from 'react'

interface CategoryOption {
  value: string
  label: string
}

interface Category {
  id: string
  name: string
  slug: string
  is_active: boolean
}

export function useCategories(projectId?: string) {
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCategories = async (projectUuid: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Cargando categorías para selector:', projectUuid)
      
      const response = await fetch(`/api/categories?project_id=${projectUuid}&limit=100`)
      const result = await response.json()
      
      if (result.success && result.data) {
        // Transformar a formato de opciones para select
        const options: CategoryOption[] = [
          { value: '', label: 'Seleccionar categoría' },
          ...result.data.data
            .filter((cat: Category) => cat.is_active)
            .map((cat: Category) => ({
              value: cat.id,
              label: cat.name
            }))
        ]
        
        setCategories(options)
        console.log('✅ Categorías cargadas para selector:', options.length - 1)
      } else {
        throw new Error(result.error || 'Error al cargar categorías')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('❌ Error cargando categorías:', err)
      
      // Fallback a opciones vacías
      setCategories([{ value: '', label: 'Seleccionar categoría' }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadCategories(projectId)
    }
  }, [projectId])

  return {
    categories,
    loading,
    error,
    reload: () => projectId && loadCategories(projectId)
  }
}