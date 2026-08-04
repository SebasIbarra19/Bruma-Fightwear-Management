// ================================================
// � PRODUCTS API ENDPOINT
// GET /api/products - Lista productos con filtros
// Migrado a nueva arquitectura con ProductsAdapter
// ================================================

import { NextRequest } from 'next/server'
import { withErrorHandling } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response-builder'
import { ProductsAdapter } from '@/lib/database/adapters/products-adapter'
import { ValidationError } from '@/lib/api/error-handler'

/**
 * GET /api/products
 * 
 * Query params:
 * - limit: number (opcional, default: 50)
 * - offset: number (opcional, default: 0)
 * - categoryFilter: string (opcional)
 * - search: string (opcional)
 * - includeInactive: boolean (opcional, default: false)
 */
async function getProductsHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const categoryFilter = searchParams.get('categoryFilter')
  const search = searchParams.get('search')
  const includeInactive = searchParams.get('includeInactive') === 'true'

  if (limit < 1 || limit > 200) {
    throw new ValidationError('limit debe estar entre 1 y 200')
  }

  if (offset < 0) {
    throw new ValidationError('offset debe ser mayor o igual a 0')
  }

  const adapter = new ProductsAdapter()
  const products = await adapter.getProducts({
    limit,
    offset,
    categoryFilter: categoryFilter ? parseInt(categoryFilter, 10) : null,
    search: search || null,
    includeInactive
  })

  const totalCount = products.length > 0 && (products[0] as any).total_count 
    ? parseInt((products[0] as any).total_count, 10)
    : products.length

  const page = Math.floor(offset / limit) + 1
  
  return ApiResponse.paginated(products, totalCount, page, limit)
}

export const GET = withErrorHandling(getProductsHandler)