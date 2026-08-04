// ================================================
// 🔧 INVENTORY ADJUST API ENDPOINT
// POST /api/inventory/adjust - Ajuste de inventario
// ================================================

import { NextRequest } from 'next/server'
import { withErrorHandling, withProjectValidation } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response-builder'
import { InventoryAdapter } from '@/lib/database/adapters/inventory-adapter'
import { ValidationError } from '@/lib/api/error-handler'

/**
 * POST /api/inventory/adjust
 * Body:
 * - projectId: string (requerido)
 * - variantId: string (requerido)
 * - quantityChange: number (requerido)
 * - unitCost: number (opcional)
 * - location: string (opcional)
 * - referenceId: string (opcional)
 * - referenceType: string (opcional)
 * - notes: string (opcional)
 * - reason: string (opcional)
 */
async function adjustInventoryHandler(request: NextRequest) {
  const body = await request.json()
  const inventoryId = parseInt(body.inventoryId || body.id_producto_talla, 10)
  const quantityChange = parseInt(body.quantityChange || body.cantidad_cambio, 10)
  const reason = body.reason || body.motivo || 'ajuste manual'

  if (isNaN(inventoryId)) throw new ValidationError('inventoryId es requerido y debe ser numérico')
  if (isNaN(quantityChange)) throw new ValidationError('quantityChange es requerido y debe ser numérico')

  console.log('🔷 [API] POST /api/inventory/adjust', { inventoryId, quantityChange, reason })

  const adapter = new InventoryAdapter()
  const result = await adapter.adjustInventory(
    inventoryId,
    quantityChange,
    reason
  )

  return ApiResponse.success(result)
}

// ================================================
// EXPORTS CON MIDDLEWARE
// ================================================

export const POST = withErrorHandling(
  withProjectValidation(adjustInventoryHandler)
)
