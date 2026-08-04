// ================================================
// 📘 API TYPES
// Tipos compartidos para APIs
// ================================================

/**
 * Parámetros comunes de paginación
 */
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

/**
 * Parámetros comunes de filtrado
 */
export interface FilterParams {
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Resultado de operación con conteo
 */
export interface CountedResult<T> {
  data: T[]
  count: number
}

/**
 * Opciones para métodos de adaptadores
 */
export interface AdapterOptions {
  useStoredProcedure?: boolean
  fallbackToQuery?: boolean
  throwOnError?: boolean
}

/**
 * Resultado de método de adaptador con metadata
 */
export interface AdapterResult<T> {
  data: T
  source: 'stored-procedure' | 'query'
  duration: number
}
