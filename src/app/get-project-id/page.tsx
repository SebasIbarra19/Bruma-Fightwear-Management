// ================================================
// 🔍 HELPER PARA OBTENER PROJECT ID REAL
// Script para encontrar el UUID del proyecto BRUMA
// ================================================

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function GetProjectIdPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Método 1: Consulta directa a la tabla projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (projectsError) {
        throw projectsError
      }
      
      console.log('📊 Proyectos encontrados:', projectsData)
      setProjects(projectsData || [])
      
      // También intentar con stored procedure si existe
      try {
        const { data: spData, error: spError } = await (supabase as any).rpc('get_user_projects')
        
        if (!spError && spData) {
          console.log('📊 Proyectos desde SP:', spData)
        }
      } catch (spErr) {
        console.log('ℹ️ SP get_user_projects no disponible:', spErr)
      }
      
    } catch (err: any) {
      console.error('❌ Error obteniendo proyectos:', err)
      setError(err.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const createBrumaProject = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: 'BRUMA Fightwear',
            slug: 'bruma-fightwear',
            description: 'Sistema de gestión para BRUMA Fightwear - Productos MMA',
            project_type: 'ecommerce',
            is_public: false,
            is_active: true
          }
        ])
        .select()
      
      if (error) {
        throw error
      }
      
      console.log('✅ Proyecto BRUMA creado:', data)
      fetchProjects() // Refrescar la lista
      
    } catch (err: any) {
      console.error('❌ Error creando proyecto:', err)
      setError(err.message || 'Error creando proyecto')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('UUID copiado al portapapeles!')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Encontrar Project ID
          </h1>
          <p className="text-gray-600">
            Busca el UUID del proyecto BRUMA Fightwear
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button 
            onClick={fetchProjects}
            disabled={loading}
          >
            {loading ? 'Buscando...' : '🔍 Buscar Proyectos'}
          </Button>
          
          <Button 
            onClick={createBrumaProject}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Creando...' : '➕ Crear Proyecto BRUMA'}
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">❌ Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {projects.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">📋 Proyectos Encontrados:</h2>
            
            {projects.map((project, index) => (
              <Card key={project.id} className={project.name.toLowerCase().includes('bruma') ? 'border-green-200 bg-green-50' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{project.name}</span>
                    {project.name.toLowerCase().includes('bruma') && (
                      <span className="text-green-600 text-sm">🎯 BRUMA PROJECT!</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <strong>UUID:</strong>
                      <code className="bg-gray-100 px-2 py-1 rounded cursor-pointer" 
                            onClick={() => copyToClipboard(project.id)}>
                        {project.id}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <strong>Slug:</strong>
                      <span>{project.slug}</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Tipo:</strong>
                      <span>{project.project_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <strong>Activo:</strong>
                      <span>{project.is_active ? '✅ Sí' : '❌ No'}</span>
                    </div>
                    
                    {project.name.toLowerCase().includes('bruma') && (
                      <div className="mt-4 p-3 bg-green-100 rounded">
                        <p className="text-green-800 font-medium">🎯 Este es tu proyecto BRUMA!</p>
                        <p className="text-green-700 text-sm mt-1">
                          Copia este UUID: <code className="font-mono bg-white px-1">{project.id}</code>
                        </p>
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={() => copyToClipboard(project.id)}
                        >
                          📋 Copiar UUID
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {projects.length === 0 && !loading && !error && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 mb-4">No se encontraron proyectos</p>
              <p className="text-sm text-gray-500">
                Haz clic en "Crear Proyecto BRUMA" para crear uno nuevo
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>📝 Instrucciones</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>1.</strong> Haz clic en "Buscar Proyectos" para ver todos los proyectos</p>
            <p><strong>2.</strong> Si ves un proyecto BRUMA, copia su UUID</p>
            <p><strong>3.</strong> Si no existe, haz clic en "Crear Proyecto BRUMA"</p>
            <p><strong>4.</strong> Usa el UUID copiado para actualizar el código</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}