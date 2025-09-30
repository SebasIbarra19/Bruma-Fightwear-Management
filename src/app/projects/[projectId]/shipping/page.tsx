'use client'

import { useState, useEffect } from 'react'
import { ModernSidebar } from '@/components/ui/modern-sidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Removed unused imports - Badge, Tabs components, and lucide-react icons

interface Shipment {
  id: string
  order_number: string
  customer_name: string
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
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

export default function ShippingPage({ params }: { params: { projectId: string } }) {
  const { theme } = useTheme()
  const { user, isLoading: authLoading } = useAuth()
  const projectSlug = params.projectId
  
  const [activeTab, setActiveTab] = useState('shipments')
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  // Sidebar configuration
  const sidebarItems = [
    {
      id: 'analytics',
      label: 'Estadísticas y Métricas',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2z" />
        </svg>
      ),
      href: `/projects/${projectSlug}/dashboard`
    },
    {
      id: 'inventory',
      label: 'Gestión de Inventario',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      href: `/projects/${projectSlug}/inventory`
    },
    {
      id: 'products',
      label: 'Productos y Categorías',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      subItems: [
        { id: 'products-list', label: 'Lista de Productos', href: `/projects/${projectSlug}/products` },
        { id: 'categories', label: 'Categorías', href: `/projects/${projectSlug}/categories` }
      ]
    },
    {
      id: 'orders',
      label: 'Gestión de Pedidos',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: `/projects/${projectSlug}/orders`
    },
    {
      id: 'customers',
      label: 'Gestión de Clientes',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
        </svg>
      ),
      href: `/projects/${projectSlug}/customers`
    },
    {
      id: 'suppliers',
      label: 'Gestión de Proveedores',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4" />
        </svg>
      ),
      href: `/projects/${projectSlug}/suppliers`
    },
    {
      id: 'shipping',
      label: 'Gestión de Envíos',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: `/projects/${projectSlug}/shipping`,
      isActive: true
    },
    {
      id: 'movements',
      label: 'Movimientos de Stock',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
      href: `/projects/${projectSlug}/inventory-movements`
    }
  ]

  useEffect(() => {
    // Mock data - simulating API call
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
      },
      {
        id: '3',
        order_number: 'ORD-2024-003',
        customer_name: 'Academia de Artes Marciales',
        status: 'pending',
        tracking_code: '',
        shipping_method: 'Correos CR',
        estimated_delivery: '2024-10-02',
        shipping_cost: 2500,
        destination: {
          address: 'Centro Comercial Plaza, Local 202',
          city: 'Cartago',
          province: 'Cartago',
          postal_code: '30101',
          phone: '+506 2551-4455'
        },
        notes: 'Entregar en horario de tarde'
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
      },
      {
        id: '3',
        name: 'Courier Express',
        type: 'express',
        is_active: true,
        base_cost: 5000,
        estimated_days: '1-3 días'
      }
    ])
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'in_transit': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'delivered': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
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
    const matchesSearch = shipment.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.tracking_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (!user) {
    return null
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <ModernSidebar 
          items={sidebarItems}
          projectName="Bruma"
        />
        
        <div className="flex-1 ml-64">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Gestión de Envíos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Administra los envíos, métodos de entrega y seguimiento de pedidos
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Envíos
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {shipments.length}
                      </p>
                    </div>
                    <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        En Tránsito
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {shipments.filter(s => s.status === 'in_transit').length}
                      </p>
                    </div>
                    <svg className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Entregados
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {shipments.filter(s => s.status === 'delivered').length}
                      </p>
                    </div>
                    <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Pendientes
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {shipments.filter(s => s.status === 'pending').length}
                      </p>
                    </div>
                    <svg className="h-8 w-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <Input
                          placeholder="Buscar por número de pedido, cliente o código de rastreo..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendientes</option>
                        <option value="in_transit">En Tránsito</option>
                        <option value="delivered">Entregados</option>
                        <option value="cancelled">Cancelados</option>
                      </select>
                      <Button>
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Envío
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipments List */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Envíos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredShipments.map((shipment) => (
                      <div
                        key={shipment.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {shipment.order_number}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                                {getStatusText(shipment.status)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Cliente</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {shipment.customer_name}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Método</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {shipment.shipping_method}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Entrega Estimada</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {new Date(shipment.estimated_delivery).toLocaleDateString('es-ES')}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-gray-600 dark:text-gray-400">Costo</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  ₡{shipment.shipping_cost.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {shipment.tracking_code && (
                              <div className="mt-2">
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                  Código de rastreo: <span className="font-mono font-medium text-gray-900 dark:text-white">{shipment.tracking_code}</span>
                                </p>
                              </div>
                            )}

                            <div className="mt-2">
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Destino: {shipment.destination.address}, {shipment.destination.city}, {shipment.destination.province}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button variant="outline" size="sm">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Button>
                            <Button variant="outline" size="sm">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredShipments.length === 0 && (
                      <div className="text-center py-8">
                        <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No se encontraron envíos
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {searchTerm || statusFilter !== 'all' 
                            ? 'Intenta ajustar los filtros de búsqueda' 
                            : 'Aún no hay envíos registrados'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}