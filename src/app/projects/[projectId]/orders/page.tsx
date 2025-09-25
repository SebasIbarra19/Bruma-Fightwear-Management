'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject } from '@/types/database'

// Tipos simulados para Orders (Pedidos de Venta) - cuando existan las tablas reales
interface Customer {
  id: string
  project_id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
  contact_person?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Order {
  id: string
  project_id: string
  customer_id: string
  order_number: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  order_date: string
  delivery_date?: string
  subtotal: number
  tax_amount: number
  shipping_cost: number
  total_amount: number
  currency: string
  payment_status: 'pending' | 'paid' | 'partial' | 'failed'
  notes?: string
  created_at: string
  updated_at: string
  customer_name?: string
}

interface OrderItem {
  id: string
  order_id: string
  product_id?: string
  product_variant_id?: string
  product_name: string
  sku: string
  quantity: number
  unit_price: number
  total_price: number
}

interface OrderStats {
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  shippedOrders: number
  totalRevenue: number
  totalCustomers: number
  activeCustomers: number
  averageOrderValue: number
}

interface CustomerWithStats extends Customer {
  total_orders?: number
  total_spent?: number
  last_order_date?: string
}

export default function OrdersPage() {
  // Estados generales
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pedidos' | 'facturacion' | 'estadisticas'>('pedidos')
  
  // Estados para estadísticas generales
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    activeCustomers: 0,
    averageOrderValue: 0
  })

  // Estados para Pedidos
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersSearch, setOrdersSearch] = useState('')
  const [ordersStatus, setOrdersStatus] = useState<'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all')
  const [ordersCustomer, setOrdersCustomer] = useState<string>('all')



  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const projectSlug = params.projectId as string

  // Manejo de tabs con URL
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('tab', tab)
    router.push(newUrl.pathname + newUrl.search, { scroll: false })
  }

  // Funciones para cargar datos - simuladas por ahora
  const loadOrdersStats = async () => {
    if (!project) return
    
    // Simulación de datos hasta que existan las tablas reales
    setStats({
      totalOrders: 145,
      pendingOrders: 23,
      confirmedOrders: 67,
      shippedOrders: 45,
      totalRevenue: 285750,
      totalCustomers: 89,
      activeCustomers: 76,
      averageOrderValue: 1970
    })
  }

  const loadOrders = async () => {
    if (!project) return
    setOrdersLoading(true)

    try {
      // Simulación de datos - reemplazar cuando existan las tablas
      const mockOrders: Order[] = [
        {
          id: '1',
          project_id: project.project_id,
          customer_id: 'cust1',
          order_number: 'ORD-2024-001',
          status: 'pending',
          order_date: '2024-09-20',
          subtotal: 15000,
          tax_amount: 2400,
          shipping_cost: 500,
          total_amount: 17900,
          currency: 'COP',
          payment_status: 'pending',
          customer_name: 'Deportes El Campeón',
          created_at: '2024-09-20T10:00:00Z',
          updated_at: '2024-09-20T10:00:00Z'
        },
        {
          id: '2',
          project_id: project.project_id,
          customer_id: 'cust2',
          order_number: 'ORD-2024-002',
          status: 'confirmed',
          order_date: '2024-09-21',
          subtotal: 25000,
          tax_amount: 4000,
          shipping_cost: 800,
          total_amount: 29800,
          currency: 'COP',
          payment_status: 'paid',
          customer_name: 'Gimnasio Fuerza Total',
          created_at: '2024-09-21T14:30:00Z',
          updated_at: '2024-09-21T14:30:00Z'
        }
      ]

      setOrders(mockOrders)
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setOrdersLoading(false)
    }
  }

  // Funciones de filtrado
  const getFilteredOrders = () => {
    return orders.filter(order => {
      const matchesSearch = ordersSearch === '' || 
        order.order_number.toLowerCase().includes(ordersSearch.toLowerCase()) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(ordersSearch.toLowerCase()))
      
      const matchesStatus = ordersStatus === 'all' || order.status === ordersStatus

      return matchesSearch && matchesStatus
    })
  }

  // Función para toggle del estado del pedido - si se requiere
  // Aquí podrían ir más funciones específicas de orders

  // Efectos
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/login')
        return
      }
      
      setUser(session.user)
      
      // Obtener datos del proyecto
      const { data: userProjects, error } = await supabase
        .from('user_projects')
        .select(`
          *,
          projects (*)
        `)
        .eq('user_id', session.user.id)
        .eq('projects.slug', projectSlug)
        .single()

      if (error || !userProjects) {
        console.error('Error fetching project:', error)
        router.push('/dashboard')
        return
      }

      const projectData = Array.isArray(userProjects.projects) 
        ? userProjects.projects[0] 
        : userProjects.projects

      if (!projectData) {
        router.push('/dashboard')
        return
      }

      setProject({
        project_id: projectData.id,
        project_name: projectData.name,
        project_slug: projectData.slug,
        project_description: projectData.description,
        user_role: userProjects.role
      })
    }

    getUser()
  }, [projectSlug, router])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['pedidos', 'facturacion', 'estadisticas'].includes(tab)) {
      setActiveTab(tab as typeof activeTab)
    }
  }, [searchParams])

  useEffect(() => {
    if (project) {
      const loadData = async () => {
        setLoading(true)
        await Promise.all([
          loadOrdersStats(),
          loadOrders()
        ])
        setLoading(false)
      }
      loadData()
    }
  }, [project])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Proyecto no encontrado</p>
        </div>
      </div>
    )
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
              {project?.project_name}
            </Link>
            <span>→</span>
            <span className="text-gray-900">Pedidos</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/images/bruma/logo-circle.svg" 
                alt="BRUMA Fightwear" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
                <p className="text-gray-600 mt-2">
                  Administra las ventas y clientes de {project.project_name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-8 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
              <div className="text-sm text-gray-600">Total Pedidos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{stats.confirmedOrders}</div>
              <div className="text-sm text-gray-600">Confirmados</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">{stats.shippedOrders}</div>
              <div className="text-sm text-gray-600">Enviados</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-emerald-600">${stats.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Ingresos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-indigo-600">{stats.totalCustomers}</div>
              <div className="text-sm text-gray-600">Clientes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-cyan-600">{stats.activeCustomers}</div>
              <div className="text-sm text-gray-600">Activos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">${stats.averageOrderValue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Promedio</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleTabChange('pedidos')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'pedidos'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 Pedidos
            </button>
            <button
              onClick={() => handleTabChange('facturacion')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'facturacion'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💳 Facturación
            </button>
            <button
              onClick={() => handleTabChange('estadisticas')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'estadisticas'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Estadísticas
            </button>
          </div>
        </div>

        {/* Contenido del Tab de Pedidos */}
        {activeTab === 'pedidos' && (
          <>
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar pedidos
                    </label>
                    <Input
                      placeholder="Número, cliente..."
                      value={ordersSearch}
                      onChange={(e) => setOrdersSearch(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={ordersStatus}
                      onChange={(e) => setOrdersStatus(e.target.value as any)}
                    >
                      <option value="all">Todos</option>
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="processing">Procesando</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Link href={`/projects/${projectSlug}/orders/new`}>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        + Nuevo Pedido
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Pedidos
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Mostrando {getFilteredOrders().length} pedidos
                    </p>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando pedidos...</p>
                  </div>
                ) : getFilteredOrders().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">📦</div>
                    <p className="text-gray-600 mb-2">No hay pedidos</p>
                    <p className="text-sm text-gray-500">
                      Los pedidos aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pedido
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pago
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredOrders().map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {order.order_number}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(order.order_date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {order.customer_name || 'Cliente desconocido'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.order_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${order.total_amount.toLocaleString()} {order.currency}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : order.status === 'confirmed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.status === 'processing'
                                  ? 'bg-purple-100 text-purple-800'
                                  : order.status === 'shipped'
                                  ? 'bg-orange-100 text-orange-800'
                                  : order.status === 'delivered'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order.status === 'pending' ? 'Pendiente' : 
                                 order.status === 'confirmed' ? 'Confirmado' :
                                 order.status === 'processing' ? 'Procesando' :
                                 order.status === 'shipped' ? 'Enviado' :
                                 order.status === 'delivered' ? 'Entregado' : 'Cancelado'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.payment_status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : order.payment_status === 'partial'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : order.payment_status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {order.payment_status === 'paid' ? 'Pagado' :
                                 order.payment_status === 'partial' ? 'Parcial' :
                                 order.payment_status === 'failed' ? 'Fallido' : 'Pendiente'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/projects/${projectSlug}/orders/${order.id}`}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Ver
                              </Link>
                              <Link
                                href={`/projects/${projectSlug}/orders/${order.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Editar
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Contenido del Tab de Facturación */}
        {activeTab === 'facturacion' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Pagos</CardTitle>
                <CardDescription>
                  Control de pagos y facturación de pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">💳</div>
                  <p className="text-gray-600 mb-2">Módulo de Facturación</p>
                  <p className="text-sm text-gray-500">
                    Este módulo estará disponible próximamente
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reportes Financieros</CardTitle>
                <CardDescription>
                  Análisis de ingresos y reportes contables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📊</div>
                  <p className="text-gray-600 mb-2">Reportes Financieros</p>
                  <p className="text-sm text-gray-500">
                    Análisis detallado de ingresos y gastos
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contenido del Tab de Estadísticas */}
        {activeTab === 'estadisticas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Pedidos</span>
                    <span className="font-semibold">{stats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pedidos Pendientes</span>
                    <span className="font-semibold text-yellow-600">{stats.pendingOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pedidos Confirmados</span>
                    <span className="font-semibold text-green-600">{stats.confirmedOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pedidos Enviados</span>
                    <span className="font-semibold text-purple-600">{stats.shippedOrders}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas Financieras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ingresos Totales</span>
                    <span className="font-semibold text-green-600">${stats.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Promedio por Pedido</span>
                    <span className="font-semibold text-blue-600">${stats.averageOrderValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Clientes</span>
                    <span className="font-semibold">{stats.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clientes Activos</span>
                    <span className="font-semibold text-indigo-600">{stats.activeCustomers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Análisis de Rendimiento</CardTitle>
                <CardDescription>
                  Gráficos y métricas avanzadas de ventas (próximamente)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📈</div>
                  <p className="text-gray-600 mb-2">Análisis Avanzado</p>
                  <p className="text-sm text-gray-500">
                    Gráficos de tendencias, análisis de productos más vendidos,<br />
                    métricas de crecimiento y proyecciones
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}