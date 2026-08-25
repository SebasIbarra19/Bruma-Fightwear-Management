// ================================================
// 📊 INVENTORY STATS API ENDPOINT
// GET /api/inventory/stats - Estadísticas generales de inventario
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
 * GET /api/inventory/stats
 * Query params:
 * - projectId: string (requerido)
 */
async function getInventoryStatsHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId') || searchParams.get('project_id')

  if (!projectId) throw new ValidationError('projectId es requerido')

  console.log('🔷 [API] GET /api/inventory/stats', { projectId })

  const adapter = new InventoryAdapter()
  const stats = await adapter.getInventoryValuation(projectId)

  return ApiResponse.success(stats)
}

// ================================================
// EXPORTS CON MIDDLEWARE
// ================================================

export const GET = withErrorHandling(withAuth(withProjectValidation(getInventoryStatsHandler)))
