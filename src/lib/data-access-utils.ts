// ================================================
// 🔧 UTILIDADES PARA DATA ACCESS
// Funciones helper para manejo de errores y transformaciones
// ================================================

import type { Database } from '@/types/database'

// ================================================
// 🔐 TIPOS PARA STORED PROCEDURES
// ================================================

// Como los SPs no están tipados en Database, usamos any con validación en runtime
export interface StoredProcedureResult<T = any> {
  data: T[] | null
  error: any
}

export interface StoredProcedureCountResult {
  count: number | null
  error: any
}

// ================================================
// 🔧 CLIENTE SUPABASE HELPER
// ================================================

let supabaseClient: any = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    // Usar el mismo cliente que AuthContext para consistencia
    const { createClient } = require('@/lib/supabase/client')
    supabaseClient = createClient()
  }
  return supabaseClient
}

// ================================================
// 🔐 HELPERS DE AUTENTICACIÓN
// ================================================

export async function ensureAuthenticated(): Promise<string> {
  try {
    console.log('🔐 Verificando autenticación...')
    
    const client = getSupabaseClient()
    
    // Intentar obtener la sesión actual
    const { data: { session }, error: sessionError } = await client.auth.getSession()
    
    if (sessionError) {
      console.warn('⚠️ Error obteniendo sesión:', sessionError.message)
    }
    
    // Si hay sesión, usar el usuario de la sesión
    if (session?.user) {
      console.log('✅ Usuario autenticado desde sesión:', session.user.id)
      return session.user.id
    }
    
    // Si no hay sesión, intentar obtener usuario actual
    const { data: { user }, error: userError } = await client.auth.getUser()
    
    if (userError) {
      console.warn('⚠️ Error obteniendo usuario:', userError.message)
    }
    
    if (user) {
      console.log('✅ Usuario autenticado desde getUser:', user.id)
      return user.id
    }
    
    // Si llegamos aquí, no hay usuario autenticado
    throw new Error('No hay usuario autenticado')
    
  } catch (error) {
    console.error('❌ Error en ensureAuthenticated:', error)
    throw new Error(`Error de autenticación: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

// ================================================
// 🚨 MANEJO DE ERRORES
// ================================================

export function handleDatabaseError(error: any, operation: string): never {
  console.error(`❌ Error en ${operation}:`, error)
  
  // Errores específicos de PostgreSQL
  if (error.code) {
    switch (error.code) {
      case '23505': // unique_violation
        throw new Error('Ya existe un registro con esos datos únicos')
      case '23503': // foreign_key_violation
        throw new Error('Referencia a datos que no existen')
      case '23502': // not_null_violation
        throw new Error('Faltan datos requeridos')
      case '42501': // insufficient_privilege
        throw new Error('No tienes permisos para realizar esta operación')
      case 'PGRST301': // RPC function not found
        throw new Error('Función de base de datos no encontrada')
      default:
        throw new Error(`Error de base de datos: ${error.message}`)
    }
  }
  
  // Errores de Supabase
  if (error.message) {
    // Errores comunes de autenticación
    if (error.message.includes('JWT')) {
      throw new Error('Sesión expirada, por favor inicia sesión nuevamente')
    }
    
    if (error.message.includes('not authenticated')) {
      throw new Error('Usuario no autenticado')
    }
    
    if (error.message.includes('permission denied')) {
      throw new Error('No tienes permisos para realizar esta operación')
    }
    
    throw new Error(error.message)
  }
  
  throw new Error(`Error desconocido en ${operation}`)
}

// ================================================
// 🔄 EJECUTOR DE STORED PROCEDURES
// ================================================

export async function executeStoredProcedure<T = any>(
  procedureName: string,
  params: Record<string, any> = {},
  operation: string = procedureName
): Promise<T[]> {
  try {
    console.log(`🔍 Ejecutando SP: ${procedureName}`, params)
    
    // Verificar autenticación
    const userId = await ensureAuthenticated()
    console.log(`✅ Usuario autenticado: ${userId}`)
    
    // Usar el cliente estándar
    const client = getSupabaseClient()
    
    // Ejecutar stored procedure
    console.log(`📡 Llamando RPC: ${procedureName}`)
    const { data, error } = await (client as any).rpc(procedureName, params)
    
    if (error) {
      console.error(`❌ Error en SP ${procedureName}:`, error)
      handleDatabaseError(error, operation)
    }
    
    console.log(`✅ SP ${procedureName} exitoso:`, data?.length || 0, 'registros')
    return data || []
  } catch (error) {
    console.error(`💥 Error ejecutando SP ${procedureName}:`, error)
    handleDatabaseError(error, operation)
  }
}

export async function executeStoredProcedureWithCount<T = any>(
  procedureName: string,
  countProcedureName: string,
  params: Record<string, any> = {},
  countParams: Record<string, any> = {},
  operation: string = procedureName
): Promise<{ data: T[]; count: number }> {
  try {
    await ensureAuthenticated()
    
    const client = getSupabaseClient()
    
    // Ejecutar la consulta principal
    const { data, error } = await (client as any).rpc(procedureName, params)
    
    if (error) {
      handleDatabaseError(error, operation)
    }
    
    // Ejecutar la consulta de conteo
    const { data: countData, error: countError } = await (client as any).rpc(countProcedureName, countParams)
    
    if (countError) {
      console.warn(`⚠️ Error en conteo para ${operation}:`, countError)
    }
    
    return {
      data: data || [],
      count: countData || 0
    }
  } catch (error) {
    handleDatabaseError(error, operation)
  }
}

// ================================================
// 🔄 HELPERS DE PAGINACIÓN
// ================================================

export function calculatePagination(page: number = 1, limit: number = 20) {
  const offset = Math.max(0, (page - 1) * limit)
  const totalPages = (total: number) => Math.ceil(total / limit)
  
  return {
    limit,
    offset,
    page,
    totalPages
  }
}

// ================================================
// 🧼 HELPERS DE VALIDACIÓN Y LIMPIEZA
// ================================================

export function validateUUID(id: string, fieldName: string = 'ID'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  
  if (!id || !uuidRegex.test(id)) {
    throw new Error(`${fieldName} debe ser un UUID válido`)
  }
}

export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(`${fieldName} es requerido`)
  }
}

export function cleanString(str: string | null | undefined): string | null {
  if (!str || typeof str !== 'string') return null
  return str.trim() || null
}

export function cleanNumber(num: number | null | undefined): number | null {
  if (num === null || num === undefined || isNaN(num)) return null
  return num
}

// ================================================
// 📊 HELPERS DE TRANSFORMACIÓN
// ================================================

export function transformDatabaseRecord<T>(record: any): T {
  if (!record) return record
  
  // Convertir fechas string a Date objects si es necesario
  const dateFields = ['created_at', 'updated_at', 'assigned_at', 'shipped_at', 'delivered_at', 'last_updated']
  
  const transformed = { ...record }
  
  dateFields.forEach(field => {
    if (transformed[field] && typeof transformed[field] === 'string') {
      try {
        transformed[field] = new Date(transformed[field]).toISOString()
      } catch (e) {
        // Si no se puede convertir, mantener el valor original
      }
    }
  })
  
  // Convertir JSONB arrays vacíos a arrays vacíos
  Object.keys(transformed).forEach(key => {
    if (transformed[key] === null && (key.includes('tags') || key.includes('materials'))) {
      transformed[key] = []
    }
  })
  
  return transformed as T
}

// ================================================
// 🔍 HELPERS DE BÚSQUEDA Y FILTROS
// ================================================

export function buildSearchQuery(search: string | null | undefined): string | null {
  if (!search || typeof search !== 'string') return null
  
  // Limpiar y preparar para búsqueda full-text
  const cleaned = search.trim().toLowerCase()
  if (cleaned.length < 2) return null
  
  return `%${cleaned}%`
}

export function buildDateRange(startDate?: string, endDate?: string) {
  const start = startDate ? new Date(startDate).toISOString() : null
  const end = endDate ? new Date(endDate).toISOString() : null
  
  return { start, end }
}

// ================================================
// 📝 LOGGER HELPER
// ================================================

export function logDataAccessOperation(operation: string, params: any, success: boolean, error?: any) {
  const timestamp = new Date().toISOString()
  const logLevel = success ? 'INFO' : 'ERROR'
  
  console.log(`[${timestamp}] ${logLevel} - DataAccess.${operation}`, {
    params,
    success,
    error: error?.message || null
  })
}