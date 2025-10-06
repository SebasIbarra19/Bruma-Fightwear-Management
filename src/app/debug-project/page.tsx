// ================================================
// 🔍 TEST DIRECTO - DEBUGGING PROJECT QUERY
// Para ver exactamente qué está pasando con la BD
// ================================================

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProjectDebugPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDirectQuery = async () => {
    setLoading(true)
    try {
      // Importar el cliente regular
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      console.log('🔍 Testing direct project query...')
      
      // 1. Ver TODOS los proyectos con cliente regular (con RLS)
      console.log('1. Obteniendo TODOS los proyectos (con RLS)...')
      const { data: allProjects, error: allError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      // 2. Ver TODOS los proyectos con service client (sin RLS)
      console.log('2. Obteniendo TODOS los proyectos (sin RLS)...')
      const { supabaseService } = await import('@/lib/supabase/service')
      const { data: allProjectsService, error: allErrorService } = await supabaseService
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('All projects (RLS):', allProjects)
      console.log('All projects error (RLS):', allError)
      console.log('All projects (Service):', allProjectsService)
      console.log('All projects error (Service):', allErrorService)
      
      // 3. Buscar específicamente bruma-fightwear con service client
      console.log('3. Buscando bruma-fightwear específicamente (Service)...')
      const { data: brumaProject, error: brumaError } = await supabaseService
        .from('projects')
        .select('*')
        .eq('slug', 'bruma-fightwear')
        .maybeSingle()
      
      console.log('Bruma project (Service):', brumaProject)
      console.log('Bruma error (Service):', brumaError)
      
      // 3. Buscar con LIKE por si hay variaciones
      console.log('3. Buscando con LIKE bruma...')
      const { data: likeProjects, error: likeError } = await supabase
        .from('projects')
        .select('*')
        .ilike('slug', '%bruma%')
      
      console.log('Like projects:', likeProjects)
      console.log('Like error:', likeError)
      
      // 4. Verificar user actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('Current user:', user)
      console.log('User error:', userError)
      
      setResults({
        allProjects,
        allError,
        allProjectsService,
        allErrorService,
        brumaProject,
        brumaError,
        likeProjects,
        likeError,
        user,
        userError
      })
      
    } catch (error) {
      console.error('❌ Error en test directo:', error)
      setResults({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Debug Project Query
          </h1>
          <p className="text-gray-600">
            Test directo para ver qué pasa con la consulta de proyectos
          </p>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={testDirectQuery}
            disabled={loading}
          >
            {loading ? 'Testing...' : '🔍 Test Direct Query'}
          </Button>
        </div>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>📊 Resultados del Test</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>📝 Instrucciones</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>1.</strong> Haz clic en "Test Direct Query"</p>
            <p><strong>2.</strong> Revisa la consola (F12) para logs detallados</p>
            <p><strong>3.</strong> Copia y pega los resultados aquí</p>
            <p><strong>4.</strong> Veremos exactamente qué está en la BD</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}