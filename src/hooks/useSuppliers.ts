'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'
import type { 
  Supplier, 
  SupplierInsert, 
  SupplierUpdate, 
  SupplierWithStats,
  SupplierFormData,
  Database 
} from '@/types/database'

export function useSuppliers(projectId?: string) {
  const supabase = createClientComponentClient<Database>()
  const { user } = useAuth()
  const [suppliers, setSuppliers] = useState<SupplierWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar proveedores sin estadísticas por defecto (optimizado)
  const fetchSuppliers = async (includeStats = false) => {
    if (!user?.id || !projectId) return

    try {
      setError(null)
      
      const { data, error: queryError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true })

      if (queryError) throw queryError

      if (data) {
        if (includeStats) {
          // Solo cargar estadísticas si son necesarias
          const { data: orderStats } = await supabase
            .from('purchase_orders')
            .select('supplier_id, status, total_amount')

          const suppliersWithStats = data.map((supplier: Supplier) => {
            const supplierOrders = orderStats?.filter(order => order.supplier_id === supplier.id) || []
            const pendingOrders = supplierOrders.filter(order => 
              ['draft', 'pending', 'ordered', 'partial'].includes(order.status)
            ).length
            
            const totalSpent = supplierOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

            return {
              ...supplier,
              total_orders: supplierOrders.length,
              pending_orders: pendingOrders,
              total_spent: totalSpent,
              last_order_date: undefined // Cambiar null por undefined
            } as SupplierWithStats
          })
          
          setSuppliers(suppliersWithStats)
        } else {
          // Sin estadísticas para carga rápida
          const suppliersBasic = data.map((supplier: Supplier) => ({
            ...supplier,
            total_orders: 0,
            pending_orders: 0,
            total_spent: 0,
            last_order_date: undefined
          } as SupplierWithStats))
          
          setSuppliers(suppliersBasic)
        }
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar proveedores')
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar un proveedor específico
  const fetchSupplier = async (id: string): Promise<Supplier | null> => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching supplier:', err)
      return null
    }
  }

  // Crear proveedor
  const createSupplier = async (formData: SupplierFormData): Promise<Supplier | null> => {
    if (!user?.id || !projectId) return null

    try {
      setError(null)
      
      const supplierData: SupplierInsert = {
        ...formData,
        project_id: projectId
      }

      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single()

      if (error) throw error

      // Actualizar la lista local
      await fetchSuppliers()
      
      return data
    } catch (err) {
      console.error('Error creating supplier:', err)
      setError(err instanceof Error ? err.message : 'Error al crear proveedor')
      return null
    }
  }

  // Actualizar proveedor
  const updateSupplier = async (id: string, formData: Partial<SupplierFormData>): Promise<Supplier | null> => {
    if (!user?.id || !projectId) return null

    try {
      setError(null)
      
      const supplierData: SupplierUpdate = {
        ...formData,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Actualizar la lista local
      setSuppliers(prev => prev.map(supplier => 
        supplier.id === id ? { ...supplier, ...data } : supplier
      ))
      
      return data
    } catch (err) {
      console.error('Error updating supplier:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar proveedor')
      return null
    }
  }

  // Eliminar proveedor
  const deleteSupplier = async (id: string): Promise<boolean> => {
    try {
      setError(null)

      // Verificar si tiene órdenes de compra asociadas
      const { data: orders } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('supplier_id', id)
        .limit(1)

      if (orders && orders.length > 0) {
        setError('No se puede eliminar el proveedor porque tiene órdenes de compra asociadas')
        return false
      }

      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Actualizar la lista local
      setSuppliers(prev => prev.filter(supplier => supplier.id !== id))
      
      return true
    } catch (err) {
      console.error('Error deleting supplier:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar proveedor')
      return false
    }
  }

  // Buscar proveedores
  const searchSuppliers = async (searchTerm: string): Promise<SupplierWithStats[]> => {
    if (!searchTerm.trim()) return suppliers

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,tax_id.ilike.%${searchTerm}%`)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error searching suppliers:', err)
      return []
    }
  }

  // Cargar proveedores al montar el componente
  useEffect(() => {
    if (user?.id && projectId) {
      fetchSuppliers()
    }
  }, [user?.id, projectId])

  return {
    suppliers,
    isLoading,
    error,
    fetchSuppliers,
    fetchSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    searchSuppliers
  }
}