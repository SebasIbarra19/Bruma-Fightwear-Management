import { NextRequest } from 'next/server'
import { withErrorHandling, withAuth } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response-builder'
import { ValidationError } from '@/lib/api/error-handler'
import {
  ActividadAdapter,
  type CategoriaActividad,
} from '@/lib/database/adapters/actividad-adapter'

// Autenticada: lee cookies de sesión, así que nunca puede prerenderizarse.
export const dynamic = 'force-dynamic'

const CATEGORIAS: CategoriaActividad[] = ['datos', 'sesion', 'accion']

async function getActividadHandler(request: NextRequest) {
  const sp = request.nextUrl.searchParams

  const categoriaRaw = sp.get('categoria')
  if (categoriaRaw && !CATEGORIAS.includes(categoriaRaw as CategoriaActividad)) {
    throw new ValidationError(`categoria debe ser una de: ${CATEGORIAS.join(', ')}`)
  }

  const limit = parseInt(sp.get('limit') || '50', 10)
  const offset = parseInt(sp.get('offset') || '0', 10)
  if (isNaN(limit) || limit < 1 || limit > 200) {
    throw new ValidationError('limit debe estar entre 1 y 200')
  }
  if (isNaN(offset) || offset < 0) {
    throw new ValidationError('offset debe ser mayor o igual a 0')
  }

  const rows = await new ActividadAdapter().list(
    (categoriaRaw as CategoriaActividad) || null,
    limit,
    offset
  )

  return ApiResponse.success(rows)
}

export const GET = withErrorHandling(withAuth(getActividadHandler))
