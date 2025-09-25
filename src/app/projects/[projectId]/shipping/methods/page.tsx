'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

// Interfaces para Shipping Methods
interface ShippingMethod {
  id: string
  project_id: string
  name: string
  description: string
  type: 'correos_cr' | 'pickup' | 'custom'
  is_active: boolean
  base_cost: number
  currency: string
  estimated_days_min: number
  estimated_days_max: number
  requires_address: boolean
  requires_special_code: boolean
  special_code_label?: string
  instructions?: string
  created_at: string
  updated_at: string
}

interface Project {
  project_id: string
  name: string
  slug: string
}

export default function ShippingMethodsPage({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const projectSlug = params.projectId

  // Estados
  const [project, setProject] = useState<Project | null>(null)
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [methodsLoading, setMethodsLoading] = useState(true)

  // Estados de filtros
  const [methodSearch, setMethodSearch] = useState('')
  const [methodStatus, setMethodStatus] = useState<string>('all')
  const [methodType, setMethodType] = useState<string>('all')

  // Estados para nuevo método
  const [showNewMethodForm, setShowNewMethodForm] = useState(false)
  const [newMethod, setNewMethod] = useState<Partial<ShippingMethod>>({
    name: '',
    description: '',
    type: 'pickup',
    is_active: true,
    base_cost: 0,
    currency: 'COP',
    estimated_days_min: 1,
    estimated_days_max: 3,
    requires_address: true,
    requires_special_code: false,
    special_code_label: '',
    instructions: ''
  })

  // Datos mock del proyecto
  useEffect(() => {
    const mockProject: Project = {
      project_id: projectSlug,
      name: 'BRUMA Fightwear',
      slug: projectSlug
    }
    setProject(mockProject)
  }, [projectSlug])

  // Datos mock de métodos de envío
  useEffect(() => {
    const mockShippingMethods: ShippingMethod[] = [
      {
        id: 'ship1',
        project_id: projectSlug,
        name: 'Correos de Costa Rica',
        description: 'Envío nacional a través del servicio postal oficial de Costa Rica',
        type: 'correos_cr',
        is_active: true,
        base_cost: 3000,
        currency: 'COP',
        estimated_days_min: 3,
        estimated_days_max: 7,
        requires_address: true,
        requires_special_code: true,
        special_code_label: 'Código Postal de Correos CR',
        instructions: 'Se requiere código postal específico de Correos de Costa Rica. El envío incluye número de seguimiento.',
        created_at: '2024-09-15T10:00:00Z',
        updated_at: '2024-09-15T10:00:00Z'
      },
      {
        id: 'ship2',
        project_id: projectSlug,
        name: 'Entrega en Persona',
        description: 'Recolección directa en nuestras instalaciones o punto de encuentro acordado',
        type: 'pickup',
        is_active: true,
        base_cost: 0,
        currency: 'COP',
        estimated_days_min: 1,
        estimated_days_max: 2,
        requires_address: false,
        requires_special_code: false,
        instructions: 'Coordinar fecha y hora de recolección. Disponible de lunes a viernes de 8:00 AM a 6:00 PM.',
        created_at: '2024-09-15T10:00:00Z',
        updated_at: '2024-09-15T10:00:00Z'
      },
      {
        id: 'ship3',
        project_id: projectSlug,
        name: 'Correos CR Express',
        description: 'Servicio express de Correos de Costa Rica para entregas urgentes',
        type: 'correos_cr',
        is_active: true,
        base_cost: 5500,
        currency: 'COP',
        estimated_days_min: 1,
        estimated_days_max: 3,
        requires_address: true,
        requires_special_code: true,
        special_code_label: 'Código Express Correos CR',
        instructions: 'Servicio express con seguimiento en tiempo real. Entrega garantizada en tiempo estimado.',
        created_at: '2024-09-16T14:30:00Z',
        updated_at: '2024-09-16T14:30:00Z'
      },
      {
        id: 'ship4',
        project_id: projectSlug,
        name: 'Entrega Domiciliar San José',
        description: 'Entrega personalizada en el área metropolitana de San José',
        type: 'custom',
        is_active: false,
        base_cost: 2000,
        currency: 'COP',
        estimated_days_min: 1,
        estimated_days_max: 2,
        requires_address: true,
        requires_special_code: false,
        instructions: 'Servicio disponible únicamente en el Gran Área Metropolitana. Entrega de lunes a sábado.',
        created_at: '2024-09-17T09:15:00Z',
        updated_at: '2024-09-17T09:15:00Z'
      }
    ]
    
    setShippingMethods(mockShippingMethods)
    setMethodsLoading(false)
  }, [projectSlug])

  // Función para filtrar métodos
  const getFilteredMethods = () => {
    return shippingMethods.filter(method => {
      const matchesSearch = methodSearch === '' || 
        method.name.toLowerCase().includes(methodSearch.toLowerCase()) ||
        method.description.toLowerCase().includes(methodSearch.toLowerCase())
      
      const matchesStatus = methodStatus === 'all' || 
        (methodStatus === 'active' && method.is_active) ||
        (methodStatus === 'inactive' && !method.is_active)
      
      const matchesType = methodType === 'all' || method.type === methodType
      
      return matchesSearch && matchesStatus && matchesType
    })
  }

  // Manejar envío de nuevo método
  const handleSubmitNewMethod = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMethod.name || !newMethod.description || !newMethod.type) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }

    const methodToAdd: ShippingMethod = {
      id: `ship${shippingMethods.length + 1}`,
      project_id: projectSlug,
      name: newMethod.name!,
      description: newMethod.description!,
      type: newMethod.type as 'correos_cr' | 'pickup' | 'custom',
      is_active: newMethod.is_active || false,
      base_cost: newMethod.base_cost || 0,
      currency: newMethod.currency || 'COP',
      estimated_days_min: newMethod.estimated_days_min || 1,
      estimated_days_max: newMethod.estimated_days_max || 3,
      requires_address: newMethod.requires_address || false,
      requires_special_code: newMethod.requires_special_code || false,
      special_code_label: newMethod.special_code_label,
      instructions: newMethod.instructions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setShippingMethods([...shippingMethods, methodToAdd])
    setShowNewMethodForm(false)
    setNewMethod({
      name: '',
      description: '',
      type: 'pickup',
      is_active: true,
      base_cost: 0,
      currency: 'COP',
      estimated_days_min: 1,
      estimated_days_max: 3,
      requires_address: true,
      requires_special_code: false,
      special_code_label: '',
      instructions: ''
    })
  }

  // Toggle estado activo
  const toggleMethodStatus = (methodId: string) => {
    setShippingMethods(methods => 
      methods.map(method => 
        method.id === methodId 
          ? { ...method, is_active: !method.is_active, updated_at: new Date().toISOString() }
          : method
      )
    )
  }

  if (!project) {
    return <div>Cargando proyecto...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Métodos de Envío</h1>
          <p className="text-gray-600 mt-2">Gestión de opciones de envío y entrega</p>
        </div>
        <div className="flex space-x-4">
          <Link href={`/projects/${projectSlug}/shipping/shipments`}>
            <Button variant="outline">📋 Ver Envíos</Button>
          </Link>
          <Link href={`/projects/${projectSlug}/shipping`}>
            <Button variant="outline">← Módulo Envíos</Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar métodos
              </label>
              <Input
                placeholder="Nombre, descripción..."
                value={methodSearch}
                onChange={(e) => setMethodSearch(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={methodStatus}
                onChange={(e) => setMethodStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={methodType}
                onChange={(e) => setMethodType(e.target.value)}
              >
                <option value="all">Todos los tipos</option>
                <option value="correos_cr">Correos Costa Rica</option>
                <option value="pickup">Entrega en Persona</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={() => setShowNewMethodForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                + Nuevo Método
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario Nuevo Método */}
      {showNewMethodForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nuevo Método de Envío</CardTitle>
            <CardDescription>Configurar nueva opción de envío</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitNewMethod}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <Input
                    value={newMethod.name}
                    onChange={(e) => setNewMethod({...newMethod, name: e.target.value})}
                    placeholder="Nombre del método de envío"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newMethod.type}
                    onChange={(e) => setNewMethod({...newMethod, type: e.target.value as any})}
                    required
                  >
                    <option value="pickup">Entrega en Persona</option>
                    <option value="correos_cr">Correos Costa Rica</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={newMethod.description}
                  onChange={(e) => setNewMethod({...newMethod, description: e.target.value})}
                  placeholder="Descripción detallada del método de envío"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Base
                  </label>
                  <Input
                    type="number"
                    value={newMethod.base_cost}
                    onChange={(e) => setNewMethod({...newMethod, base_cost: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                    min="0"
                    step="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días Mínimos
                  </label>
                  <Input
                    type="number"
                    value={newMethod.estimated_days_min}
                    onChange={(e) => setNewMethod({...newMethod, estimated_days_min: parseInt(e.target.value) || 1})}
                    min="1"
                    max="30"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días Máximos
                  </label>
                  <Input
                    type="number"
                    value={newMethod.estimated_days_max}
                    onChange={(e) => setNewMethod({...newMethod, estimated_days_max: parseInt(e.target.value) || 3})}
                    min="1"
                    max="30"
                  />
                </div>
              </div>

              {/* Configuraciones especiales para Correos CR */}
              {newMethod.type === 'correos_cr' && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3">Configuración Correos Costa Rica</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Etiqueta del Código Especial
                      </label>
                      <Input
                        value={newMethod.special_code_label}
                        onChange={(e) => setNewMethod({...newMethod, special_code_label: e.target.value})}
                        placeholder="Ej: Código Postal de Correos CR"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instrucciones Especiales
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={newMethod.instructions}
                  onChange={(e) => setNewMethod({...newMethod, instructions: e.target.value})}
                  placeholder="Instrucciones adicionales para este método de envío..."
                />
              </div>

              <div className="space-y-3 mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={newMethod.requires_address}
                    onChange={(e) => setNewMethod({...newMethod, requires_address: e.target.checked})}
                  />
                  Requiere dirección de entrega
                </label>
                
                {newMethod.type === 'correos_cr' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={newMethod.requires_special_code}
                      onChange={(e) => setNewMethod({...newMethod, requires_special_code: e.target.checked})}
                    />
                    Requiere código especial de Correos CR
                  </label>
                )}
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={newMethod.is_active}
                    onChange={(e) => setNewMethod({...newMethod, is_active: e.target.checked})}
                  />
                  Activar método inmediatamente
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowNewMethodForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Crear Método
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Métodos */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Métodos de Envío</h3>
              <p className="text-sm text-gray-600 mt-1">
                Mostrando {getFilteredMethods().length} métodos
              </p>
            </div>
          </div>

          {methodsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando métodos...</p>
            </div>
          ) : getFilteredMethods().length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🚚</div>
              <p className="text-gray-600 mb-2">No hay métodos de envío</p>
              <p className="text-sm text-gray-500">Los métodos aparecerán aquí</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getFilteredMethods().map((method) => (
                <Card key={method.id} className={`${!method.is_active ? 'opacity-60' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          {method.type === 'correos_cr' && '📮'}
                          {method.type === 'pickup' && '🏢'}
                          {method.type === 'custom' && '🚚'}
                          <span className="ml-2">{method.name}</span>
                        </h4>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            method.type === 'correos_cr' 
                              ? 'bg-blue-100 text-blue-800'
                              : method.type === 'pickup'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {method.type === 'correos_cr' ? 'Correos CR' : 
                             method.type === 'pickup' ? 'En Persona' : 'Personalizado'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            method.is_active 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {method.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleMethodStatus(method.id)}
                        >
                          {method.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{method.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Costo Base</p>
                        <p className="font-medium">
                          {method.base_cost === 0 
                            ? 'Gratuito' 
                            : `$${method.base_cost.toLocaleString()}`
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tiempo Estimado</p>
                        <p className="font-medium">
                          {method.estimated_days_min === method.estimated_days_max
                            ? `${method.estimated_days_min} día${method.estimated_days_min > 1 ? 's' : ''}`
                            : `${method.estimated_days_min}-${method.estimated_days_max} días`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Características especiales */}
                    <div className="space-y-2 mb-4">
                      {method.requires_address && (
                        <div className="flex items-center text-xs text-gray-600">
                          <span className="mr-2">📍</span>
                          Requiere dirección de entrega
                        </div>
                      )}
                      {method.requires_special_code && (
                        <div className="flex items-center text-xs text-blue-600">
                          <span className="mr-2">🔢</span>
                          {method.special_code_label || 'Requiere código especial'}
                        </div>
                      )}
                    </div>

                    {method.instructions && (
                      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-700">
                        <strong>Instrucciones:</strong> {method.instructions}
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                      Creado: {new Date(method.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}