'use client'

import { useState, useEffect } from 'react'

/**
 * HOOK PLACEHOLDER - Purchase Orders ya no existe en el nuevo schema.sql
 * Se mantiene el archivo para no romper importaciones, pero devuelve datos vacíos.
 */
export function usePurchaseOrders(_projectId?: string) {
  const [purchaseOrders, _setPurchaseOrders] = useState<any[]>([])
  const [isLoading, _setIsLoading] = useState(false)
  const [error, _setError] = useState<string | null>(null)

  const fetchPurchaseOrders = async () => {}
  const fetchPurchaseOrder = async (_id: string) => null
  const createPurchaseOrder = async (_formData: any) => null
  const updatePurchaseOrder = async (_id: string, _data: any) => null
  const updateOrderStatus = async (_id: string, _status: any) => false
  const deletePurchaseOrder = async (_id: string) => false
  const searchPurchaseOrders = async (_term: string) => []
  const getOrdersByStatus = async (_status: any) => []

  useEffect(() => {
    // No hace nada
  }, [])

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
