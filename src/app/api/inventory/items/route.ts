import { NextRequest } from 'next/server'
import { withErrorHandling } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response-builder'
import { InventoryAdapter } from '@/lib/database/adapters/inventory-adapter'
import { ValidationError } from '@/lib/api/error-handler'

async function getInventoryItemsHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const includeZeroStock = searchParams.get('includeZeroStock') === 'true' || searchParams.get('include_zero_stock') === 'true'
  const includeUnstocked = searchParams.get('includeUnstocked') === 'true' || searchParams.get('include_unstocked') === 'true'
  const categoryFilter = searchParams.get('categoryFilter') || searchParams.get('category_filter')
  const categoryId = categoryFilter ? parseInt(categoryFilter, 10) : null

  if (limit < 1 || limit > 200) {
    throw new ValidationError('limit debe estar entre 1 y 200')
  }
  if (offset < 0) {
    throw new ValidationError('offset debe ser mayor o igual a 0')
  }

  const adapter = new InventoryAdapter()
  const items = await adapter.getInventoryItems(undefined, {
    includeZeroStock,
    includeUnstocked,
    categoryFilter: categoryId,
    limit,
    offset
  })

  const totalCount = items.length
  const page = Math.floor(offset / limit) + 1

  return ApiResponse.paginated(
    items,
    totalCount,
    page,
    limit
  )
}

export const GET = withErrorHandling(getInventoryItemsHandler)