// ================================================
// 📦 HOOK PARA DATOS DE INVENTARIO
// Maneja las consultas a las APIs de inventario
// ================================================

import { useState, useEffect } from 'react'

// Tipos para los datos de inventario
export interface InventoryStats {
  total_products: number
  total_items: number
  total_value: number
  low_stock_items: number
}

export interface InventoryAlert {
  alert_id: string
  product_id: string
  product_name: string
  variant_id: string
  variant_name: string
  variant_sku: string
  current_stock: number
  reorder_level: number
  reorder_quantity: number
  suggested_order_quantity: number
  alert_level: 'critical' | 'high' | 'medium' | 'low'
  estimated_cost: number
  location: string
  last_updated: string
}

export interface InventoryVariant {
  inventory_id: string
  variant_id: string
  variant_name: string
  variant_sku: string
  size: string
  color: string
  quantity_available: number
  quantity_reserved: number
  quantity_on_order: number
  reorder_level: number
  reorder_quantity: number
  unit_cost: number
  total_value: number
  location: string
  stock_status: string
  needs_reorder: boolean
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  name: string
  sku: string
  category_name: string
  total_variants: number
  total_stock: number
  total_value: number
  variants: InventoryVariant[]
  status: string
}

export interface InventoryValuation {
  total_items: number
  total_quantity: number
  total_value_at_cost: number
  total_value_at_price: number
  potential_profit: number
  profit_margin: number
  category_breakdown: {
    category_id: string | null
    category_name: string
    items: number
    quantity: number
    value_at_cost: number
    value_at_price: number
    profit: number
  }[]
}

export interface InventoryMovement {
  id: string
  type: 'entrada' | 'salida' | 'transferencia' | 'ajuste'
  product_id: string
  product_name: string
  product_sku: string
  variant_id?: string
  variant_name: string
  variant_sku: string
  sku: string
  quantity: number
  unit_cost: number
  total_cost: number
  location_from: string
  location_to: string
  reason: string
  reference: string
  user: string
  date: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface MovementStats {
  total_movements: number
  movements_by_type: {
    entries: number
    exits: number
    transfers: number
    adjustments: number
  }
  financial_summary: {
    total_value_in: number
    total_value_out: number
    net_value: number
  }
  insights: {
    most_active_product: string
    recent_movements: number
    movement_velocity: number
  }
}

export function useInventoryData(projectId?: string) {
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [movementStats, setMovementStats] = useState<MovementStats | null>(null)
  const [valuation, setValuation] = useState<InventoryValuation | null>(null)
  
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingAlerts, setLoadingAlerts] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [loadingMovementStats, setLoadingMovementStats] = useState(false)
  const [loadingValuation, setLoadingValuation] = useState(false)
  
  const [error, setError] = useState<string | null>(null)

