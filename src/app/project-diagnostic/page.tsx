// ================================================
// 🔍 DIAGNÓSTICO COMPLETO DE PROYECTOS
// Página para verificar qué proyectos existen realmente
// ================================================

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProjectDiagnosticPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostic = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 1. Verificar usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error(`Error de autenticación: ${userError?.message || 'Usuario no encontrado'}`)
      }
      
      setCurrentUser(user)
      console.log('👤 Usuario actual:', user)
      
      // 2. Obtener TODOS los proyectos
      const { data: allProjects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (projectsError) {
        throw new Error(`Error obteniendo proyectos: ${projectsError.message}`)
      }
      
      setProjects(allProjects || [])
      console.log('📋 Todos los proyectos:', allProjects)
      
      // 3. Obtener proyectos del usuario actual
      const { data: userProjectsData, error: userProjectsError } = await supabase
        .from('user_projects')
        .select(`
          *,
          projects!inner (
            id,
            name,
            slug,
            project_type,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      if (userProjectsError) {
        console.warn('⚠️ Error obteniendo user_projects:', userProjectsError.message)
        setUserProjects([])
      } else {
        setUserProjects(userProjectsData || [])
        console.log('🔗 Proyectos del usuario:', userProjectsData)
      }
      
    } catch (err: any) {
      console.error('❌ Error en diagnóstico:', err)
      setError(err.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const createBrumaProjectWithRelation = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (!currentUser) {
        throw new Error('Usuario no autenticado')
      }
      
      // 1. Crear proyecto BRUMA
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([
          {
            name: 'BRUMA Fightwear',
            slug: 'bruma-fightwear',
            description: 'Sistema de gestión para BRUMA Fightwear - Productos MMA',
            project_type: 'ecommerce',
            is_active: true
          }
        ])
        .select()
        .single()
      
      if (projectError) {
        throw new Error(`Error creando proyecto: ${projectError.message}`)
      }
      
      console.log('✅ Proyecto BRUMA creado:', newProject)
      
      // 2. Crear relación user_projects
      const { data: userProjectRelation, error: relationError } = await supabase
        .from('user_projects')
        .insert([
          {
            user_id: currentUser.id,
            project_id: newProject.id,
            role: 'admin',
            permissions: {
              can_manage_products: true,
              can_manage_orders: true,
              can_manage_inventory: true,
              can_manage_suppliers: true,
              can_manage_customers: true,
              can_view_analytics: true
            },
            is_active: true
          }
        ])
        .select()
      
      if (relationError) {
        throw new Error(`Error creando relación usuario-proyecto: ${relationError.message}`)
      }
      
      console.log('✅ Relación usuario-proyecto creada:', userProjectRelation)
      
      // Actualizar listas
      await runDiagnostic()
      
    } catch (err: any) {
      console.error('❌ Error creando proyecto:', err)
      setError(err.message || 'Error creando proyecto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Diagnóstico de Proyectos
          </h1>
          <p className="text-gray-600">
            Verifica qué proyectos existen y sus relaciones con usuarios
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button 
            onClick={runDiagnostic}
            disabled={loading}
          >
            {loading ? 'Diagnosticando...' : '🔍 Ejecutar Diagnóstico'}
          </Button>
          
          <Button 
            onClick={createBrumaProjectWithRelation}
            disabled={loading || !currentUser}
            variant="outline"
          >
            {loading ? 'Creando...' : '➕ Crear Proyecto BRUMA + Relación'}
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">❌ Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {currentUser && (
          <Card>
            <CardHeader>
              <CardTitle>👤 Usuario Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>ID:</strong> {currentUser.id}</div>
                <div><strong>Email:</strong> {currentUser.email}</div>
                <div><strong>Última conexión:</strong> {new Date(currentUser.last_sign_in_at).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Todos los Proyectos ({projects.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-gray-600">Slug: <code>{project.slug}</code></p>
                        <p className="text-sm text-gray-600">ID: <code>{project.id}</code></p>
                        <p className="text-sm text-gray-600">Tipo: {project.project_type}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded ${project.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {project.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {userProjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>🔗 Proyectos del Usuario ({userProjects.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userProjects.map((userProject) => (
                  <div key={userProject.id} className="p-3 border rounded-lg bg-blue-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{userProject.projects.name}</h3>
                        <p className="text-sm text-gray-600">Slug: <code>{userProject.projects.slug}</code></p>
                        <p className="text-sm text-gray-600">Rol: <span className="font-medium">{userProject.role}</span></p>
                        <p className="text-sm text-gray-600">Permisos: {JSON.stringify(userProject.permissions)}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          Con Acceso
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>📝 URLs de Prueba</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.map((project) => (
              <div key={project.id} className="mb-2">
                <p className="text-sm">
                  <strong>{project.name}:</strong> 
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
                    /projects/{project.slug}/products
                  </code>
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}