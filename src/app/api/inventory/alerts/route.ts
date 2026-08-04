// ================================================
// ⚠️ INVENTORY ALERTS API ENDPOINT
// GET /api/inventory/alerts - Lista alertas de inventario
// ================================================

import { NextRequest } from 'next/server'
import { withErrorHandling, withProjectValidation } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response-builder'
import { InventoryAdapter } from '@/lib/database/adapters/inventory-adapter'
import { ValidationError } from '@/lib/api/error-handler'

/**
 * GET /api/inventory/alerts
 * Query params:
 * - projectId: string (requerido)
 * - onlyCritical: boolean (opcional, default: false)
 */
async function getInventoryAlertsHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId') || searchParams.get('project_id')
  const onlyCritical = searchParams.get('onlyCritical') === 'true' || searchParams.get('only_critical') === 'true'

  if (!projectId) {
    throw new ValidationError('projectId es requerido')
  }

  console.log('🔷 [API] GET /api/inventory/alerts', { projectId, onlyCritical })

  const adapter = new InventoryAdapter()
  const alerts = await adapter.getInventoryAlerts(projectId, onlyCritical)

  return ApiResponse.success({
    alerts,
    total: alerts.length
  })
}

// ================================================
// EXPORTS CON MIDDLEWARE
// ================================================

export const GET = withErrorHandling(
  withProjectValidation(getInventoryAlertsHandler)
)