'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'
import type { 
  Inventory, 
  InventoryInsert, 
  InventoryUpdate, 
  InventoryWithDetails,
  InventoryFormData,
  Database 
} from '@/types/database'

export function useInventory(projectId?: string) {
  const supabase = createClientComponentClient<Database>()
  const { user } = useAuth()
  const [inventory, setInventory] = useState<InventoryWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar inventario con detalles
  const fetchInventory = async (includeDetails = true) => {
    if (!user?.id) return

    try {
      setError(null)
      
      let queryResult
      
      if (includeDetails) {
        let query = supabase
          .from('inventory')
          .select(`
            *,
            products(name, sku),
            product_variants(name),
            suppliers(name)
          `)
          
        if (projectId) {
          query = query.eq('project_id', projectId)
        }
        
        queryResult = await query.order('sku', { ascending: true })
      } else {
        let query = supabase
          .from('inventory')
          .select('*')
          
        if (projectId) {
          query = query.eq('project_id', projectId)
        }
        
        queryResult = await query.order('sku', { ascending: true })
      }

      const { data, error: queryError } = queryResult

      if (queryError) throw queryError

      // Procesar datos con detalles
      const processedData = includeDetails && data 
        ? data.map((item: any) => {
            const product = item.products
            const variant = item.product_variants
            const supplier = item.suppliers
            
            return {
              ...item,
              product_name: product?.name,
              product_sku: product?.sku,
              variant_name: variant?.name,
              supplier_name: supplier?.name,
              total_quantity: item.quantity_available + item.quantity_reserved + item.quantity_on_order,
              available_quantity: item.quantity_available,
              low_stock: item.reorder_level && item.quantity_available <= item.reorder_level
            } as InventoryWithDetails
          })
        : data || []

      setInventory(processedData)
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar inventario')
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar un elemento de inventario específico
  const fetchInventoryItem = async (id: string): Promise<Inventory | null> => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching inventory item:', err)
      return null
    }
  }

  // Crear elemento de inventario
  const createInventoryItem = async (formData: InventoryFormData): Promise<Inventory | null> => {
    if (!user?.id) return null

    try {
      setError(null)
      
      const inventoryData: InventoryInsert = {
        ...formData,
        project_id: user.id
      }

      const { data, error } = await supabase
        .from('inventory')
        .insert([inventoryData])
        .select()
        .single()

      if (error) throw error

      // Actualizar la lista local
      await fetchInventory()
      
      return data
    } catch (err) {
      console.error('Error creating inventory item:', err)
      setError(err instanceof Error ? err.message : 'Error al crear elemento de inventario')
      return null
    }
  }

  // Actualizar elemento de inventario
  const updateInventoryItem = async (id: string, formData: Partial<InventoryFormData>): Promise<Inventory | null> => {
    if (!user?.id) return null

    try {
      setError(null)
      
      const inventoryData: InventoryUpdate = {
        ...formData,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('inventory')
        .update(inventoryData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Actualizar la lista local
      setInventory(prev => prev.map(item => 
        item.id === id ? { ...item, ...data } : item
      ))
      
      return data
    } catch (err) {
      console.error('Error updating inventory item:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar elemento de inventario')
      return null
    }
  }

  // Eliminar elemento de inventario
  const deleteInventoryItem = async (id: string): Promise<boolean> => {
    try {
      setError(null)

      // Verificar si tiene movimientos asociados
      const { data: movements } = await supabase
        .from('inventory_movements')
        .select('id')
        .eq('inventory_id', id)
        .limit(1)

      if (movements && movements.length > 0) {
        setError('No se puede eliminar el elemento de inventario porque tiene movimientos asociados')
        return false
      }

      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Actualizar la lista local
      setInventory(prev => prev.filter(item => item.id !== id))
      
      return true
    } catch (err) {
      console.error('Error deleting inventory item:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar elemento de inventario')
      return false
    }
  }

  // Buscar en inventario
  const searchInventory = async (searchTerm: string): Promise<InventoryWithDetails[]> => {
    if (!searchTerm.trim()) return inventory

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products(name, sku),
          product_variants(name),
          suppliers(name)
        `)
        .or(`sku.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
        .order('sku', { ascending: true })

      if (error) throw error
      
      return data?.map((item: any) => ({
        ...item,
        product_name: item.products?.name,
        product_sku: item.products?.sku,
        variant_name: item.product_variants?.name,
        supplier_name: item.suppliers?.name,
        total_quantity: item.quantity_available + item.quantity_reserved + item.quantity_on_order,
        available_quantity: item.quantity_available,
        low_stock: item.reorder_level && item.quantity_available <= item.reorder_level
      })) || []
    } catch (err) {
      console.error('Error searching inventory:', err)
      return []
    }
  }

  // Obtener elementos con stock bajo
  const getLowStockItems = async (): Promise<InventoryWithDetails[]> => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products(name, sku),
          product_variants(name),
          suppliers(name)
        `)
        .not('reorder_level', 'is', null)
        .order('quantity_available', { ascending: true })

      if (error) throw error

      return data?.filter((item: any) => item.quantity_available <= item.reorder_level)
        .map((item: any) => ({
          ...item,
          product_name: item.products?.name,
          product_sku: item.products?.sku,
          variant_name: item.product_variants?.name,
          supplier_name: item.suppliers?.name,
          total_quantity: item.quantity_available + item.quantity_reserved + item.quantity_on_order,
          available_quantity: item.quantity_available,
          low_stock: true
        })) || []
    } catch (err) {
      console.error('Error getting low stock items:', err)
      return []
    }
  }

  // Ajustar stock
  const adjustStock = async (
    inventoryId: string, 
    newQuantity: number, 
    reason?: string
  ): Promise<boolean> => {
    if (!user?.id) return false

    try {
      setError(null)

      // Obtener cantidad actual
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory')
        .select('quantity_available')
        .eq('id', inventoryId)
        .single()

      if (fetchError) throw fetchError

      const adjustment = newQuantity - currentItem.quantity_available

      // Actualizar inventario
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ 
          quantity_available: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventoryId)

      if (updateError) throw updateError

      // Registrar movimiento de ajuste
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert([{
          inventory_id: inventoryId,
          movement_type: 'adjustment',
          quantity: Math.abs(adjustment),
          notes: reason || `Ajuste de inventario: ${adjustment > 0 ? '+' : ''}${adjustment}`,
          project_id: user.id
        }])

      if (movementError) throw movementError

      // Actualizar lista local
      await fetchInventory()
      
      return true
    } catch (err) {
      console.error('Error adjusting stock:', err)
      setError(err instanceof Error ? err.message : 'Error al ajustar stock')
      return false
    }
  }

  // Cargar inventario al montar el componente
  useEffect(() => {
    if (user?.id) {
      fetchInventory()
    }
  }, [user?.id])

  return {
    inventory,
    isLoading,
    error,
    fetchInventory,
    fetchInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    searchInventory,
    getLowStockItems,
    adjustStock
  }
}