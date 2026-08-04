// ================================================
// 📦 PRODUCT DETAILS API ENDPOINT
// GET /api/products/[productId] - Obtiene producto específico
// ================================================

import { NextRequest } from 'next/server'
import { withErrorHandling } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response-builder'
import { ProductsAdapter } from '@/lib/database/adapters/products-adapter'
import { ValidationError, NotFoundError } from '@/lib/api/error-handler'

/**
 * GET /api/products/[productId]
 * 
 * Path params:
 * - productId: string (requerido, viene de la ruta)
 */
async function getProductByIdHandler(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const productId = parseInt(params.productId, 10)

  // Validar parámetros
  if (isNaN(productId)) {
    throw new ValidationError('productId debe ser un número entero')
  }

  // Obtener producto con variantes usando el adapter
  const adapter = new ProductsAdapter()
  const product = await adapter.getProductById({
    productId
  })

  // Si no se encuentra el producto
  if (!product) {
    throw new NotFoundError('Producto no encontrado')
  }

  // Retornar respuesta
  return ApiResponse.success(product)
}

// ================================================
// EXPORTS CON MIDDLEWARE
// ================================================

// Wrapper para adaptar la firma con params de ruta
export async function GET(
  request: NextRequest,
  context: { params: { productId: string } }
) {
  return withErrorHandling(async (req: NextRequest) => {
    return getProductByIdHandler(req, context)
  })(request)
}
