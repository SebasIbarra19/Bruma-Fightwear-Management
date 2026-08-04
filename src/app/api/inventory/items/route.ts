// ================================================
// 📦 INVENTORY ITEMS API ENDPOINT
// GET /api/inventory/items - Lista items de inventario
// ================================================

import { NextRequest } from 'next/server'
import { withErrorHandling, withProjectValidation } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response-builder'
import { InventoryAdapter } from '@/lib/database/adapters/inventory-adapter'
import { ValidationError } from '@/lib/api/error-handler'

/**
 * GET /api/inventory/items
 * Query params:
 * - projectId: string (requerido)
 * - limit: number (opcional, default: 50)
 * - offset: number (opcional, default: 0)
 * - includeZeroStock: boolean (opcional, default: false)
 * - categoryFilter: string (opcional)
 * - locationFilter: string (opcional)
 */
async function getInventoryItemsHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  // Obtener parámetros
  const projectId = searchParams.get('projectId') || searchParams.get('project_id')
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const includeZeroStock = searchParams.get('includeZeroStock') === 'true' || searchParams.get('include_zero_stock') === 'true'
  const categoryFilter = searchParams.get('categoryFilter') || searchParams.get('category_filter')
  const categoryId = categoryFilter ? parseInt(categoryFilter, 10) : null

  // Validar limit/offset
  if (limit < 1 || limit > 200) {
    throw new ValidationError('limit debe estar entre 1 y 200')
  }
  if (offset < 0) {
    throw new ValidationError('offset debe ser mayor o igual a 0')
  }

  console.log('🔷 [API] GET /api/inventory/items', {
    projectId, limit, offset, includeZeroStock, categoryId
  })

  // Obtener items usando el adapter
  const adapter = new InventoryAdapter()
  const items = await adapter.getInventoryItems(projectId || undefined, {
    includeZeroStock,
    categoryFilter: categoryId,
    limit,
    offset
  })

  // Paginación
  const totalCount = items.length
  const page = Math.floor(offset / limit) + 1

  return ApiResponse.paginated(
    items,
    totalCount,
    page,
    limit
  )
}

// ================================================
// EXPORTS CON MIDDLEWARE
// ================================================

export const GET = withErrorHandling(
  withProjectValidation(getInventoryItemsHandler)
)