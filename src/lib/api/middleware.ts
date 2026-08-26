// ================================================
// 🔧 API MIDDLEWARE
// Funciones middleware reutilizables
// ================================================

import { cache } from 'react'
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
 * Exige sesión válida para ejecutar el handler.
 *
 * ¿Por qué acá si el middleware ya redirige? Porque el middleware de Next se pudo
 * saltear entero con el header `x-middleware-subrequest` (CVE-2025-29927). La
 * defensa no puede depender de una sola capa: `src/middleware.ts` resuelve la
 * experiencia (redirigir a login) y esto resuelve la autorización.
 *
 * Usa `getUser()`, que valida el token contra el servidor de Auth, y no
 * `getSession()`, que solo decodifica la cookie.
 *
 * Lanza `AuthenticationError` en vez de devolver una respuesta: `withErrorHandling`
 * ya lo mapea a 401, así que el formato de error queda consistente con el resto.
 * Componer siempre con él por fuera:
 *
 *     export const GET = withErrorHandling(withAuth(handler))
 */
/**
 * Usuario de la sesión actual, o `null`.
 *
 * Envuelto en `cache()` de React, que memoiza **por request** en el App Router.
 * Eso es lo que permite que `withAuth` valide y que además el handler pida el
 * usuario para registrarlo en la bitácora, sin pagar dos veces el viaje al
 * servidor de Auth: la segunda llamada devuelve el resultado ya resuelto.
 *
 * Se expone en vez de pasar el usuario como argumento porque las 24 rutas ya
 * están escritas contra las firmas actuales —unas reciben `params`, otras no—,
 * y cambiar la forma de composición obligaría a tocarlas todas para que solo
 * dos lo aprovechen.
 */
export const getSessionUser = cache(async () => {
  const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
  const { cookies } = await import('next/headers')

  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  return error ? null : user
})

export function withAuth<T extends Handler | HandlerWithParams<any>>(handler: T): T {
  return (async (request: NextRequest, params?: any) => {
    const user = await getSessionUser()
    if (!user) throw new AuthenticationError('No autenticado')
    return (handler as any)(request, params)
  }) as unknown as T
}

/**
 * Variante para las rutas que no usan `withErrorHandling` y traen su propio
 * try/catch (el de ellas devuelve 500, así que lanzar acá daría el código
 * equivocado). Se llama al inicio del handler:
 *
 *     const denied = await requireAuth();
 *     if (denied) return denied;
 */
export async function requireAuth(): Promise<Response | null> {
  const user = await getSessionUser()
  return user ? null : ApiResponse.unauthorized('No autenticado')
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
