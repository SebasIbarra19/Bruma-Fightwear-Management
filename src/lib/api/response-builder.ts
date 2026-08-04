// ================================================
// 📦 API RESPONSE BUILDER
// Constructor estandarizado de respuestas API
// ================================================

import { getErrorCode } from './error-handler'

/**
 * Metadata para respuestas paginadas
 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Estructura estándar de respuesta exitosa
 */
export interface SuccessResponse<T = any> {
  success: true
  data: T
  meta?: any
  timestamp: string
}

/**
 * Estructura estándar de respuesta de error
 */
export interface ErrorResponse {
  success: false
  error: {
    message: string
    code: string
    details?: any
  }
  timestamp: string
}

/**
 * Constructor de respuestas API estandarizadas
 */
export class ApiResponse {
  /**
   * Construye una respuesta exitosa
   */
  static success<T = any>(data: T, meta?: any): Response {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      ...(meta && { meta }),
      timestamp: new Date().toISOString()
    }

    return Response.json(response)
  }

  /**
   * Construye una respuesta de error
   */
  static error(
    message: string,
    details?: any,
    statusCode: number = 500
  ): Response {
    const response: ErrorResponse = {
      success: false,
      error: {
        message,
        code: getErrorCode(statusCode),
        ...(details && { details })
      },
      timestamp: new Date().toISOString()
    }

    return Response.json(response, { status: statusCode })
  }

  /**
   * Construye una respuesta paginada
   */
  static paginated<T = any>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): Response {
    const totalPages = Math.ceil(total / limit)
    
    const meta: PaginationMeta = {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    return ApiResponse.success(data, meta)
  }

  /**
   * Construye una respuesta de validación fallida
   */
  static validationError(message: string, errors?: any): Response {
    return ApiResponse.error(message, errors, 400)
  }

  /**
   * Construye una respuesta de no autorizado
   */
  static unauthorized(message: string = 'Unauthorized'): Response {
    return ApiResponse.error(message, null, 401)
  }

  /**
   * Construye una respuesta de no encontrado
   */
  static notFound(message: string = 'Resource not found'): Response {
    return ApiResponse.error(message, null, 404)
  }

  /**
   * Construye una respuesta de conflicto
   */
  static conflict(message: string, details?: any): Response {
    return ApiResponse.error(message, details, 409)
  }
}
