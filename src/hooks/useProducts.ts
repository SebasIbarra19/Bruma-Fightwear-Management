'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, ProductVariant } from '@/types/database'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get current user and project
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Usuario no autenticado')
        return
      }

      // For now, we'll return an empty array since products functionality
      // is not part of Phase 2. This prevents the import error.
      setProducts([])
      
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Error al obtener productos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchProductVariants = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // For now, we'll return an empty array since product variants functionality
      // is not part of Phase 2. This prevents the import error.
      setProductVariants([])
      
    } catch (err) {
      console.error('Error fetching product variants:', err)
      setError('Error al obtener variantes de productos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    products,
    productVariants,
    isLoading,
    error,
    fetchProducts,
    fetchProductVariants
  }
}