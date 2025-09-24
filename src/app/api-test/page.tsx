'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

function APITestContent() {
  const { user } = useAuth()
  const [inventoryData, setInventoryData] = useState<any>(null)
  const [suppliersData, setSuppliersData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [projectId, setProjectId] = useState('')

  const testInventoryAPI = async () => {
    if (!projectId.trim()) {
      alert('Por favor ingresa un Project ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/inventory?projectId=${encodeURIComponent(projectId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error en la API')
      }

      setInventoryData(data)
      console.log('Datos de inventario:', data)
    } catch (error) {
      console.error('Error:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const testSuppliersAPI = async () => {
    if (!projectId.trim()) {
      alert('Por favor ingresa un Project ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/suppliers?projectId=${encodeURIComponent(projectId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error en la API')
      }

      setSuppliersData(data)
      console.log('Datos de proveedores:', data)
    } catch (error) {
      console.error('Error:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const createTestInventoryItem = async () => {
    if (!projectId.trim()) {
      alert('Por favor ingresa un Project ID')
      return
    }

    const testItem = {
      projectId,
      sku: `TEST-${Date.now()}`,
      product_name: 'Producto de Prueba',
      product_description: 'Este es un item de prueba creado desde la API',
      quantity_available: 100,
      quantity_reserved: 0,
      quantity_on_order: 50,
      reorder_level: 20,
      reorder_quantity: 100,
      unit_cost: 25.99,
      last_cost: 25.99,
      average_cost: 25.99,
      location: 'Almacén A'
    }

    setLoading(true)
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testItem)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error creando item')
      }

      alert('Item de inventario creado exitosamente')
      console.log('Nuevo item:', data)
      
      // Refrescar datos
      await testInventoryAPI()
    } catch (error) {
      console.error('Error:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const createTestSupplier = async () => {
    if (!projectId.trim()) {
      alert('Por favor ingresa un Project ID')
      return
    }

    const testSupplier = {
      projectId,
      name: `Proveedor Test ${Date.now()}`,
      contact_person: 'Juan Pérez',
      email: `test${Date.now()}@ejemplo.com`,
      phone: '+1-555-0123',
      address: 'Calle Falsa 123',
      city: 'Ciudad Ejemplo',
      state: 'Estado',
      country: 'País',
      postal_code: '12345',
      tax_id: 'TAX-123456',
      payment_terms: '30 días',
      notes: 'Proveedor de prueba creado desde API',
      is_active: true
    }

    setLoading(true)
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testSupplier)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error creando proveedor')
      }

      alert('Proveedor creado exitosamente')
      console.log('Nuevo proveedor:', data)
      
      // Refrescar datos
      await testSuppliersAPI()
    } catch (error) {
      console.error('Error:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pruebas de API - Fase 2</h1>
              <p className="text-gray-600">
                Usa esta página para probar las APIs de inventario y proveedores
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Usuario logueado:</p>
              <p className="text-sm font-medium text-gray-700">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Project ID Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
            <CardDescription>Ingresa el ID del proyecto para las pruebas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                  Project ID
                </label>
                <input
                  type="text"
                  id="projectId"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="ej: 123e4567-e89b-12d3-a456-426614174000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Inventario */}
          <Card>
            <CardHeader>
              <CardTitle>API de Inventario</CardTitle>
              <CardDescription>Prueba las operaciones de inventario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={testInventoryAPI} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Cargando...' : 'Obtener Inventario'}
                </Button>
                
                <Button 
                  onClick={createTestInventoryItem} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  Crear Item de Prueba
                </Button>
              </div>

              {inventoryData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-64 overflow-auto">
                  <h4 className="font-semibold mb-2">Resultado:</h4>
                  <pre className="text-xs text-gray-600">
                    {JSON.stringify(inventoryData, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proveedores */}
          <Card>
            <CardHeader>
              <CardTitle>API de Proveedores</CardTitle>
              <CardDescription>Prueba las operaciones de proveedores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={testSuppliersAPI} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Cargando...' : 'Obtener Proveedores'}
                </Button>
                
                <Button 
                  onClick={createTestSupplier} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  Crear Proveedor de Prueba
                </Button>
              </div>

              {suppliersData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-64 overflow-auto">
                  <h4 className="font-semibold mb-2">Resultado:</h4>
                  <pre className="text-xs text-gray-600">
                    {JSON.stringify(suppliersData, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instrucciones */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instrucciones de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Ingresa un Project ID válido (puedes obtenerlo desde el dashboard)</li>
              <li>Haz clic en "Obtener Inventario" o "Obtener Proveedores" para probar la lectura</li>
              <li>Usa los botones "Crear... de Prueba" para probar la creación de registros</li>
              <li>Revisa la consola del navegador para más detalles</li>
              <li>Los resultados se mostrarán en las cajas de texto de abajo</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function APITestPage() {
  return (
    <ProtectedRoute>
      <APITestContent />
    </ProtectedRoute>
  )
}