  // Cargar estadísticas de inventario
  const fetchStats = async () => {
    if (!projectId) return
    
    setLoadingStats(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/inventory/stats?projectId=${projectId}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error cargando estadísticas')
      }
      
      if (result.success) {
        setStats(result.data)
        console.log('✅ Estadísticas de inventario cargadas:', result.data)
      }
    } catch (err) {
      console.error('❌ Error cargando estadísticas:', err)
      setError(err instanceof Error ? err.message : 'Error cargando estadísticas')
    } finally {
      setLoadingStats(false)
    }
  }

  // Cargar alertas de stock bajo
  const fetchAlerts = async (limit = 10) => {
    if (!projectId) return
    
    setLoadingAlerts(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/inventory/alerts?projectId=${projectId}&limit=${limit}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error cargando alertas')
      }
      
      if (result.success) {
        setAlerts(result.data || [])
        console.log('✅ Alertas de inventario cargadas:', result.data?.length || 0)
      }
    } catch (err) {
      console.error('❌ Error cargando alertas:', err)
      setError(err instanceof Error ? err.message : 'Error cargando alertas')
    } finally {
      setLoadingAlerts(false)
    }
  }

  // Cargar items de inventario
  const fetchItems = async (params: {
    limit?: number
    offset?: number
    search?: string
    status?: string
  } = {}) => {
    if (!projectId) return
    
    setLoadingItems(true)
    setError(null)
    
    try {
      const searchParams = new URLSearchParams({
        projectId,
        limit: (params.limit || 50).toString(),
        offset: (params.offset || 0).toString()
      })
      
      if (params.search) searchParams.set('search', params.search)
      if (params.status && params.status !== 'all') searchParams.set('status', params.status)
      
      const response = await fetch(`/api/inventory/items?${searchParams}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error cargando items')
      }
      
      if (result.success) {
        setItems(result.data || [])
        console.log('✅ Items de inventario cargados:', result.data?.length || 0)
      }
    } catch (err) {
      console.error('❌ Error cargando items:', err)
      setError(err instanceof Error ? err.message : 'Error cargando items')
    } finally {
      setLoadingItems(false)
    }
  }

  // Cargar valoración de inventario
  const fetchValuation = async () => {
    if (!projectId) return
    
    setLoadingValuation(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/inventory/valuation?projectId=${projectId}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error cargando valoración')
      }
      
      if (result.success) {
        setValuation(result.data)
        console.log('✅ Valoración de inventario cargada:', result.data)
      }
    } catch (err) {
      console.error('❌ Error cargando valoración:', err)
      setError(err instanceof Error ? err.message : 'Error cargando valoración')
    } finally {
      setLoadingValuation(false)
    }
  }

  // Cargar movimientos de inventario
  const fetchMovements = async (params: {
    limit?: number
    offset?: number
    type?: string
    dateFrom?: string
    dateTo?: string
    search?: string
  } = {}) => {
    if (!projectId) return
    
    setLoadingMovements(true)
    setError(null)
    
    try {
      const searchParams = new URLSearchParams({
        projectId,
        limit: (params.limit || 50).toString(),
        offset: (params.offset || 0).toString()
      })
      
      if (params.type) searchParams.set('type', params.type)
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
      if (params.dateTo) searchParams.set('dateTo', params.dateTo)
      if (params.search) searchParams.set('search', params.search)
      
      const response = await fetch(`/api/inventory/movements?${searchParams}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error cargando movimientos')
      }
      
      if (result.success) {
        setMovements(result.data || [])
        console.log('✅ Movimientos de inventario cargados:', result.data?.length || 0)
      }
    } catch (err) {
      console.error('❌ Error cargando movimientos:', err)
      setError(err instanceof Error ? err.message : 'Error cargando movimientos')
    } finally {
      setLoadingMovements(false)
    }
  }

  // Cargar estadísticas de movimientos
  const fetchMovementStats = async (params: {
    dateFrom?: string
    dateTo?: string
  } = {}) => {
    if (!projectId) return
    
    setLoadingMovementStats(true)
    setError(null)
    
    try {
      const searchParams = new URLSearchParams({ projectId })
      
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom)
      if (params.dateTo) searchParams.set('dateTo', params.dateTo)
      
      const response = await fetch(`/api/inventory/movements/stats?${searchParams}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error cargando estadísticas de movimientos')
      }
      
      if (result.success) {
        setMovementStats(result.data)
        console.log('✅ Estadísticas de movimientos cargadas')
      }
    } catch (err) {
      console.error('❌ Error cargando estadísticas de movimientos:', err)
      setError(err instanceof Error ? err.message : 'Error cargando estadísticas de movimientos')
    } finally {
      setLoadingMovementStats(false)
    }
  }

  // Cargar todos los datos iniciales
  const fetchAllData = async () => {
    await Promise.all([
      fetchStats(),
      fetchAlerts(),
      fetchItems(),
      fetchValuation()
    ])
  }

  // Cargar datos cuando cambie el projectId
  useEffect(() => {
    if (projectId) {
      fetchAllData()
    }
  }, [projectId])

  return {
    // Datos
    stats,
    alerts,
    items,
    movements,
    movementStats,
    valuation,
    
    // Estados de carga
    loadingStats,
    loadingAlerts,
    loadingItems,
    loadingMovements,
    loadingMovementStats,
    loadingValuation,
    loading: loadingStats || loadingAlerts || loadingItems || loadingMovements || loadingMovementStats || loadingValuation,
    
    // Error
    error,
    
    // Funciones
    fetchStats,
    fetchAlerts,
    fetchItems,
    fetchMovements,
    fetchMovementStats,
    fetchValuation,
    fetchAllData,
    
    // Funciones de recarga
    refetchStats: fetchStats,
    refetchAlerts: fetchAlerts,
    refetchItems: fetchItems,
    refetchValuation: fetchValuation
  }
}