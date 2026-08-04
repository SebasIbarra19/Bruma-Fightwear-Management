// ================================================
// 📁 HOOK PARA DATOS DE CATEGORÍAS
// Maneja las consultas a las APIs de categorías
// ================================================

'use client'

import { useState, useEffect } from 'react'

// ================================================
// TIPOS
// ================================================

export interface Category {
  id: string
  project_id: string
  name: string
  description: string | null
  parent_id: string | null
  is_active: boolean
  product_count: number
  children_count: number
  created_at: string
  updated_at: string
}

export interface CategoryStats {
  total_categories: number
  active_categories: number
  inactive_categories: number
  total_products: number
  total_subcategories: number
  categories_with_products: number
}

export interface CategoryOption {
  value: string
  label: string
}

// ================================================
// HOOK PRINCIPAL
// ================================================

export function useCategoriesData(initialProjectId?: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<CategoryStats | null>(null)
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(initialProjectId)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Actualizar projectId cuando cambia el inicial
  useEffect(() => {
    setCurrentProjectId(initialProjectId)
  }, [initialProjectId])

  // ================================================
  // CARGAR LISTA DE CATEGORÍAS
  // ================================================
  const fetchCategories = async (params: {
    projectId?: string  // Ahora acepta projectId como parámetro opcional
    limit?: number
    offset?: number
    parentId?: string | null
    includeInactive?: boolean
    includeStats?: boolean
  } = {}) => {
    // Usar projectId del parámetro o el del estado
    const projectId = params.projectId || currentProjectId
    
    if (!projectId) {
      console.warn('⚠️ [useCategoriesData] No projectId provided')
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      // Construir query params
      const queryParams = new URLSearchParams({
        projectId: projectId,
        limit: (params.limit || 100).toString(),
        offset: (params.offset || 0).toString(),
        includeInactive: (params.includeInactive || false).toString(),
        includeStats: (params.includeStats !== false).toString()
      })

      if (params.parentId !== undefined) {
        queryParams.append('parentId', params.parentId || '')
      }

      console.log('🔷 [useCategoriesData] Fetching categories with params:', Object.fromEntries(queryParams))

      // Llamar a la API
      const response = await fetch(`/api/categories?${queryParams}`)
      
      console.log('🔍 DEBUG - Response status:', response.status, response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Error al cargar categorías')
      }

      const result = await response.json()
      
      console.log('🔍 DEBUG - Categories result:', JSON.stringify(result, null, 2))
      console.log('🔍 DEBUG - result.data:', result.data)
      console.log('🔍 DEBUG - result.data.items:', result.data?.items)
      console.log('🔍 DEBUG - result.data.items length:', result.data?.items?.length)

      if (result.success && result.data) {
        const items = result.data.items || result.data.data || result.data || []
        setCategories(items)
        
        console.log(`✅ [useCategoriesData] SET categories with ${items.length} items`)
        
        // Actualizar stats si están disponibles
        if (result.data.stats) {
          setStats(result.data.stats)
        }

        console.log(`✅ [useCategoriesData] Loaded ${items.length} categories`)
        if (result.data.stats) {
          console.log('📊 [useCategoriesData] Stats:', result.data.stats)
        }
      } else {
        throw new Error(result.error?.message || 'Error al procesar respuesta')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar categorías'
      console.error('❌ [useCategoriesData] Error:', errorMessage, err)
      setError(errorMessage)
      setCategories([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  // ================================================
  // BUSCAR CATEGORÍAS (FILTRADO LOCAL)
  // ================================================
  const searchCategories = (searchTerm: string): Category[] => {
    if (!searchTerm.trim()) {
      return categories
    }

    const term = searchTerm.toLowerCase()
    return categories.filter(category =>
      category.name.toLowerCase().includes(term) ||
      (category.description && category.description.toLowerCase().includes(term))
    )
  }

  // ================================================
  // FILTRAR POR ESTADO (LOCAL)
  // ================================================
  const filterByActive = (activeOnly: boolean): Category[] => {
    if (!activeOnly) {
      return categories
    }
    return categories.filter(cat => cat.is_active)
  }

  // ================================================
  // OBTENER CATEGORÍAS RAÍZ (sin padre)
  // ================================================
  const getRootCategories = (): Category[] => {
    return categories.filter(cat => cat.parent_id === null)
  }

  // ================================================
  // OBTENER SUBCATEGORÍAS DE UNA CATEGORÍA
  // ================================================
  const getSubcategories = (parentId: string): Category[] => {
    return categories.filter(cat => cat.parent_id === parentId)
  }

  // ================================================
  // OBTENER OPCIONES PARA SELECT (retrocompatibilidad)
  // ================================================
  const getCategoryOptions = (): CategoryOption[] => {
    return [
      { value: '', label: 'Seleccionar categoría' },
      ...categories
        .filter(cat => cat.is_active)
        .map(cat => ({
          value: cat.id,
          label: cat.name
        }))
    ]
  }

  // ================================================
  // REFRESCAR DATOS
  // ================================================
  const refresh = async () => {
    await fetchCategories({ includeStats: true })
  }

  // ================================================
  // CREAR CATEGORÍA
  // ================================================
  const createCategory = async (data: {
    name: string
    description?: string
    parentId?: string | null
    isActive?: boolean
  // displayOrder y color eliminados
  }): Promise<Category | null> => {
    if (!currentProjectId) {
      console.warn('⚠️ [useCategoriesData] No projectId provided for create')
      setError('No se puede crear categoría sin projectId')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔧 [useCategoriesData] Creating category:', data.name)

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: currentProjectId,
          ...data
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error creating category')
      }

      console.log('✅ [useCategoriesData] Category created:', result.data.category.id)

      // Refrescar lista de categorías
      await fetchCategories({ includeStats: true })

      return result.data.category

    } catch (err: any) {
      console.error('❌ [useCategoriesData] Error creating category:', err)
      setError(err.message || 'Error al crear categoría')
      return null
    } finally {
      setLoading(false)
    }
  }

  // ================================================
  // ACTUALIZAR CATEGORÍA
  // ================================================
  const updateCategory = async (
    categoryId: string,
    data: {
      name?: string
      description?: string | null
      parentId?: string | null
      isActive?: boolean
  // displayOrder y color eliminados
    }
  ): Promise<Category | null> => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔧 [useCategoriesData] Updating category:', categoryId)

      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: categoryId,
          ...data
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error updating category')
      }

      console.log('✅ [useCategoriesData] Category updated:', result.data.category.id)

      // Actualizar en el estado local
      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId ? result.data.category : cat
        )
      )

      // Refrescar stats
      await fetchCategories({ includeStats: true })

      return result.data.category

    } catch (err: any) {
      console.error('❌ [useCategoriesData] Error updating category:', err)
      setError(err.message || 'Error al actualizar categoría')
      return null
    } finally {
      setLoading(false)
    }
  }

  // ================================================
  // ELIMINAR CATEGORÍA
  // ================================================
  const deleteCategory = async (categoryId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔧 [useCategoriesData] Deleting category:', categoryId)

      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error deleting category')
      }

      console.log('✅ [useCategoriesData] Category deleted:', categoryId)

      // Remover del estado local
      setCategories(prev => prev.filter(cat => cat.id !== categoryId))

      // Refrescar stats
      if (currentProjectId) {
        await fetchCategories({ includeStats: true })
      }

      return true

    } catch (err: any) {
      console.error('❌ [useCategoriesData] Error deleting category:', err)
      setError(err.message || 'Error al eliminar categoría')
      return false
    } finally {
      setLoading(false)
    }
  }

  // ================================================
  // SOFT DELETE (Marcar como inactiva)
  // ================================================
  const softDeleteCategory = async (categoryId: string): Promise<boolean> => {
    const result = await updateCategory(categoryId, { isActive: false })
    return result !== null
  }

  return {
    // Estado
    categories,
    stats,
    loading,
    error,

    // Métodos READ
    fetchCategories,
    searchCategories,
    filterByActive,
    getRootCategories,
    getSubcategories,
    getCategoryOptions,
    refresh,

    // Métodos CRUD
    createCategory,
    updateCategory,
    deleteCategory,
    softDeleteCategory,

    // Computed
    totalCategories: categories.length,
    activeCategories: categories.filter(c => c.is_active).length,
    hasCategories: categories.length > 0
  }
}
