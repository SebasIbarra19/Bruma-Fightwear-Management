// ================================================
// 🧪 PÁGINA DE TESTING DATA ACCESS
// Componente para probar la conexión con la BD
// ================================================

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { dataAccess } from '@/lib/unified-data-access'
import { runFullDataAccessTest, testConnection } from '@/lib/data-access-test'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DataTestPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [testResults, setTestResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (user && !authLoading) {
      quickConnectionTest()
    }
  }, [user, authLoading])

  const quickConnectionTest = async () => {
    setConnectionStatus('testing')
    try {
      const result = await testConnection()
      setConnectionStatus(result.success ? 'success' : 'error')
      setTestResults(result)
    } catch (error) {
      setConnectionStatus('error')
      setTestResults({ success: false, error: (error as Error).message })
    }
  }

  const runFullTest = async () => {
    setIsRunning(true)
    try {
      const result = await runFullDataAccessTest()
      setTestResults(result)
    } catch (error) {
      setTestResults({ success: false, error: (error as Error).message })
    } finally {
      setIsRunning(false)
    }
  }

  const testSpecificProject = async () => {
    setIsRunning(true)
    try {
      // 🎯 Obtener proyecto dinámicamente del usuario actual
      const { getUserProject } = await import('@/lib/project-resolver')
      const userProject = await getUserProject()
      
      if (!userProject) {
        throw new Error('No se encontró ningún proyecto para el usuario actual')
      }
      
      console.log('✅ Usando proyecto:', userProject)
      const result = await dataAccess.getProducts({ project_id: userProject.id })
      setTestResults(result)
    } catch (error) {
      setTestResults({ success: false, error: (error as Error).message })
    } finally {
      setIsRunning(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Debes iniciar sesión para probar la conexión</p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Iniciar Sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Data Access Layer Test
          </h1>
          <p className="text-gray-600">
            Prueba la conexión con Supabase y los stored procedures
          </p>
        </div>

        {/* Estado de Conexión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {connectionStatus === 'testing' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
              {connectionStatus === 'success' && <span className="text-green-600">✅</span>}
              {connectionStatus === 'error' && <span className="text-red-600">❌</span>}
              {connectionStatus === 'idle' && <span className="text-gray-600">⏳</span>}
              Estado de Conexión
            </CardTitle>
            <CardDescription>
              Conexión con Supabase y autenticación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Usuario:</strong> {user.email}</p>
              <p><strong>Estado:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  connectionStatus === 'success' ? 'bg-green-100 text-green-800' :
                  connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
                  connectionStatus === 'testing' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {connectionStatus === 'success' ? 'Conectado' :
                   connectionStatus === 'error' ? 'Error' :
                   connectionStatus === 'testing' ? 'Probando...' :
                   'Esperando'}
                </span>
              </p>
              <Button 
                onClick={quickConnectionTest}
                disabled={connectionStatus === 'testing'}
                variant="outline"
                size="sm"
              >
                Probar Conexión
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Test */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={runFullTest}
            disabled={isRunning}
            className="h-20"
          >
            {isRunning ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Ejecutando...
              </div>
            ) : (
              <div className="text-center">
                <div>🚀 Test Completo</div>
                <div className="text-xs opacity-75">Todos los stored procedures</div>
              </div>
            )}
          </Button>

          <Button 
            onClick={testSpecificProject}
            disabled={isRunning}
            variant="outline"
            className="h-20"
          >
            <div className="text-center">
              <div>🎯 Test Productos</div>
              <div className="text-xs opacity-75">Solo productos del proyecto</div>
            </div>
          </Button>

          <Button 
            onClick={() => window.location.href = '/projects/bruma-fightwear/products'}
            variant="outline"
            className="h-20"
          >
            <div className="text-center">
              <div>🏢 Ver Productos</div>
              <div className="text-xs opacity-75">Ir a la página real</div>
            </div>
          </Button>
        </div>

        {/* Resultados */}
        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResults.success ? (
                  <span className="text-green-600">✅ Test Exitoso</span>
                ) : (
                  <span className="text-red-600">❌ Test Falló</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle>📝 Instrucciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>1. Test de Conexión:</strong> Verifica que puedas conectarte a Supabase</p>
              <p><strong>2. Test Completo:</strong> Prueba todos los stored procedures disponibles</p>
              <p><strong>3. Test Productos:</strong> Prueba específicamente la carga de productos</p>
              <p><strong>4. Ver Productos:</strong> Ve a la página real para ver los datos en la interfaz</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}