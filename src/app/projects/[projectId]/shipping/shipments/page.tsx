'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

// Interfaces para Shipments
interface Shipment {
  id: string
  project_id: string
  order_id: string
  order_number: string
  customer_name: string
  shipping_method_id: string
  shipping_method_name: string
  shipping_method_type: 'correos_cr' | 'pickup' | 'custom'
  status: 'pending' | 'preparing' | 'shipped' | 'in_transit' | 'delivered' | 'returned' | 'cancelled'
  tracking_code?: string
  correos_cr_code?: string
  shipping_address: ShippingAddress
  estimated_delivery_date: string
  actual_delivery_date?: string
  shipping_cost: number
  currency: string
  notes?: string
  created_at: string
  updated_at: string
  status_history: ShipmentStatusHistory[]
}

interface ShippingAddress {
  address_line_1: string
  address_line_2?: string
  provincia: string
  canton: string
  distrito: string
  codigo_postal: string
  phone_number?: string
}

interface ShipmentStatusHistory {
  id: string
  status: string
  status_date: string
  notes?: string
  location?: string
}

interface Project {
  project_id: string
  name: string
  slug: string
}

export default function ShipmentsPage({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const projectSlug = params.projectId

  // Estados
  const [project, setProject] = useState<Project | null>(null)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [shipmentsLoading, setShipmentsLoading] = useState(true)

  // Estados de filtros
  const [shipmentSearch, setShipmentSearch] = useState('')
  const [shipmentStatus, setShipmentStatus] = useState<string>('all')
  const [shippingMethod, setShippingMethod] = useState<string>('all')

  // Estados para nuevo envío
  const [showNewShipmentForm, setShowNewShipmentForm] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    notes: '',
    location: ''
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

  // Datos mock de envíos
  useEffect(() => {
    const mockShipments: Shipment[] = [
      {
        id: 'shipment1',
        project_id: projectSlug,
        order_id: '1',
        order_number: 'ORD-2024-001',
        customer_name: 'Deportes El Campeón',
        shipping_method_id: 'ship1',
        shipping_method_name: 'Correos de Costa Rica',
        shipping_method_type: 'correos_cr',
        status: 'in_transit',
        tracking_code: 'CR2024090001',
        correos_cr_code: 'CP-SJ-001-2024',
        shipping_address: {
          address_line_1: 'Avenida Central, Local 15',
          address_line_2: 'Frente al Banco Nacional',
          provincia: 'San José',
          canton: 'San José',
          distrito: 'Carmen',
          codigo_postal: '10101',
          phone_number: '+506 2222-3333'
        },
        estimated_delivery_date: '2024-09-28',
        shipping_cost: 3000,
        currency: 'COP',
        notes: 'Paquete contiene productos frágiles - manejar con cuidado',
        created_at: '2024-09-20T10:00:00Z',
        updated_at: '2024-09-24T14:30:00Z',
        status_history: [
          {
            id: 'hist1',
            status: 'pending',
            status_date: '2024-09-20T10:00:00Z',
            notes: 'Envío creado'
          },
          {
            id: 'hist2',
            status: 'preparing',
            status_date: '2024-09-20T15:30:00Z',
            notes: 'Empacando productos',
            location: 'Bodega BRUMA'
          },
          {
            id: 'hist3',
            status: 'shipped',
            status_date: '2024-09-21T09:00:00Z',
            notes: 'Enviado a Correos de Costa Rica',
            location: 'Oficina Postal San José Centro'
          },
          {
            id: 'hist4',
            status: 'in_transit',
            status_date: '2024-09-24T14:30:00Z',
            notes: 'En tránsito hacia destino',
            location: 'Centro de Distribución Zona 1'
          }
        ]
      },
      {
        id: 'shipment2',
        project_id: projectSlug,
        order_id: '2',
        order_number: 'ORD-2024-002',
        customer_name: 'Gimnasio Fuerza Total',
        shipping_method_id: 'ship2',
        shipping_method_name: 'Entrega en Persona',
        shipping_method_type: 'pickup',
        status: 'delivered',
        shipping_address: {
          address_line_1: 'Recolección en tienda',
          provincia: 'San José',
          canton: 'San José',
          distrito: 'Centro',
          codigo_postal: '10101'
        },
        estimated_delivery_date: '2024-09-22',
        actual_delivery_date: '2024-09-22',
        shipping_cost: 0,
        currency: 'COP',
        notes: 'Cliente recolectó personalmente',
        created_at: '2024-09-21T14:30:00Z',
        updated_at: '2024-09-22T11:00:00Z',
        status_history: [
          {
            id: 'hist5',
            status: 'pending',
            status_date: '2024-09-21T14:30:00Z',
            notes: 'Programado para recolección'
          },
          {
            id: 'hist6',
            status: 'preparing',
            status_date: '2024-09-21T16:00:00Z',
            notes: 'Productos listos para recolección',
            location: 'Tienda BRUMA'
          },
          {
            id: 'hist7',
            status: 'delivered',
            status_date: '2024-09-22T11:00:00Z',
            notes: 'Entregado al cliente',
            location: 'Tienda BRUMA'
          }
        ]
      },
      {
        id: 'shipment3',
        project_id: projectSlug,
        order_id: '3',
        order_number: 'ORD-2024-003',
        customer_name: 'Academia de Artes Marciales Tigre',
        shipping_method_id: 'ship3',
        shipping_method_name: 'Correos CR Express',
        shipping_method_type: 'correos_cr',
        status: 'preparing',
        tracking_code: 'CREXP2024090002',
        correos_cr_code: 'CPE-SJ-002-2024',
        shipping_address: {
          address_line_1: 'Barrio Escalante, Casa 205',
          address_line_2: '200m sur de la Iglesia',
          provincia: 'San José',
          canton: 'San José',
          distrito: 'Escalante',
          codigo_postal: '10105',
          phone_number: '+506 7777-1111'
        },
        estimated_delivery_date: '2024-09-26',
        shipping_cost: 5500,
        currency: 'COP',
        notes: 'Servicio express - prioridad alta',
        created_at: '2024-09-23T08:15:00Z',
        updated_at: '2024-09-24T10:00:00Z',
        status_history: [
          {
            id: 'hist8',
            status: 'pending',
            status_date: '2024-09-23T08:15:00Z',
            notes: 'Envío express programado'
          },
          {
            id: 'hist9',
            status: 'preparing',
            status_date: '2024-09-24T10:00:00Z',
            notes: 'Preparando para envío express',
            location: 'Bodega BRUMA'
          }
        ]
      },
      {
        id: 'shipment4',
        project_id: projectSlug,
        order_id: '4',
        order_number: 'ORD-2024-004',
        customer_name: 'Deportes El Campeón',
        shipping_method_id: 'ship1',
        shipping_method_name: 'Correos de Costa Rica',
        shipping_method_type: 'correos_cr',
        status: 'cancelled',
        tracking_code: 'CR2024090003',
        shipping_address: {
          address_line_1: 'Dirección incorrecta',
          provincia: 'San José',
          canton: 'San José',
          distrito: 'Centro',
          codigo_postal: '10101'
        },
        estimated_delivery_date: '2024-09-30',
        shipping_cost: 3000,
        currency: 'COP',
        notes: 'Cancelado por dirección incorrecta',
        created_at: '2024-09-19T16:45:00Z',
        updated_at: '2024-09-20T09:30:00Z',
        status_history: [
          {
            id: 'hist10',
            status: 'pending',
            status_date: '2024-09-19T16:45:00Z',
            notes: 'Envío programado'
          },
          {
            id: 'hist11',
            status: 'cancelled',
            status_date: '2024-09-20T09:30:00Z',
            notes: 'Cancelado - dirección de envío incorrecta'
          }
        ]
      }
    ]
    
    setShipments(mockShipments)
    setShipmentsLoading(false)
  }, [projectSlug])

  // Función para filtrar envíos
  const getFilteredShipments = () => {
    return shipments.filter(shipment => {
      const matchesSearch = shipmentSearch === '' || 
        shipment.order_number.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
        shipment.customer_name.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
        (shipment.tracking_code && shipment.tracking_code.toLowerCase().includes(shipmentSearch.toLowerCase()))
      
      const matchesStatus = shipmentStatus === 'all' || shipment.status === shipmentStatus
      const matchesMethod = shippingMethod === 'all' || shipment.shipping_method_type === shippingMethod
      
      return matchesSearch && matchesStatus && matchesMethod
    })
  }

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'preparing': return 'bg-yellow-100 text-yellow-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'in_transit': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'returned': return 'bg-orange-100 text-orange-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Función para obtener el texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'preparing': return 'Preparando'
      case 'shipped': return 'Enviado'
      case 'in_transit': return 'En Tránsito'
      case 'delivered': return 'Entregado'
      case 'returned': return 'Devuelto'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  // Manejar actualización de estado
  const handleStatusUpdate = (shipmentId: string) => {
    if (!statusUpdate.status) {
      alert('Por favor seleccione un estado')
      return
    }

    const newHistoryEntry = {
      id: `hist${Date.now()}`,
      status: statusUpdate.status,
      status_date: new Date().toISOString(),
      notes: statusUpdate.notes,
      location: statusUpdate.location
    }

    setShipments(shipments => 
      shipments.map(shipment => 
        shipment.id === shipmentId 
          ? { 
              ...shipment, 
              status: statusUpdate.status as any,
              updated_at: new Date().toISOString(),
              status_history: [...shipment.status_history, newHistoryEntry],
              actual_delivery_date: statusUpdate.status === 'delivered' 
                ? new Date().toISOString().split('T')[0]
                : shipment.actual_delivery_date
            }
          : shipment
      )
    )

    setShowStatusUpdate(false)
    setSelectedShipment(null)
    setStatusUpdate({ status: '', notes: '', location: '' })
  }

  if (!project) {
    return <div>Cargando proyecto...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seguimiento de Envíos</h1>
          <p className="text-gray-600 mt-2">Gestión y seguimiento de envíos de pedidos</p>
        </div>
        <div className="flex space-x-4">
          <Link href={`/projects/${projectSlug}/shipping/methods`}>
            <Button variant="outline">📮 Métodos de Envío</Button>
          </Link>
          <Link href={`/projects/${projectSlug}/shipping`}>
            <Button variant="outline">← Módulo Envíos</Button>
          </Link>
        </div>
      </div>

      {/* Resumen de Estados */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {[
          { status: 'pending', count: shipments.filter(s => s.status === 'pending').length, label: 'Pendiente' },
          { status: 'preparing', count: shipments.filter(s => s.status === 'preparing').length, label: 'Preparando' },
          { status: 'shipped', count: shipments.filter(s => s.status === 'shipped').length, label: 'Enviado' },
          { status: 'in_transit', count: shipments.filter(s => s.status === 'in_transit').length, label: 'En Tránsito' },
          { status: 'delivered', count: shipments.filter(s => s.status === 'delivered').length, label: 'Entregado' },
          { status: 'returned', count: shipments.filter(s => s.status === 'returned').length, label: 'Devuelto' },
          { status: 'cancelled', count: shipments.filter(s => s.status === 'cancelled').length, label: 'Cancelado' }
        ].map((item) => (
          <Card key={item.status}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{item.count}</div>
              <div className="text-sm text-gray-600">{item.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar envíos
              </label>
              <Input
                placeholder="Pedido, cliente, tracking..."
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
                value={shipmentStatus}
                onChange={(e) => setShipmentStatus(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="preparing">Preparando</option>
                <option value="shipped">Enviado</option>
                <option value="in_transit">En Tránsito</option>
                <option value="delivered">Entregado</option>
                <option value="returned">Devuelto</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Envío
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
              >
                <option value="all">Todos los métodos</option>
                <option value="correos_cr">Correos Costa Rica</option>
                <option value="pickup">Entrega en Persona</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button 
                className="bg-green-600 hover:bg-green-700"
              >
                📊 Generar Reporte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Actualización de Estado */}
      {showStatusUpdate && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Actualizar Estado de Envío</CardTitle>
              <CardDescription>
                Pedido: {selectedShipment.order_number}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Estado *
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({...statusUpdate, status: e.target.value})}
                  required
                >
                  <option value="">Seleccionar estado</option>
                  <option value="pending">Pendiente</option>
                  <option value="preparing">Preparando</option>
                  <option value="shipped">Enviado</option>
                  <option value="in_transit">En Tránsito</option>
                  <option value="delivered">Entregado</option>
                  <option value="returned">Devuelto</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <Input
                  value={statusUpdate.location}
                  onChange={(e) => setStatusUpdate({...statusUpdate, location: e.target.value})}
                  placeholder="Ubicación actual (opcional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate({...statusUpdate, notes: e.target.value})}
                  placeholder="Notas adicionales (opcional)"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowStatusUpdate(false)
                    setSelectedShipment(null)
                    setStatusUpdate({ status: '', notes: '', location: '' })
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleStatusUpdate(selectedShipment.id)}
                >
                  Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Envíos */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Envíos</h3>
              <p className="text-sm text-gray-600 mt-1">
                Mostrando {getFilteredShipments().length} envíos
              </p>
            </div>
          </div>

          {shipmentsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando envíos...</p>
            </div>
          ) : getFilteredShipments().length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📦</div>
              <p className="text-gray-600 mb-2">No hay envíos</p>
              <p className="text-sm text-gray-500">Los envíos aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-6">
              {getFilteredShipments().map((shipment) => (
                <Card key={shipment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {shipment.order_number}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                            {getStatusText(shipment.status)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            shipment.shipping_method_type === 'correos_cr' 
                              ? 'bg-blue-100 text-blue-800'
                              : shipment.shipping_method_type === 'pickup'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {shipment.shipping_method_name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{shipment.customer_name}</p>
                        {shipment.tracking_code && (
                          <div className="flex items-center mt-2 text-sm">
                            <span className="text-gray-500 mr-2">📋 Tracking:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-blue-600 font-mono">
                              {shipment.tracking_code}
                            </code>
                          </div>
                        )}
                        {shipment.correos_cr_code && (
                          <div className="flex items-center mt-1 text-sm">
                            <span className="text-gray-500 mr-2">📮 Correos CR:</span>
                            <code className="bg-blue-50 px-2 py-1 rounded text-blue-600 font-mono">
                              {shipment.correos_cr_code}
                            </code>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="mb-2"
                          onClick={() => {
                            setSelectedShipment(shipment)
                            setShowStatusUpdate(true)
                          }}
                        >
                          Actualizar Estado
                        </Button>
                        <div className="text-sm text-gray-600">
                          <div>Costo: ${shipment.shipping_cost.toLocaleString()}</div>
                          <div>Est. Entrega: {new Date(shipment.estimated_delivery_date).toLocaleDateString()}</div>
                          {shipment.actual_delivery_date && (
                            <div className="text-green-600 font-medium">
                              Entregado: {new Date(shipment.actual_delivery_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dirección de envío */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">📍 Dirección de Envío</h5>
                      <div className="text-sm text-gray-600">
                        <p>{shipment.shipping_address.address_line_1}</p>
                        {shipment.shipping_address.address_line_2 && (
                          <p>{shipment.shipping_address.address_line_2}</p>
                        )}
                        <p>
                          {shipment.shipping_address.distrito}, {shipment.shipping_address.canton}, {shipment.shipping_address.provincia}
                        </p>
                        <p>{shipment.shipping_address.codigo_postal}</p>
                        {shipment.shipping_address.phone_number && (
                          <p>📞 {shipment.shipping_address.phone_number}</p>
                        )}
                      </div>
                    </div>

                    {/* Historial de Estados */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">📋 Historial de Estados</h5>
                      <div className="space-y-3">
                        {shipment.status_history.map((history, index) => (
                          <div key={history.id} className={`flex items-start space-x-3 ${
                            index === shipment.status_history.length - 1 ? 'opacity-100' : 'opacity-70'
                          }`}>
                            <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                              index === shipment.status_history.length - 1 
                                ? 'bg-blue-500' 
                                : 'bg-gray-300'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(history.status)}`}>
                                  {getStatusText(history.status)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(history.status_date).toLocaleString()}
                                </span>
                              </div>
                              {history.notes && (
                                <p className="text-sm text-gray-600">{history.notes}</p>
                              )}
                              {history.location && (
                                <p className="text-xs text-gray-500">📍 {history.location}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {shipment.notes && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded text-sm">
                        <strong>Notas:</strong> {shipment.notes}
                      </div>
                    )}
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