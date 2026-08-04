// ================================================
// 🔧 API MIDDLEWARE
// Funciones middleware reutilizables
// ================================================

import { NextRequest } from 'next/server'
import { ApiResponse } from './response-builder'
import { 
  AppError, 
  DatabaseError, 
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError
} from './error-handler'

/**
 * Tipo para handlers con parámetros extraídos
 */
type HandlerWithParams<T = any> = (
  request: NextRequest,
  params: T
) => Promise<Response>

/**
 * Tipo para handlers simples
 */
type Handler = (request: NextRequest) => Promise<Response>

/**
 * Middleware para validar que projectId esté presente
 */
export function withProjectValidation(
  handler: HandlerWithParams<{ projectId: string }>
): Handler {
  return async (request: NextRequest) => {
    // Aceptar tanto projectId (camelCase) como project_id (snake_case)
    const projectId = request.nextUrl.searchParams.get('projectId') || request.nextUrl.searchParams.get('project_id')

    if (!projectId) {
      return ApiResponse.validationError('projectId parameter is required')
    }

    return handler(request, { projectId })
  }
}

/**
 * Middleware para manejo centralizado de errores
 */
export function withErrorHandling(handler: Handler): Handler {
  return async (request: NextRequest) => {
    try {
      return await handler(request)
    } catch (error) {
      console.error('❌ API Error:', error)

      // Manejo específico por tipo de error
      if (error instanceof ValidationError) {
        return ApiResponse.validationError(error.message, error.details)
      }

      if (error instanceof AuthenticationError) {
        return ApiResponse.unauthorized(error.message)
      }

      if (error instanceof AuthorizationError) {
        return ApiResponse.error(error.message, error.details, 403)
      }

      if (error instanceof NotFoundError) {
        return ApiResponse.notFound(error.message)
      }

      if (error instanceof DatabaseError) {
        return ApiResponse.error(
          'Database error occurred',
          {
            message: error.message,
            code: error.code,
            ...(error.details && { details: error.details })
          },
          500
        )
      }

      if (error instanceof AppError) {
        return ApiResponse.error(
          error.message,
          error.details,
          error.statusCode
        )
      }

      // Error desconocido
      return ApiResponse.error(
        'Internal server error',
        process.env.NODE_ENV === 'development' 
          ? { message: error instanceof Error ? error.message : 'Unknown error' }
          : undefined,
        500
      )
    }
  }
}

/**
 * Combina múltiples middlewares
 */
export function compose(...middlewares: Array<(handler: Handler) => Handler>) {
  return (handler: Handler): Handler => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

/**
 * Middleware para logging de requests
 */
export function withLogging(handler: Handler): Handler {
  return async (request: NextRequest) => {
    const startTime = Date.now()
    const { method, url } = request

    console.log(`📥 ${method} ${url}`)

    const response = await handler(request)
    
    const duration = Date.now() - startTime
    console.log(`📤 ${method} ${url} - ${response.status} (${duration}ms)`)

    return response
  }
}

/**
 * Middleware para validar parámetros requeridos
 */
export function withRequiredParams(params: string[]) {
  return (handler: Handler): Handler => {
    return async (request: NextRequest) => {
      const searchParams = request.nextUrl.searchParams
      const missing: string[] = []

      for (const param of params) {
        if (!searchParams.has(param)) {
          missing.push(param)
        }
      }

      if (missing.length > 0) {
        return ApiResponse.validationError(
          'Missing required parameters',
          { missing }
        )
      }

      return handler(request)
    }
  }
}
