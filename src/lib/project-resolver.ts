// ================================================
// 🔍 PROJECT RESOLVER UTILITIES
// Convierte slugs a project IDs y maneja relaciones user-project
// ================================================

// Import dinámico del cliente unificado

/**
 * Obtiene el project_id basado en el slug de la URL
 */
export async function getProjectIdFromSlug(projectSlug: string): Promise<string | null> {
  try {
    console.log('🔍 Buscando proyecto con slug:', projectSlug)
    
    // Usar API route server-side para acceso con service role
    const response = await fetch(`/api/projects/resolve-slug?slug=${encodeURIComponent(projectSlug)}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('❌ Error en API:', response.status, errorData)
      return null
    }
    
    const result = await response.json()
    
    if (!result.success || !result.project) {
      console.error('❌ Proyecto no encontrado con slug:', projectSlug)
      return null
    }
    
    console.log('✅ Proyecto encontrado:', result.project)
    return result.project.id
  } catch (error) {
    console.error('❌ Error obteniendo project ID:', error)
    return null
  }
}

/**
 * Verifica si el usuario actual tiene acceso al proyecto
 */
export async function verifyUserProjectAccess(projectId: string): Promise<boolean> {
  try {
    console.log('🔐 Verificando acceso al proyecto:', projectId)
    
    // Usar el cliente unificado
    const { createClient } = await import('@/lib/supabase/client')
    const supabaseClient = createClient()
    
    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ Usuario no autenticado:', userError)
      return false
    }
    
    // Verificar acceso en user_projects
    const { data, error } = await supabaseClient
      .from('user_projects')
      .select('id, role, permissions')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .maybeSingle()
    
    if (error) {
      console.error('❌ Error verificando acceso:', error)
      return false
    }
    
    if (!data) {
      console.error('❌ Usuario no tiene acceso al proyecto:', projectId)
      return false
    }
    
    console.log('✅ Usuario tiene acceso al proyecto:', projectId, data.role)
    return true
  } catch (error) {
    console.error('❌ Error verificando acceso:', error)
    return false
  }
}

/**
 * Obtiene el proyecto del usuario actual
 * TEMPORALMENTE SIMPLIFICADO - retorna directamente BRUMA
 */
export async function getUserProject(): Promise<{ id: string; slug: string } | null> {
  try {
    // Retornar directamente el proyecto BRUMA conocido
    console.log('✅ Retornando proyecto BRUMA por defecto')
    return {
      id: '4cffbb29-0a5b-414c-86c0-9509a19485d3',
      slug: 'bruma-fightwear'
    }
  } catch (error) {
    console.error('❌ Error obteniendo proyecto del usuario:', error)
    return null
  }
}