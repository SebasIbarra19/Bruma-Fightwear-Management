// ================================================
// 📦 HOOK PARA DATOS DE PRODUCTOS
// Maneja las consultas a las APIs de productos
// ================================================

'use client'

import { useState } from 'react'

// ================================================
// TIPOS
// ================================================

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku: string
  size: string | null
  color: string | null
  price: number
  cost: number
  stock_quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  project_id: string
  name: string
  description: string | null
  sku: string
  category_id: string | null
  category_name: string | null
  base_price: number
  cost_price: number
  is_active: boolean
  has_variants: boolean
  variant_count: number
  total_stock: number
  created_at: string
  updated_at: string
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[]
}

// ================================================
// HOOK PRINCIPAL
// ================================================

export function useProducts(projectId?: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [productDetails, setProductDetails] = useState<ProductWithVariants | null>(null)
  const [totalProducts, setTotalProducts] = useState(0)
  
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  const [error, setError] = useState<string | null>(null)

  // ================================================
  // CARGAR LISTA DE PRODUCTOS
  // ================================================
  const fetchProducts = async (params: {
    limit?: number
    offset?: number
    categoryFilter?: string | null
    search?: string | null
    includeInactive?: boolean
  } = {}) => {
    if (!projectId) {
      console.warn('⚠️ [useProducts] No projectId provided')
      return
    }
    
    setLoadingProducts(true)
    setError(null)
    
    try {
      const searchParams = new URLSearchParams({
        projectId,
        limit: (params.limit || 50).toString(),
        offset: (params.offset || 0).toString()
      })
      
      if (params.categoryFilter) {
        searchParams.set('categoryFilter', params.categoryFilter)
      }
      if (params.search) {
        searchParams.set('search', params.search)
      }
      if (params.includeInactive !== undefined) {
        searchParams.set('includeInactive', params.includeInactive.toString())
      }
      
      const response = await fetch(`/api/products?${searchParams}`)
      const result = await response.json()
      
      console.log('🔍 DEBUG - Products result:', JSON.stringify(result, null, 2))
      console.log('🔍 DEBUG - Response status:', response.status, response.ok)
      
      if (!response.ok) {
        const errorMsg = result.error?.message || result.error || JSON.stringify(result)
        console.error('❌ API Error:', errorMsg)
        throw new Error(errorMsg)
      }
      
      if (result.success) {
        // Extraer items del resultado paginado
        const productsData = result.data?.items || result.data || []
        setProducts(Array.isArray(productsData) ? productsData : [])
        setTotalProducts(result.data?.total || result.total || productsData.length)
        console.log('✅ Productos cargados:', productsData.length)
      }
    } catch (err) {
      console.error('❌ Error cargando productos:', err)
      setError(err instanceof Error ? err.message : 'Error cargando productos')
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  // ================================================
  // CARGAR DETALLES DE UN PRODUCTO (con variantes)
  // ================================================
  const fetchProductDetails = async (productId: string) => {
    if (!projectId) {
      console.warn('⚠️ [useProducts] No projectId provided')
      return
    }
    
    setLoadingDetails(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/products/${productId}?projectId=${projectId}`)
      const result = await response.json()
      
      console.log('🔍 DEBUG - Product details result:', JSON.stringify(result, null, 2))
      
      if (!response.ok) {
        throw new Error(result.error || 'Error cargando detalles del producto')
      }
      
      if (result.success && result.data) {
        setProductDetails(result.data)
        console.log('✅ Detalles del producto cargados:', result.data)
      }
    } catch (err) {
      console.error('❌ Error cargando detalles del producto:', err)
      setError(err instanceof Error ? err.message : 'Error cargando detalles del producto')
      setProductDetails(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  // ================================================
  // REFRESCAR DATOS
  // ================================================
  const refreshProducts = () => {
    fetchProducts()
  }

  // ================================================
  // LIMPIAR DETALLES
  // ================================================
  const clearProductDetails = () => {
    setProductDetails(null)
  }

  // ================================================
  // RETORNO
  // ================================================
  return {
    // Datos
    products,
    productDetails,
    totalProducts,
    
    // Estados de carga
    loadingProducts,
    loadingDetails,
    isLoading: loadingProducts || loadingDetails,
    
    // Error
    error,
    
    // Métodos
    fetchProducts,
    fetchProductDetails,
    refreshProducts,
    clearProductDetails,
    
    // Alias para compatibilidad con código existente
    productVariants: productDetails?.variants || [],
  }
}