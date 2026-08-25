// ================================================
// 🔧 INVENTORY ADJUST API ENDPOINT
// POST /api/inventory/adjust - Ajuste de inventario
// ================================================

import { NextRequest } from 'next/server'
import { withErrorHandling, withAuth } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response-builder'
import { InventoryAdapter } from '@/lib/database/adapters/inventory-adapter'
import { ValidationError } from '@/lib/api/error-handler'

// Autenticada: lee cookies de sesion, asi que nunca puede prerenderizarse.
// Sin esto Next intenta hacerlo en el build y escupe 'Dynamic server usage'.
export const dynamic = 'force-dynamic';


/**
 * POST /api/inventory/adjust
 * Body:
 * - variantId: string (requerido)
 * - quantityChange: number (requerido)
 * - unitCost: number (opcional)
 * - location: string (opcional)
 * - referenceId: string (opcional)
 * - referenceType: string (opcional)
 * - notes: string (opcional)
 * - reason: string (opcional)
 * - tipoMovimiento: string (opcional) - override explícito, ej. 'ajuste'
 */
async function adjustInventoryHandler(request: NextRequest) {
  const body = await request.json()
  const idVariante = body.idVariante ? parseInt(body.idVariante, 10) : null
  const reason = body.reason || body.motivo || 'ajuste manual'
  const tipoMovimiento = body.tipoMovimiento || body.tipo_movimiento || null
  const forzar = body.forzar === true

  const adapter = new InventoryAdapter()

  if (idVariante) {
    const quantityChange = parseInt(body.quantityChange ?? body.cantidad_cambio, 10)
    if (isNaN(quantityChange) || quantityChange <= 0) {
      throw new ValidationError('quantityChange debe ser un número positivo para un SKU sin stock previo')
    }
    const result = await adapter.createStockAndAdjust(idVariante, quantityChange, reason)
    return ApiResponse.success(result)
  }

  const inventoryId = parseInt(body.inventoryId || body.id_producto_talla, 10)
  const quantityChange = parseInt(body.quantityChange ?? body.cantidad_cambio, 10)

  if (isNaN(inventoryId)) throw new ValidationError('inventoryId es requerido y debe ser numérico')
  if (isNaN(quantityChange)) throw new ValidationError('quantityChange es requerido y debe ser numérico')

  const result = await adapter.adjustInventory(
    inventoryId,
    quantityChange,
    reason,
    tipoMovimiento,
    forzar
  )

  return ApiResponse.success(result)
}

// ================================================
// EXPORTS CON MIDDLEWARE
// ================================================

export const POST = withErrorHandling(withAuth(adjustInventoryHandler))
