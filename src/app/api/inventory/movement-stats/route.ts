// ================================================
// 📈 INVENTORY MOVEMENT STATS API ENDPOINT
// GET /api/inventory/movement-stats - Estadísticas de movimientos
// ================================================

import { NextRequest } from 'next/server'
import { withErrorHandling, withProjectValidation } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response-builder'
import { InventoryAdapter } from '@/lib/database/adapters/inventory-adapter'
import { ValidationError } from '@/lib/api/error-handler'

/**
 * GET /api/inventory/movement-stats
 * Query params:
 * - projectId: string (requerido)
 */
async function getMovementStatsHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId') || searchParams.get('project_id')

  if (!projectId) throw new ValidationError('projectId es requerido')

  console.log('🔷 [API] GET /api/inventory/movement-stats', { projectId })

  const adapter = new InventoryAdapter()
  const stats = await adapter.getMovementStats(projectId)

  return ApiResponse.success(stats)
}

// ================================================
// EXPORTS CON MIDDLEWARE
// ================================================

export const GET = withErrorHandling(
  withProjectValidation(getMovementStatsHandler)
)
