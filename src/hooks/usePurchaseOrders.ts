'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'
import type { 
  PurchaseOrder,
  PurchaseOrderInsert, 
  PurchaseOrderUpdate, 
  PurchaseOrderWithDetails,
  PurchaseOrderItem,
  PurchaseOrderItemInsert,
  PurchaseOrderItemUpdate,
  PurchaseOrderItemWithDetails,
  PurchaseOrderFormData,
  PurchaseOrderStatus,
  Database 
} from '@/types/database'

export function usePurchaseOrders(projectId?: string) {
  const supabase = createClientComponentClient<Database>()
  const { user } = useAuth()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar órdenes de compra con detalles
  const fetchPurchaseOrders = async (includeDetails = true) => {
    if (!user?.id) return

    try {
      setError(null)
      
      let queryResult
      
      if (includeDetails) {
        let query = supabase
          .from('purchase_orders')
          .select(`
            *,
            suppliers(name, email),
            purchase_order_items(
              *,
              products(name),
              product_variants(name)
            )
          `)
          
        if (projectId) {
          query = query.eq('project_id', projectId)
        }
        
        queryResult = await query.order('order_date', { ascending: false })
      } else {
        let query = supabase
          .from('purchase_orders')
          .select('*')
          
        if (projectId) {
          query = query.eq('project_id', projectId)
        }
        
        queryResult = await query.order('order_date', { ascending: false })
      }

      const { data, error: queryError } = queryResult

      if (queryError) throw queryError

      // Procesar datos con detalles
      const processedData = includeDetails && data 
        ? data.map((order: any) => {
            const supplier = order.suppliers
            const items = order.purchase_order_items || []
            
            const itemsWithDetails = items.map((item: any) => ({
              ...item,
              product_name: item.products?.name,
              variant_name: item.product_variants?.name,
              remaining_quantity: item.quantity_ordered - (item.quantity_received || 0)
            }))

            return {
              ...order,
              supplier_name: supplier?.name,
              supplier_email: supplier?.email,
              items_count: items.length,
              items: itemsWithDetails
            } as PurchaseOrderWithDetails
          })
        : data || []

      setPurchaseOrders(processedData)
    } catch (err) {
      console.error('Error fetching purchase orders:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar órdenes de compra')
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar una orden de compra específica
  const fetchPurchaseOrder = async (id: string): Promise<PurchaseOrderWithDetails | null> => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name, email),
          purchase_order_items(
            *,
            products(name),
            product_variants(name)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      if (data) {
        const supplier = data.suppliers
        const items = data.purchase_order_items || []
        
        const itemsWithDetails = items.map((item: any) => ({
          ...item,
          product_name: item.products?.name,
          variant_name: item.product_variants?.name,
          remaining_quantity: item.quantity_ordered - (item.quantity_received || 0)
        }))

        return {
          ...data,
          supplier_name: supplier?.name,
          supplier_email: supplier?.email,
          items_count: items.length,
          items: itemsWithDetails
        } as PurchaseOrderWithDetails
      }
      
      return null
    } catch (err) {
      console.error('Error fetching purchase order:', err)
      return null
    }
  }

  // Crear orden de compra
  const createPurchaseOrder = async (formData: PurchaseOrderFormData): Promise<PurchaseOrder | null> => {
    if (!user?.id) return null

    try {
      setError(null)
      
      const { items, ...orderData } = formData
      
      const purchaseOrderData: PurchaseOrderInsert = {
        ...orderData,
        project_id: user.id,
        created_by: user.id
      }

      // Crear la orden de compra
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert([purchaseOrderData])
        .select()
        .single()

      if (orderError) throw orderError

      // Crear los ítems de la orden
      if (items && items.length > 0) {
        const itemsData: PurchaseOrderItemInsert[] = items.map(item => ({
          ...item,
          purchase_order_id: order.id,
          project_id: user.id
        }))

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsData)

        if (itemsError) throw itemsError
      }

      // Actualizar la lista local
      await fetchPurchaseOrders()
      
      return order
    } catch (err) {
      console.error('Error creating purchase order:', err)
      setError(err instanceof Error ? err.message : 'Error al crear orden de compra')
      return null
    }
  }

  // Actualizar orden de compra
  const updatePurchaseOrder = async (
    id: string, 
    orderData: Partial<Omit<PurchaseOrderFormData, 'items'>>,
    items?: PurchaseOrderItemWithDetails[]
  ): Promise<PurchaseOrder | null> => {
    if (!user?.id) return null

    try {
      setError(null)
      
      const purchaseOrderData: PurchaseOrderUpdate = {
        ...orderData,
        updated_at: new Date().toISOString()
      }

      // Actualizar la orden de compra
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .update(purchaseOrderData)
        .eq('id', id)
        .select()
        .single()

      if (orderError) throw orderError

      // Si se proporcionaron ítems, actualizarlos
      if (items) {
        // Primero eliminar ítems existentes
        const { error: deleteError } = await supabase
          .from('purchase_order_items')
          .delete()
          .eq('purchase_order_id', id)

        if (deleteError) throw deleteError

        // Luego insertar los nuevos ítems
        const itemsData: PurchaseOrderItemInsert[] = items.map(item => ({
          sku: item.sku,
          description: item.description,
          quantity_ordered: item.quantity_ordered,
          unit_cost: item.unit_cost,
          total_cost: item.total_cost,
          notes: item.notes,
          product_id: item.product_id,
          product_variant_id: item.product_variant_id,
          purchase_order_id: id,
          project_id: user.id
        }))

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsData)

        if (itemsError) throw itemsError
      }

      // Actualizar la lista local
      setPurchaseOrders(prev => prev.map(po => 
        po.id === id ? { ...po, ...order } : po
      ))
      
      return order
    } catch (err) {
      console.error('Error updating purchase order:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar orden de compra')
      return null
    }
  }

  // Cambiar estado de orden de compra
  const updateOrderStatus = async (id: string, status: PurchaseOrderStatus): Promise<boolean> => {
    if (!user?.id) return false

    try {
      setError(null)

      const { error } = await supabase
        .from('purchase_orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      // Actualizar la lista local
      setPurchaseOrders(prev => prev.map(po => 
        po.id === id ? { ...po, status } : po
      ))

      return true
    } catch (err) {
      console.error('Error updating order status:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar estado de orden')
      return false
    }
  }

  // Eliminar orden de compra
  const deletePurchaseOrder = async (id: string): Promise<boolean> => {
    try {
      setError(null)

      // Verificar que la orden esté en estado borrador o pendiente
      const { data: order } = await supabase
        .from('purchase_orders')
        .select('status')
        .eq('id', id)
        .single()

      if (order && !['draft', 'pending'].includes(order.status)) {
        setError('Solo se pueden eliminar órdenes en estado borrador o pendiente')
        return false
      }

      // Eliminar ítems primero
      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq('purchase_order_id', id)

      if (itemsError) throw itemsError

      // Luego eliminar la orden
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Actualizar la lista local
      setPurchaseOrders(prev => prev.filter(po => po.id !== id))
      
      return true
    } catch (err) {
      console.error('Error deleting purchase order:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar orden de compra')
      return false
    }
  }

  // Buscar órdenes de compra
  const searchPurchaseOrders = async (searchTerm: string): Promise<PurchaseOrderWithDetails[]> => {
    if (!searchTerm.trim()) return purchaseOrders

    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name, email)
        `)
        .or(`order_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
        .order('order_date', { ascending: false })

      if (error) throw error
      
      return data?.map((order: any) => ({
        ...order,
        supplier_name: order.suppliers?.name,
        supplier_email: order.suppliers?.email,
        items_count: 0,
        items: []
      })) || []
    } catch (err) {
      console.error('Error searching purchase orders:', err)
      return []
    }
  }

  // Obtener órdenes por estado
  const getOrdersByStatus = async (status: PurchaseOrderStatus): Promise<PurchaseOrderWithDetails[]> => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name, email)
        `)
        .eq('status', status)
        .order('order_date', { ascending: false })

      if (error) throw error
      
      return data?.map((order: any) => ({
        ...order,
        supplier_name: order.suppliers?.name,
        supplier_email: order.suppliers?.email,
        items_count: 0,
        items: []
      })) || []
    } catch (err) {
      console.error('Error getting orders by status:', err)
      return []
    }
  }

  // Cargar órdenes al montar el componente
  useEffect(() => {
    if (user?.id) {
      fetchPurchaseOrders()
    }
  }, [user?.id])

  return {
    purchaseOrders,
    isLoading,
    error,
    fetchPurchaseOrders,
    fetchPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    updateOrderStatus,
    deletePurchaseOrder,
    searchPurchaseOrders,
    getOrdersByStatus
  }
}