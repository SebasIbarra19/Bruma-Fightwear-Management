// ================================================
// 📄 INVENTORY REPORT API ENDPOINT
// GET /api/inventory/report - Reporte completo de inventario
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
 * GET /api/inventory/report
 * Query params:
 * - projectId: string (requerido)
 * - categoryId: string (opcional)
 * - lowStockOnly: boolean (opcional)
 * - includeMovements: boolean (opcional)
 */
async function getInventoryReportHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId') || searchParams.get('project_id')
  const catIdStr = searchParams.get('categoryId') || searchParams.get('category_id')
  const categoryId = catIdStr ? parseInt(catIdStr, 10) : null
  const lowStockOnly = searchParams.get('lowStockOnly') === 'true' || searchParams.get('low_stock_only') === 'true'
  const includeMovements = searchParams.get('includeMovements') !== 'false' // default true

  if (!projectId) throw new ValidationError('projectId es requerido')

  console.log('🔷 [API] GET /api/inventory/report', { projectId, categoryId, lowStockOnly, includeMovements })

  const adapter = new InventoryAdapter()
  const report = await adapter.generateInventoryReport(projectId, {
    categoryId: categoryId,
    lowStockOnly,
    includeMovements
  })

  return ApiResponse.success(report)
}

// ================================================
// EXPORTS CON MIDDLEWARE
// ================================================

export const GET = withErrorHandling(withAuth(withProjectValidation(getInventoryReportHandler)))
