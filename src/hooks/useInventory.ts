import { useState } from 'react'

// ================================================
// HOOK PRINCIPAL - API BASED
// ================================================
export function useInventory(projectId?: string) {
  const [inventory, setInventory] = useState<any[]>([])
  const [inventoryDetails, setInventoryDetails] = useState<any | null>(null)
  const [totalInventory, setTotalInventory] = useState(0)
  const [loadingInventory, setLoadingInventory] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Movimientos de inventario
  const [movements, setMovements] = useState<any[]>([])
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [errorMovements, setErrorMovements] = useState<string | null>(null)

  // ================================================
  // CARGAR MOVIMIENTOS DE INVENTARIO
  // ================================================
  const fetchMovements = async (params: {
    limit?: number
    offset?: number
    movementType?: string | null
    search?: string | null
    dateFrom?: string | null
    dateTo?: string | null
  } = {}) => {
    if (!projectId) {
      setErrorMovements('No projectId')
      return
    }
    setLoadingMovements(true)
    setErrorMovements(null)
    try {
      const searchParams = new URLSearchParams({
        projectId,
        limit: (params.limit || 50).toString(),
        offset: (params.offset || 0).toString()
      })
      if (params.movementType) searchParams.set('movementType', params.movementType)
      if (params.search) searchParams.set('search', params.search)
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
      if (params.dateTo) searchParams.set('dateTo', params.dateTo)

      const response = await fetch(`/api/inventory/movements?${searchParams}`)
      const result = await response.json()
      console.log('[Inventory] Movements API response:', result)

      if (!response.ok) {
        console.error('[Inventory] Error cargando movimientos:', result.error)
        setErrorMovements(result.error?.message || result.error || 'Error cargando movimientos')
        setMovements([])
        return
      }
      if (result.success) {
        setMovements(Array.isArray(result.data) ? result.data : [])
        console.log('[Inventory] Movements loaded:', result.data)
      }
    } catch (err) {
      console.error('[Inventory] Movements fetch error:', err)
      setErrorMovements(err instanceof Error ? err.message : 'Error cargando movimientos')
      setMovements([])
    } finally {
      setLoadingMovements(false)
    }
  }

  // ================================================
  // CARGAR LISTA DE INVENTARIO
  // ================================================
  const fetchInventory = async () => {
    setLoadingInventory(true)
    setError(null)
    try {
      const response = await fetch(`/api/inventory/items?limit=100&includeZeroStock=true`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error?.message || result.error || 'Error cargando inventario')
        setInventory([])
        setTotalInventory(0)
        return
      }
      if (result.success) {
        const items = result.data || []
        setInventory(Array.isArray(items) ? items : [])
        setTotalInventory(items.length)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando inventario')
      setInventory([])
      setTotalInventory(0)
    } finally {
      setLoadingInventory(false)
    }
  }

  // ================================================
  // CARGAR DETALLES DE UN ITEM DE INVENTARIO
  // ================================================
  const fetchInventoryItem = async (inventoryId: number) => {
    if (!projectId) {
      setError('No projectId')
      return
    }
    setLoadingDetails(true)
    setError(null)
    try {
      const response = await fetch(`/api/inventory/items/${inventoryId}?projectId=${projectId}`)
      const result = await response.json()
      if (!response.ok) {
        setError(result.error?.message || result.error || 'Error cargando item')
        setInventoryDetails(null)
        return
      }
      if (result.success && result.data) {
        setInventoryDetails(result.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando item')
      setInventoryDetails(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  // ================================================
  // REFRESCAR DATOS
  // ================================================
  const refreshInventory = () => {
    fetchInventory()
  }

  // ================================================
  // LIMPIAR DETALLES
  // ================================================
  const clearInventoryDetails = () => {
    setInventoryDetails(null)
  }

  // ================================================
  // CREAR ITEM DE INVENTARIO
  // ================================================
  const createInventoryItem = async (formData: any) => {
    if (!projectId) {
      setError('No projectId')
      return null
    }
    setError(null)
    try {
      const response = await fetch(`/api/inventory/items?projectId=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error?.message || result.error || 'Error creando item')
        return null
      }
      if (result.success && result.data) {
        refreshInventory()
        return result.data
      }
      return null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando item')
      return null
    }
  }

  // ================================================
  // ACTUALIZAR ITEM DE INVENTARIO
  // ================================================
  const updateInventoryItem = async (inventoryId: number, formData: any) => {
    if (!projectId) {
      setError('No projectId')
      return null
    }
    setError(null)
    try {
      const response = await fetch(`/api/inventory/items/${inventoryId}?projectId=${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error?.message || result.error || 'Error actualizando item')
        return null
      }
      if (result.success && result.data) {
        refreshInventory()
        return result.data
      }
      return null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando item')
      return null
    }
  }

  // ================================================
  // ELIMINAR ITEM DE INVENTARIO
  // ================================================
  const deleteInventoryItem = async (inventoryId: number) => {
    if (!projectId) {
      setError('No projectId')
      return false
    }
    setError(null)
    try {
      const response = await fetch(`/api/inventory/items/${inventoryId}?projectId=${projectId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error?.message || result.error || 'Error eliminando item')
        return false
      }
      if (result.success) {
        refreshInventory()
        return true
      }
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando item')
      return false
    }
  }

  // ================================================
  // BUSCAR EN INVENTARIO (filtrado local)
  // ================================================
  const searchInventory = (searchTerm: string): any[] => {
    if (!searchTerm.trim()) return inventory
    const lower = searchTerm.toLowerCase()
    return inventory.filter(item =>
      (item.sku && item.sku.toLowerCase().includes(lower)) ||
      (item.product_name && item.product_name.toLowerCase().includes(lower)) ||
      (item.variant_name && item.variant_name.toLowerCase().includes(lower)) ||
      (item.location && item.location.toLowerCase().includes(lower))
    )
  }

  // ================================================
  // OBTENER ITEMS CON STOCK BAJO (filtrado local)
  // ================================================
  const getLowStockItems = (): any[] => {
    // From grouped structure: return variants that are at or below reorder_level
    const low: any[] = []
    inventory.forEach(prod => {
      const variantes = (prod as any).variantes || []
      variantes.forEach((v: any) => {
        if (typeof v.reorder_level !== 'undefined' && (v.stock_quantity || 0) <= (v.reorder_level || 0)) {
          low.push({
            ...prod,
            product_name: prod.product_name,
            product_sku: prod.product_sku,
            variant_name: v.name,
            id: v.variante_id,
            quantity_available: v.stock_quantity,
            reorder_level: v.reorder_level
          })
        }
      })
    })
    return low
  }

  // ================================================
  // AJUSTAR STOCK (requiere endpoint específico)
  // ================================================
  const adjustStock = async (inventoryId: number, newQuantity: number, reason?: string) => {
    if (!projectId) {
      setError('No projectId')
      return false
    }
    setError(null)
    try {
      const response = await fetch(`/api/inventory/adjust?projectId=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId, newQuantity, reason })
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error?.message || result.error || 'Error ajustando stock')
        return false
      }
      if (result.success) {
        refreshInventory()
        return true
      }
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error ajustando stock')
      return false
    }
  }

  // ================================================
  // RETORNO
  // ================================================
  return {
    inventory,
    inventoryDetails,
    totalInventory,
    loadingInventory,
    loadingDetails,
    isLoading: loadingInventory || loadingDetails,
    error,
    fetchInventory,
    fetchInventoryItem,
    refreshInventory,
    clearInventoryDetails,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    searchInventory,
    getLowStockItems,
    adjustStock,

    // Movimientos
    movements,
    loadingMovements,
    errorMovements,
    fetchMovements
  }
}