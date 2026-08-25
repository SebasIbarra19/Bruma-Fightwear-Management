// ================================================
// 📦 INVENTORY ITEM BY ID API ENDPOINT
// GET /api/inventory/items/[id] - Detalle de item de inventario
// ================================================

import { NextRequest } from 'next/server'
import { withErrorHandling, withProjectValidation, withAuth } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response-builder'
import { InventoryAdapter } from '@/lib/database/adapters/inventory-adapter'
import { ValidationError, NotFoundError } from '@/lib/api/error-handler'

// Autenticada: lee cookies de sesion, asi que nunca puede prerenderizarse.
// Sin esto Next intenta hacerlo en el build y escupe 'Dynamic server usage'.
export const dynamic = 'force-dynamic';


/**
 * GET /api/inventory/items/[id]
 * Path params:
 * - id: string (requerido)
 * Query params:
 * - projectId: string (requerido)
 */
async function getInventoryItemByIdHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId') || searchParams.get('project_id')
  const inventoryId = params.id

  if (!projectId) {
    throw new ValidationError('projectId es requerido')
  }
  if (!inventoryId) {
    throw new ValidationError('id es requerido')
  }

  console.log('🔷 [API] GET /api/inventory/items/[id]', { projectId, inventoryId })

  const invId = parseInt(inventoryId, 10)
  if (isNaN(invId)) throw new ValidationError('id debe ser numérico')

  const adapter = new InventoryAdapter()
  const item = await adapter.getInventoryItemById(projectId || '', invId)

  if (!item) {
    throw new NotFoundError('Item de inventario no encontrado')
  }

  return ApiResponse.success(item)
}

// ================================================
// EXPORTS CON MIDDLEWARE
// ================================================

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(withAuth(async (req: NextRequest) => {
    return getInventoryItemByIdHandler(req, context)
  }))(request)
}
