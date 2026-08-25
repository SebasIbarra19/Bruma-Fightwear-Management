// ================================================
// 📦 INVENTORY MOVEMENTS API ENDPOINT
// GET /api/inventory/movements - Lista movimientos
// POST /api/inventory/movements - Crear movimiento
// ================================================

import { NextRequest } from 'next/server'
import { withErrorHandling, withProjectValidation, withAuth } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response-builder'
import { InventoryAdapter } from '@/lib/database/adapters/inventory-adapter'
import { ValidationError } from '@/lib/api/error-handler'

// Autenticada: lee cookies de sesion, asi que nunca puede prerenderizarse.
// Sin esto Next intenta hacerlo en el build y escupe 'Dynamic server usage'.
export const dynamic = 'force-dynamic';


/**
 * GET /api/inventory/movements
 * Query params:
 * - projectId: string (requerido)
 * - movementType: string (opcional)
 * - searchTerm: string (opcional)
 * - limit: number (opcional, default: 50)
 * - offset: number (opcional, default: 0)
 */
async function getInventoryMovementsHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId') || searchParams.get('project_id')
  const movementType = searchParams.get('movementType') || searchParams.get('movement_type') || null
  const searchTerm = searchParams.get('searchTerm') || searchParams.get('search_term') || null
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  if (!projectId) throw new ValidationError('projectId es requerido')
  if (limit < 1 || limit > 200) throw new ValidationError('limit debe estar entre 1 y 200')
  if (offset < 0) throw new ValidationError('offset debe ser mayor o igual a 0')

  console.log('🔷 [API] GET /api/inventory/movements', { projectId, movementType, searchTerm, limit, offset })

  const adapter = new InventoryAdapter()
  const movements = await adapter.getInventoryMovements(projectId || undefined, {
    limit,
    offset
  })

  return ApiResponse.paginated(
    movements,
    movements.length,
    Math.floor(offset / limit) + 1,
    limit
  )
}

/**
 * POST /api/inventory/movements
 * Body:
 * - projectId: string (requerido)
 * - inventoryId: string (requerido)
 * - movement_type: string (requerido)
 * - quantity: number (requerido)
 * - unit_cost: number (opcional)
 * - total_cost: number (opcional)
 * - reference_type: string (opcional)
 * - reference_id: string (opcional)
 * - notes: string (opcional)
 * - created_by: string (requerido)
 */
async function createMovementHandler(request: NextRequest) {
  const body = await request.json()
  const projectId = body.projectId
  const inventoryId = body.inventoryId
  const movement_type = body.movement_type
  const quantity = body.quantity
  const unit_cost = body.unit_cost
  const total_cost = body.total_cost
  const reference_type = body.reference_type
  const reference_id = body.reference_id
  const notes = body.notes
  const created_by = body.created_by

  if (!projectId) throw new ValidationError('projectId es requerido')
  if (!inventoryId) throw new ValidationError('inventoryId es requerido')
  if (!movement_type) throw new ValidationError('movement_type es requerido')
  if (typeof quantity !== 'number') throw new ValidationError('quantity es requerido y debe ser numérico')
  if (!created_by) throw new ValidationError('created_by es requerido')

  const adapter = new InventoryAdapter()
  
  // Mapeamos a adjustInventory ya que createMovement no existe en el nuevo adapter
  // y queremos mantener la lógica de actualización de stock
  const invId = parseInt(inventoryId, 10)
  let qChange = quantity
  if (movement_type === 'salida') {
    qChange = -Math.abs(quantity)
  } else if (movement_type === 'entrada') {
    qChange = Math.abs(quantity)
  }
  
  const result = await adapter.adjustInventory(
    invId,
    qChange,
    notes || `Movimiento manual: ${movement_type}`
  )

  return ApiResponse.success(result)
}

// ================================================
// EXPORTS CON MIDDLEWARE
// ================================================

export const GET = withErrorHandling(withAuth(withProjectValidation(getInventoryMovementsHandler)))

export const POST = withErrorHandling(withAuth(withProjectValidation(createMovementHandler)))
