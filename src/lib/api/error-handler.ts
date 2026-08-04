// ================================================
// 🚨 ERROR HANDLER
// Clases de error personalizadas y utilidades
// ================================================

/**
 * Error base para la aplicación
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Error de base de datos
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, details)
  }
}

/**
 * Error de validación
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details)
  }
}

/**
 * Error de autenticación
 */
export class AuthenticationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details)
  }
}

/**
 * Error de autorización
 */
export class AuthorizationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHORIZATION_ERROR', 403, details)
  }
}

/**
 * Error de recurso no encontrado
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND', 404, details)
  }
}

/**
 * Error de Stored Procedure
 */
export class StoredProcedureError extends DatabaseError {
  constructor(
    public procedureName: string,
    message: string,
    details?: any
  ) {
    super(`Stored Procedure '${procedureName}' failed: ${message}`, details)
    this.code = 'STORED_PROCEDURE_ERROR'
  }
}

/**
 * Determina el código de error basado en el status HTTP
 */
export function getErrorCode(statusCode: number): string {
  const codes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE'
  }
  return codes[statusCode] || 'UNKNOWN_ERROR'
}

/**
 * Extrae información útil de un error de Supabase
 */
export function parseSupabaseError(error: any): {
  message: string
  code: string
  details: any
} {
  return {
    message: error.message || 'Database error occurred',
    code: error.code || 'UNKNOWN_DB_ERROR',
    details: {
      hint: error.hint,
      details: error.details,
      ...(error.code && { dbCode: error.code })
    }
  }
}
