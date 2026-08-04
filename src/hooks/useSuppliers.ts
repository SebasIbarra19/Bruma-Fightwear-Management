'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { SuppliersAdapter, Supplier } from '@/lib/database/adapters/suppliers-adapter'

export interface SupplierWithStats extends Supplier {
  total_orders: number;
  pending_orders: number;
  total_spent: number;
}

export function useSuppliers(projectId?: string) {
  const { user } = useAuth()
  const [suppliers, setSuppliers] = useState<SupplierWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const adapter = new SuppliersAdapter()

  const fetchSuppliers = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      setError(null)
      const data = await adapter.listSuppliers({ limit: 100 })
      
      const suppliersBasic = data.map((supplier: Supplier) => ({
        ...supplier,
        total_orders: 0,
        pending_orders: 0,
        total_spent: 0
      }))
      
      setSuppliers(suppliersBasic)
    } catch (err) {
      console.error('Error fetching suppliers:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar proveedores')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSupplier = async (id: number): Promise<Supplier | null> => {
    try {
      return await adapter.getSupplierById(id)
    } catch (err) {
      console.error('Error fetching supplier:', err)
      return null
    }
  }

  const createSupplier = async (formData: any): Promise<Supplier | null> => {
    try {
      setError(null)
      const data = await adapter.createSupplier(formData)
      await fetchSuppliers()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proveedor')
      return null
    }
  }

  const updateSupplier = async (id: number, formData: any): Promise<Supplier | null> => {
    try {
      setError(null)
      const data = await adapter.updateSupplier(id, formData)
      setSuppliers(prev => prev.map(s => s.id_proveedor === id ? { ...s, ...data } : s))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar proveedor')
      return null
    }
  }

  const deleteSupplier = async (id: number): Promise<boolean> => {
    try {
      setError(null)
      const { success } = await adapter.deleteSupplier(id)
      if (success) {
        setSuppliers(prev => prev.filter(s => s.id_proveedor !== id))
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar proveedor')
      return false
    }
  }

  useEffect(() => {
    if (user?.id) {
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
    deleteSupplier
  }
}
