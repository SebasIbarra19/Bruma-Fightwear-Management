'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface Shipment {
  id: string
  order_number: string
  customer_name: string
  status: string
  tracking_code: string
  shipping_method: string
  estimated_delivery: string
  actual_delivery?: string | null
  shipping_cost: number
  destination: {
    address: string
    city: string
    province: string
    postal_code: string
    phone?: string
  }
  notes?: string
}

interface ShippingMethod {
  id: string
  name: string
  type: string
  is_active: boolean
  base_cost: number
  estimated_days: string
}

interface Project {
  project_id: string
  name: string
  slug: string
}

export default function ShippingPage({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const projectSlug = params.projectId
  const [project, setProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState('seguimiento')
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [shipmentSearch, setShipmentSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodSearch, setMethodSearch] = useState('')
  
  // Estados para edición de envíos
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Shipment>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Datos mock del proyecto
    const mockProject: Project = {
      project_id: projectSlug,
      name: 'BRUMA Fightwear',
      slug: projectSlug
    }
    setProject(mockProject)
    
    // Mock data
    setShipments([
      {
        id: '1',
        order_number: 'ORD-2024-001',
        customer_name: 'Deportes El Campeón',
        status: 'in_transit',
        tracking_code: 'CR2024090001',
        shipping_method: 'Correos CR',
        estimated_delivery: '2024-09-28',
        shipping_cost: 3000,
        destination: {
          address: 'Avenida Central, Local 15',
          city: 'San José',
          province: 'San José',
          postal_code: '10101',
          phone: '+506 2222-3333'
        },
        notes: 'Paquete contiene productos frágiles'
      },
      {
        id: '2', 
        order_number: 'ORD-2024-002',
        customer_name: 'Gimnasio Fuerza Total',
        status: 'delivered',
        tracking_code: '',
        shipping_method: 'Entrega en Persona',
        estimated_delivery: '2024-09-22',
        actual_delivery: '2024-09-22',
        shipping_cost: 0,
        destination: {
          address: 'Recolección en tienda',
          city: 'San José',
          province: 'San José',
          postal_code: '10101'
        },
        notes: 'Cliente recolectó personalmente'
      }
    ])

    setMethods([
      {
        id: '1',
        name: 'Correos de Costa Rica',
        type: 'correos_cr',
        is_active: true,
        base_cost: 3000,
        estimated_days: '3-7 días'
      },
      {
        id: '2',
        name: 'Entrega en Persona',
        type: 'pickup',
        is_active: true,
        base_cost: 0,
        estimated_days: '1-2 días'
      }
    ])
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-gray-100 text-gray-800',
      'in_transit': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      'pending': 'Pendiente',
      'in_transit': 'En Tránsito',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    }
    return texts[status] || status
  }

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipmentSearch === '' || 
      shipment.order_number.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      shipment.customer_name.toLowerCase().includes(shipmentSearch.toLowerCase())
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredMethods = methods.filter(method => {
    const matchesSearch = methodSearch === '' || 
      method.name.toLowerCase().includes(methodSearch.toLowerCase())
    return matchesSearch
  })

  // Funciones para manejo de edición de envíos
  const handleEditShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setEditForm({
      ...shipment,
      destination: { ...shipment.destination }
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedShipment || !editForm) return
    
    setLoading(true)
    try {
      // Simular guardado - aquí iría la llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setShipments(prevShipments => 
        prevShipments.map(shipment => 
          shipment.id === selectedShipment.id 
            ? { ...shipment, ...editForm } as Shipment
            : shipment
        )
      )
      
      setShowEditModal(false)
      setSelectedShipment(null)
      setEditForm({})
    } catch (error) {
      console.error('Error guardando cambios:', error)
    }
    setLoading(false)
  }

  const handleCancelEdit = () => {
    setShowEditModal(false)
    setSelectedShipment(null)
    setEditForm({})
  }

  if (!project) {
    return <div className="container mx-auto px-4 py-8">Cargando proyecto...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>→</span>
            <Link href={`/projects/${projectSlug}/dashboard`} className="hover:text-blue-600">
              {project?.name}
            </Link>
            <span>→</span>
            <span className="text-gray-900">Logística</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/images/bruma/logo-circle.svg" 
                alt="BRUMA Fightwear" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión Logística</h1>
                <p className="text-gray-600 mt-2">
                  Sistema completo para gestionar envíos y logística de {project.name}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link href={`/projects/${projectSlug}/customers/addresses`}>
                <Button variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
                  📍 Direcciones
                </Button>
              </Link>
            </div>
          </div>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pendientes', count: shipments.filter(s => s.status === 'pending').length },
          { label: 'En Tránsito', count: shipments.filter(s => s.status === 'in_transit').length },
          { label: 'Entregados', count: shipments.filter(s => s.status === 'delivered').length },
          { label: 'Total', count: shipments.length }
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stat.count}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('seguimiento')}
          className={`px-6 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'seguimiento'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Seguimiento de Envíos
        </button>
        <button
          onClick={() => setActiveTab('metodos')}
          className={`px-6 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'metodos'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📮 Métodos de Envío
        </button>
      </div>

      {/* Content - Seguimiento */}
      {activeTab === 'seguimiento' && (
        <>
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar envíos
                  </label>
                  <Input
                    placeholder="Pedido, cliente..."
                    value={shipmentSearch}
                    onChange={(e) => setShipmentSearch(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="in_transit">En Tránsito</option>
                    <option value="delivered">Entregados</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button className="bg-green-600 hover:bg-green-700">
                    📊 Reporte
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipments List */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Envíos ({filteredShipments.length})</h3>
              <div className="space-y-4">
                {filteredShipments.map((shipment) => (
                  <Card key={shipment.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold">{shipment.order_number}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                              {getStatusText(shipment.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{shipment.customer_name}</p>
                          <p className="text-sm text-gray-600 mb-2">{shipment.shipping_method}</p>
                          
                          {/* Información de destino */}
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <h5 className="text-xs font-medium text-gray-700 mb-1">📍 Destino</h5>
                            <div className="text-sm text-gray-600">
                              <p>{shipment.destination.address}</p>
                              <p>{shipment.destination.city}, {shipment.destination.province} {shipment.destination.postal_code}</p>
                              {shipment.destination.phone && <p>📞 {shipment.destination.phone}</p>}
                            </div>
                          </div>

                          {shipment.tracking_code && (
                            <div className="flex items-center mt-2 text-sm">
                              <span className="text-gray-500 mr-2">📋 Tracking:</span>
                              <code className="bg-gray-100 px-2 py-1 rounded text-blue-600 font-mono">
                                {shipment.tracking_code}
                              </code>
                            </div>
                          )}

                          {shipment.notes && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                              <span className="font-medium">Notas:</span> {shipment.notes}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right ml-4">
                          <div className="text-sm text-gray-600 mb-3">
                            <div>Costo: ${shipment.shipping_cost.toLocaleString()}</div>
                            <div>Est.: {new Date(shipment.estimated_delivery).toLocaleDateString()}</div>
                            {shipment.actual_delivery && (
                              <div className="text-green-600 font-medium">
                                Entregado: {new Date(shipment.actual_delivery).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          
                          {/* Botones de acción */}
                          <div className="flex flex-col space-y-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditShipment(shipment)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              ✏️ Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-gray-600 hover:text-gray-700"
                            >
                              👁️ Ver
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Content - Métodos */}
      {activeTab === 'metodos' && (
        <>
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar métodos
                  </label>
                  <Input
                    placeholder="Nombre del método..."
                    value={methodSearch}
                    onChange={(e) => setMethodSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    + Nuevo Método
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Methods List */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Métodos de Envío ({filteredMethods.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredMethods.map((method) => (
                  <Card key={method.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 flex items-center">
                            {method.type === 'correos_cr' && '📮'}
                            {method.type === 'pickup' && '🏢'}
                            {method.type === 'custom' && '🚚'}
                            <span className="ml-2">{method.name}</span>
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium mt-2 inline-block ${
                            method.is_active 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {method.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Costo Base</p>
                          <p className="font-medium">
                            {method.base_cost === 0 ? 'Gratuito' : `$${method.base_cost.toLocaleString()}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tiempo</p>
                          <p className="font-medium">{method.estimated_days}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
      </div>
      
      {/* Modal de edición */}
      {showEditModal && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Editar Envío #{selectedShipment.order_number}</h2>
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  ✖️
                </Button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }} className="space-y-6">
                
                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado del envío
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="preparing">Preparando</option>
                    <option value="shipped">Enviado</option>
                    <option value="in_transit">En tránsito</option>
                    <option value="delivered">Entregado</option>
                    <option value="delayed">Retrasado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                {/* Información de destino */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">📍 Información de destino</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
                      <input
                        type="text"
                        value={editForm.destination?.address || ''}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          destination: { ...prev.destination!, address: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Dirección completa"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad</label>
                      <input
                        type="text"
                        value={editForm.destination?.city || ''}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          destination: { ...prev.destination!, city: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Provincia</label>
                      <input
                        type="text"
                        value={editForm.destination?.province || ''}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          destination: { ...prev.destination!, province: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Código postal</label>
                      <input
                        type="text"
                        value={editForm.destination?.postal_code || ''}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          destination: { ...prev.destination!, postal_code: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={editForm.destination?.phone || ''}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          destination: { ...prev.destination!, phone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                </div>

                {/* Código de seguimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de seguimiento
                  </label>
                  <input
                    type="text"
                    value={editForm.tracking_code || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tracking_code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ej: ABC123456789"
                  />
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha estimada de entrega
                    </label>
                    <input
                      type="date"
                      value={editForm.estimated_delivery?.split('T')[0] || ''}
                      onChange={(e) => setEditForm(prev => ({ 
                        ...prev, 
                        estimated_delivery: e.target.value + 'T00:00:00.000Z' 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de entrega real
                    </label>
                    <input
                      type="date"
                      value={editForm.actual_delivery ? editForm.actual_delivery.split('T')[0] : ''}
                      onChange={(e) => setEditForm(prev => ({ 
                        ...prev, 
                        actual_delivery: e.target.value ? e.target.value + 'T00:00:00.000Z' : null 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales
                  </label>
                  <textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                    placeholder="Notas sobre el envío (opcional)"
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}