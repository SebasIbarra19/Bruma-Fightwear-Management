'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { ProjectPageLayout } from '@/components/layout/ProjectPageLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import Link from 'next/link'

interface UserProject {
  project_id: string
  project_name: string
  project_slug: string
  project_type: string
}

interface ProjectShippingData {
  project: UserProject
}

interface Shipment {
  id: string
  project_id: string
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
  created_at: string
  updated_at: string
}

interface ShippingMethod {
  id: string
  project_id: string
  name: string
  type: 'standard' | 'express' | 'overnight' | 'pickup'
  is_active: boolean
  base_cost: number
  estimated_days: string
  description?: string
  created_at: string
  updated_at: string
}

interface ShippingStats {
  totalShipments: number
  pendingShipments: number
  inTransitShipments: number
  deliveredShipments: number
  cancelledShipments: number
  totalShippingCost: number
  averageDeliveryTime: number
}

export default function ShippingPage({ params }: { params: { projectId: string } }) {
  const { user, isLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const projectSlug = params.projectId

  // Estados principales
  const [loading, setLoading] = useState(true)
  const [projectData, setProjectData] = useState<ProjectShippingData | null>(null)

  // Estados para estadísticas
  const [stats, setStats] = useState<ShippingStats>({
    totalShipments: 0,
    pendingShipments: 0,
    inTransitShipments: 0,
    deliveredShipments: 0,
    cancelledShipments: 0,
    totalShippingCost: 0,
    averageDeliveryTime: 0
  })

  // Estados para envíos
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [shipmentsLoading, setShipmentsLoading] = useState(false)

  // Estados para métodos de envío
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [methodsLoading, setMethodsLoading] = useState(false)

  // Estados para filtros
  const [shipmentsSearch, setShipmentsSearch] = useState('')
  const [shipmentsStatus, setShipmentsStatus] = useState<'all' | 'pending' | 'in_transit' | 'delivered' | 'cancelled'>('all')
  const [methodsSearch, setMethodsSearch] = useState('')
  const [methodsStatus, setMethodsStatus] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    if (isLoading) return
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    const loadProjectData = async () => {
      try {
        const { data: userProjects, error } = await supabase
          .rpc('get_user_projects', { user_uuid: user.id })

        if (error) throw error

        const project = userProjects?.find((p: UserProject) => p.project_slug === projectSlug)
        
        if (!project) {
          console.error('Proyecto no encontrado')
          router.push('/dashboard')
          return
        }

        setProjectData({ project })
        await loadShippingData(project)
      } catch (error) {
        console.error('Error cargando proyecto:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadProjectData()
  }, [router, projectSlug, user, isLoading])

  const loadShippingData = async (project: UserProject) => {
    try {
      // Simular datos porque las tablas de shipping no existen aún
      // En producción esto sería:
      // const { data: shipmentsData, error: shipmentsError } = await supabase
      //   .from('shipments')
      //   .select('*')
      //   .eq('project_id', project.project_id)

      // Estadísticas mock
      const mockStats: ShippingStats = {
        totalShipments: 15,
        pendingShipments: 3,
        inTransitShipments: 6,
        deliveredShipments: 5,
        cancelledShipments: 1,
        totalShippingCost: 45750,
        averageDeliveryTime: 3.5
      }

      setStats(mockStats)

      // Cargar datos mock
      await loadShipments(project.project_id)
      await loadMethods(project.project_id)

    } catch (error) {
      console.error('Error cargando datos de envíos:', error)
    }
  }

  const loadShipments = async (projectId: string) => {
    setShipmentsLoading(true)
    try {
      // Mock data - en producción sería una consulta real
      const mockShipments: Shipment[] = [
        {
          id: '1',
          project_id: projectId,
          order_number: 'ORD-2024-001',
          customer_name: 'Deportes El Campeón',
          status: 'in_transit',
          tracking_code: 'CR2024090001',
          shipping_method: 'Correos CR',
          estimated_delivery: '2024-10-05',
          shipping_cost: 3500,
          destination: {
            address: 'Av. Central 123',
            city: 'San José',
            province: 'San José',
            postal_code: '10101',
            phone: '+506 8888-9999'
          },
          notes: 'Entrega en horario de oficina',
          created_at: '2024-10-01T10:00:00Z',
          updated_at: '2024-10-02T14:30:00Z'
        },
        {
          id: '2',
          project_id: projectId,
          order_number: 'ORD-2024-002',
          customer_name: 'Gimnasio Fuerza Total',
          status: 'delivered',
          tracking_code: 'CR2024090002',
          shipping_method: 'Encomiendas Express',
          estimated_delivery: '2024-09-28',
          actual_delivery: '2024-09-27',
          shipping_cost: 5200,
          destination: {
            address: 'Calle 15, Barrio Escalante',
            city: 'San José',
            province: 'San José',
            postal_code: '10102'
          },
          created_at: '2024-09-25T09:15:00Z',
          updated_at: '2024-09-27T16:45:00Z'
        },
        {
          id: '3',
          project_id: projectId,
          order_number: 'ORD-2024-003',
          customer_name: 'Academia de Artes Marciales',
          status: 'pending',
          tracking_code: 'CR2024090003',
          shipping_method: 'Fedex CR',
          estimated_delivery: '2024-10-07',
          shipping_cost: 4800,
          destination: {
            address: 'Plaza Central, Local 24',
            city: 'Cartago',
            province: 'Cartago',
            postal_code: '30101',
            phone: '+506 7777-8888'
          },
          notes: 'Llamar antes de entregar',
          created_at: '2024-10-02T11:30:00Z',
          updated_at: '2024-10-02T11:30:00Z'
        }
      ]

      setShipments(mockShipments)
    } catch (error) {
      console.error('Error cargando envíos:', error)
    } finally {
      setShipmentsLoading(false)
    }
  }

  const loadMethods = async (projectId: string) => {
    setMethodsLoading(true)
    try {
      // Mock data - en producción sería una consulta real
      const mockMethods: ShippingMethod[] = [
        {
          id: '1',
          project_id: projectId,
          name: 'Correos de Costa Rica',
          type: 'standard',
          is_active: true,
          base_cost: 3000,
          estimated_days: '3-5 días',
          description: 'Servicio estándar nacional',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          project_id: projectId,
          name: 'Encomiendas Express',
          type: 'express',
          is_active: true,
          base_cost: 5000,
          estimated_days: '1-2 días',
          description: 'Entrega rápida en GAM',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          project_id: projectId,
          name: 'Fedex Costa Rica',
          type: 'overnight',
          is_active: true,
          base_cost: 8000,
          estimated_days: '24 horas',
          description: 'Entrega al día siguiente',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '4',
          project_id: projectId,
          name: 'Retiro en Tienda',
          type: 'pickup',
          is_active: true,
          base_cost: 0,
          estimated_days: 'Inmediato',
          description: 'Cliente retira en tienda física',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      setMethods(mockMethods)
    } catch (error) {
      console.error('Error cargando métodos de envío:', error)
    } finally {
      setMethodsLoading(false)
    }
  }

  // Funciones de filtrado
  const getFilteredShipments = () => {
    return shipments.filter(shipment => {
      const matchesSearch = shipment.order_number.toLowerCase().includes(shipmentsSearch.toLowerCase()) ||
                          shipment.customer_name.toLowerCase().includes(shipmentsSearch.toLowerCase()) ||
                          shipment.tracking_code.toLowerCase().includes(shipmentsSearch.toLowerCase())
      const matchesStatus = shipmentsStatus === 'all' || shipment.status === shipmentsStatus
      return matchesSearch && matchesStatus
    })
  }

  const getFilteredMethods = () => {
    return methods.filter(method => {
      const matchesSearch = method.name.toLowerCase().includes(methodsSearch.toLowerCase()) ||
                          method.type.toLowerCase().includes(methodsSearch.toLowerCase())
      const matchesStatus = methodsStatus === 'all' || 
                          (methodsStatus === 'active' ? method.is_active : !method.is_active)
      return matchesSearch && matchesStatus
    })
  }

  const getStatusBadge = (status: Shipment['status']) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      in_transit: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En Tránsito' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Entregado' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' }
    }

    const config = statusConfig[status]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getMethodTypeBadge = (type: ShippingMethod['type']) => {
    const typeConfig = {
      standard: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Estándar' },
      express: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Express' },
      overnight: { bg: 'bg-purple-100', text: 'text-purple-800', label: '24 Horas' },
      pickup: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Retiro' }
    }

    const config = typeConfig[type]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const toggleMethodStatus = async (method: ShippingMethod) => {
    try {
      // En producción sería:
      // const { error } = await supabase
      //   .from('shipping_methods')
      //   .update({ is_active: !method.is_active })
      //   .eq('id', method.id)

      // Mock update
      setMethods(prev => prev.map(m => 
        m.id === method.id ? { ...m, is_active: !m.is_active } : m
      ))
    } catch (error) {
      console.error('Error actualizando método:', error)
    }
  }

  if (loading) {
    return (
      <ProjectPageLayout
        projectData={null}
        loading={true}
        pageTitle="Gestión de Envíos"
      >
        <div></div>
      </ProjectPageLayout>
    )
  }

  if (!projectData) {
    return (
      <ProjectPageLayout
        projectData={null}
        loading={false}
        pageTitle="Gestión de Envíos"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p style={{ color: theme.colors.error }}>Proyecto no encontrado</p>
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="mt-4"
              style={{ backgroundColor: theme.colors.primary, color: 'white' }}
            >
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </ProjectPageLayout>
    )
  }

  // Definir tabs como en orders y suppliers
  const shippingTabs = [
    {
      id: 'overview',
      label: 'Resumen de Envíos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* Estadísticas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  {stats.totalShipments}
                </div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Total Envíos
                </div>
              </CardContent>
            </Card>
            
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.inTransitShipments}
                </div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  En Tránsito
                </div>
              </CardContent>
            </Card>
            
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {stats.deliveredShipments}
                </div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Entregados
                </div>
              </CardContent>
            </Card>
            
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-orange-600">
                  ${stats.totalShippingCost.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Costo Total
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>
                  Estado de Envíos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.colors.textSecondary }}>Pendientes</span>
                    <span className="font-semibold text-yellow-600">
                      {stats.pendingShipments}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.colors.textSecondary }}>En Tránsito</span>
                    <span className="font-semibold text-blue-600">
                      {stats.inTransitShipments}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.colors.textSecondary }}>Entregados</span>
                    <span className="font-semibold text-green-600">
                      {stats.deliveredShipments}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.colors.textSecondary }}>Cancelados</span>
                    <span className="font-semibold" style={{ color: theme.colors.error }}>
                      {stats.cancelledShipments}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>
                  Métricas de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.colors.textSecondary }}>Costo Total de Envíos</span>
                    <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                      ${stats.totalShippingCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.colors.textSecondary }}>Tiempo Promedio de Entrega</span>
                    <span className="font-semibold text-blue-600">
                      {stats.averageDeliveryTime} días
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.colors.textSecondary }}>Costo Promedio por Envío</span>
                    <span className="font-semibold text-purple-600">
                      ${Math.round(stats.totalShippingCost / (stats.totalShipments || 1)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Envíos Recientes */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>
                Envíos Recientes
              </CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Últimos envíos registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shipments.slice(0, 5).map((shipment) => (
                  <div 
                    key={shipment.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background + '50' }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                           style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}>
                        📦
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                          {shipment.order_number}
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          {shipment.customer_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(shipment.status)}
                      <div className="text-right">
                        <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                          {shipment.tracking_code}
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          ${shipment.shipping_cost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href={`/projects/${projectSlug}/shipping/new`}>
                  <Button className="w-full" style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                    + Nuevo Envío
                  </Button>
                </Link>
                <Link href={`/projects/${projectSlug}/shipping/methods`}>
                  <Button className="w-full" variant="outline" 
                          style={{ borderColor: theme.colors.border, color: theme.colors.textPrimary }}>
                    ⚙️ Configurar Métodos
                  </Button>
                </Link>
                <Button variant="outline" className="w-full"
                        style={{ borderColor: theme.colors.border, color: theme.colors.textPrimary }}>
                  📊 Ver Reportes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'envios',
      label: 'Gestión de Envíos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" 
                         style={{ color: theme.colors.textPrimary }}>
                    Buscar envíos
                  </label>
                  <Input
                    placeholder="Orden, cliente, tracking..."
                    value={shipmentsSearch}
                    onChange={(e) => setShipmentsSearch(e.target.value)}
                    style={{ 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" 
                         style={{ color: theme.colors.textPrimary }}>
                    Estado
                  </label>
                  <select
                    className="w-full p-2 border rounded-md"
                    style={{ 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary
                    }}
                    value={shipmentsStatus}
                    onChange={(e) => setShipmentsStatus(e.target.value as any)}
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendiente</option>
                    <option value="in_transit">En Tránsito</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Link href={`/projects/${projectSlug}/shipping/new`}>
                    <Button style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                      + Nuevo Envío
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>
                    Lista de Envíos
                  </h3>
                  <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                    Mostrando {getFilteredShipments().length} envíos
                  </p>
                </div>
              </div>

              {shipmentsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" 
                       style={{ borderColor: theme.colors.primary }}></div>
                  <p className="mt-4" style={{ color: theme.colors.textSecondary }}>
                    Cargando envíos...
                  </p>
                </div>
              ) : getFilteredShipments().length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="mb-2" style={{ color: theme.colors.textSecondary }}>
                    No hay envíos
                  </p>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    Los envíos aparecerán aquí cuando se registren
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead style={{ backgroundColor: theme.colors.surface }}>
                      <tr style={{ borderBottomColor: theme.colors.border, borderBottomWidth: '1px' }}>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Orden
                        </th>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Cliente
                        </th>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Tracking
                        </th>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Método
                        </th>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Destino
                        </th>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Costo
                        </th>
                        <th className="text-center p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Estado
                        </th>
                        <th className="text-center p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredShipments().map((shipment) => (
                        <tr key={shipment.id} className="border-b" 
                            style={{ borderColor: theme.colors.border }}>
                          <td className="p-3">
                            <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                              {shipment.order_number}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                              {shipment.customer_name}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-sm" style={{ color: theme.colors.textPrimary }}>
                              {shipment.tracking_code}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm" style={{ color: theme.colors.textPrimary }}>
                              {shipment.shipping_method}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <div className="text-sm" style={{ color: theme.colors.textPrimary }}>
                                {shipment.destination.city}
                              </div>
                              <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                                {shipment.destination.province}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                              ${shipment.shipping_cost.toLocaleString()}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {getStatusBadge(shipment.status)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center space-x-2">
                              <Link
                                href={`/projects/${projectSlug}/shipping/${shipment.id}`}
                                className="text-blue-600 hover:text-blue-900 text-sm"
                              >
                                Ver
                              </Link>
                              <Link
                                href={`/projects/${projectSlug}/shipping/${shipment.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900 text-sm"
                              >
                                Editar
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'metodos',
      label: 'Métodos de Envío',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" 
                         style={{ color: theme.colors.textPrimary }}>
                    Buscar métodos
                  </label>
                  <Input
                    placeholder="Nombre, tipo..."
                    value={methodsSearch}
                    onChange={(e) => setMethodsSearch(e.target.value)}
                    style={{ 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" 
                         style={{ color: theme.colors.textPrimary }}>
                    Estado
                  </label>
                  <select
                    className="w-full p-2 border rounded-md"
                    style={{ 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary
                    }}
                    value={methodsStatus}
                    onChange={(e) => setMethodsStatus(e.target.value as any)}
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Link href={`/projects/${projectSlug}/shipping/methods/new`}>
                    <Button style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                      + Nuevo Método
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>
                    Métodos de Envío
                  </h3>
                  <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                    Mostrando {getFilteredMethods().length} métodos
                  </p>
                </div>
              </div>

              {methodsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" 
                       style={{ borderColor: theme.colors.primary }}></div>
                  <p className="mt-4" style={{ color: theme.colors.textSecondary }}>
                    Cargando métodos...
                  </p>
                </div>
              ) : getFilteredMethods().length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">⚙️</div>
                  <p className="mb-2" style={{ color: theme.colors.textSecondary }}>
                    No hay métodos de envío
                  </p>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    Los métodos aparecerán aquí cuando se configuren
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead style={{ backgroundColor: theme.colors.surface }}>
                      <tr style={{ borderBottomColor: theme.colors.border, borderBottomWidth: '1px' }}>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Método
                        </th>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Tipo
                        </th>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Costo Base
                        </th>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Tiempo Estimado
                        </th>
                        <th className="text-center p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Estado
                        </th>
                        <th className="text-center p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredMethods().map((method) => (
                        <tr key={method.id} className="border-b" 
                            style={{ borderColor: theme.colors.border }}>
                          <td className="p-3">
                            <div>
                              <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                                {method.name}
                              </div>
                              <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                                {method.description}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            {getMethodTypeBadge(method.type)}
                          </td>
                          <td className="p-3">
                            <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                              ${method.base_cost.toLocaleString()}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm" style={{ color: theme.colors.textPrimary }}>
                              {method.estimated_days}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              method.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {method.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center space-x-2">
                              <Link
                                href={`/projects/${projectSlug}/shipping/methods/${method.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900 text-sm"
                              >
                                Editar
                              </Link>
                              <button
                                onClick={() => toggleMethodStatus(method)}
                                className={`text-sm ${
                                  method.is_active 
                                    ? 'text-red-600 hover:text-red-900' 
                                    : 'text-green-600 hover:text-green-900'
                                }`}
                              >
                                {method.is_active ? 'Desactivar' : 'Activar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas y Reportes',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6-2a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>
                  Resumen de Envíos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Total de Envíos</span>
                    <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                      {stats.totalShipments}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>En Tránsito</span>
                    <span className="font-semibold text-blue-600">{stats.inTransitShipments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Entregados</span>
                    <span className="font-semibold text-green-600">
                      {stats.deliveredShipments}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>
                  Métricas de Costo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Costo Total</span>
                    <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                      ${stats.totalShippingCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Costo Promedio</span>
                    <span className="font-semibold text-purple-600">
                      ${Math.round(stats.totalShippingCost / (stats.totalShipments || 1)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Tiempo Promedio</span>
                    <span className="font-semibold text-blue-600">
                      {stats.averageDeliveryTime} días
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>
                Análisis Avanzado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📊</div>
                <p className="mb-2" style={{ color: theme.colors.textSecondary }}>
                  Análisis Avanzado de Envíos
                </p>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Gráficos de rendimiento, análisis de costos,<br />
                  eficiencia de métodos de envío y proyecciones
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ]

  return (
    <ProjectPageLayout
      projectData={projectData}
      loading={loading}
      pageTitle="Gestión de Envíos"
    >
      <Tabs tabs={shippingTabs} defaultTab="overview" />
    </ProjectPageLayout>
  )
}