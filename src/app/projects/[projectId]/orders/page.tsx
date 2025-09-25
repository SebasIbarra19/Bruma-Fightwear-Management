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
  variant_description?: string  // e.g., "Talla L, Color Rojo"
  sku: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  updated_at: string
}

interface PaymentMethod {
  id: string
  project_id: string
  name: string
  type: 'cash' | 'transfer' | 'sinpe_movil' | 'courtesy' | 'card' | 'other'
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Payment {
  id: string
  project_id: string
  order_id: string
  payment_method_id: string
  amount: number
  currency: string
  payment_date: string
  reference_number?: string
  notes?: string
  status: 'completed' | 'pending' | 'failed'
  created_at: string
  updated_at: string
  payment_method_name?: string
}

interface OrderWithItems extends Order {
  items?: OrderItem[]
  payments?: Payment[]
  total_paid?: number
  pending_amount?: number
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
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersSearch, setOrdersSearch] = useState('')
  const [ordersStatus, setOrdersStatus] = useState<'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all')
  const [ordersCustomer, setOrdersCustomer] = useState<string>('all')
  const [ordersPaymentStatus, setOrdersPaymentStatus] = useState<'all' | 'pending' | 'paid' | 'partial' | 'failed'>('all')
  
  // Estados para Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false)
  
  // Estados para Payments
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)



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
      totalOrders: 3,
      pendingOrders: 1,
      confirmedOrders: 1,
      shippedOrders: 1,
      totalRevenue: 672200,
      totalCustomers: 3,
      activeCustomers: 3,
      averageOrderValue: 224066
    })
  }

  const loadOrders = async () => {
    if (!project) return
    setOrdersLoading(true)

    try {
      // Simulación de datos - reemplazar cuando existan las tablas
      const mockOrders: OrderWithItems[] = [
        {
          id: '1',
          project_id: project.project_id,
          customer_id: 'cust1',
          order_number: 'ORD-2024-001',
          status: 'pending',
          order_date: '2024-09-20',
          subtotal: 150000,
          tax_amount: 24000,
          shipping_cost: 5000,
          total_amount: 179000,
          currency: 'COP',
          payment_status: 'pending',
          customer_name: 'Deportes El Campeón',
          created_at: '2024-09-20T10:00:00Z',
          updated_at: '2024-09-20T10:00:00Z',
          items: [
            {
              id: 'item1',
              order_id: '1',
              product_id: 'prod1',
              product_name: 'Rashguard BRUMA Pro',
              variant_description: 'Talla L, Color Negro',
              sku: 'RG-BRUMA-PRO-L-BLK',
              quantity: 5,
              unit_price: 25000,
              total_price: 125000,
              created_at: '2024-09-20T10:00:00Z',
              updated_at: '2024-09-20T10:00:00Z'
            },
            {
              id: 'item2',
              order_id: '1',
              product_id: 'prod2',
              product_name: 'Pantaloneta Sin Licra Elite',
              variant_description: 'Talla M, Color Azul',
              sku: 'PSL-ELITE-M-BLU',
              quantity: 3,
              unit_price: 18000,
              total_price: 54000,
              created_at: '2024-09-20T10:00:00Z',
              updated_at: '2024-09-20T10:00:00Z'
            }
          ],
          payments: [],
          total_paid: 0,
          pending_amount: 179000
        },
        {
          id: '2',
          project_id: project.project_id,
          customer_id: 'cust2',
          order_number: 'ORD-2024-002',
          status: 'confirmed',
          order_date: '2024-09-21',
          subtotal: 320000,
          tax_amount: 51200,
          shipping_cost: 8000,
          total_amount: 379200,
          currency: 'COP',
          payment_status: 'paid',
          customer_name: 'Gimnasio Fuerza Total',
          created_at: '2024-09-21T14:30:00Z',
          updated_at: '2024-09-21T14:30:00Z',
          items: [
            {
              id: 'item3',
              order_id: '2',
              product_id: 'prod3',
              product_name: 'T-Shirt BRUMA Training',
              variant_description: 'Talla XL, Color Gris',
              sku: 'TS-BRUMA-TRN-XL-GRY',
              quantity: 8,
              unit_price: 22000,
              total_price: 176000,
              created_at: '2024-09-21T14:30:00Z',
              updated_at: '2024-09-21T14:30:00Z'
            },
            {
              id: 'item4',
              order_id: '2',
              product_id: 'prod1',
              product_name: 'Rashguard BRUMA Pro',
              variant_description: 'Talla M, Color Rojo',
              sku: 'RG-BRUMA-PRO-M-RED',
              quantity: 6,
              unit_price: 25000,
              total_price: 150000,
              created_at: '2024-09-21T14:30:00Z',
              updated_at: '2024-09-21T14:30:00Z'
            }
          ],
          payments: [
            {
              id: 'payment1',
              project_id: project.project_id,
              order_id: '2',
              payment_method_id: 'pm2',
              amount: 379200,
              currency: 'COP',
              payment_date: '2024-09-21',
              reference_number: 'TRF-20240921-001',
              status: 'completed',
              payment_method_name: 'Transferencia Bancaria',
              created_at: '2024-09-21T14:30:00Z',
              updated_at: '2024-09-21T14:30:00Z'
            }
          ],
          total_paid: 379200,
          pending_amount: 0
        },
        {
          id: '3',
          project_id: project.project_id,
          customer_id: 'cust3',
          order_number: 'ORD-2024-003',
          status: 'processing',
          order_date: '2024-09-22',
          subtotal: 95000,
          tax_amount: 15200,
          shipping_cost: 4000,
          total_amount: 114200,
          currency: 'COP',
          payment_status: 'partial',
          customer_name: 'Laura Patricia Martínez',
          created_at: '2024-09-22T09:15:00Z',
          updated_at: '2024-09-22T09:15:00Z',
          items: [
            {
              id: 'item5',
              order_id: '3',
              product_id: 'prod2',
              product_name: 'Pantaloneta Sin Licra Elite',
              variant_description: 'Talla S, Color Negro',
              sku: 'PSL-ELITE-S-BLK',
              quantity: 2,
              unit_price: 18000,
              total_price: 36000,
              created_at: '2024-09-22T09:15:00Z',
              updated_at: '2024-09-22T09:15:00Z'
            },
            {
              id: 'item6',
              order_id: '3',
              product_id: 'prod4',
              product_name: 'Guantes MMA Pro',
              variant_description: 'Talla M, Color Negro/Rojo',
              sku: 'GL-MMA-PRO-M-BLKRED',
              quantity: 1,
              unit_price: 65000,
              total_price: 65000,
              created_at: '2024-09-22T09:15:00Z',
              updated_at: '2024-09-22T09:15:00Z'
            }
          ],
          payments: [
            {
              id: 'payment2',
              project_id: project.project_id,
              order_id: '3',
              payment_method_id: 'pm4',
              amount: 50000,
              currency: 'COP',
              payment_date: '2024-09-22',
              reference_number: 'SINPE-89765432',
              status: 'completed',
              payment_method_name: 'Sinpe Móvil',
              created_at: '2024-09-22T09:15:00Z',
              updated_at: '2024-09-22T09:15:00Z'
            }
          ],
          total_paid: 50000,
          pending_amount: 64200
        }
      ]

      setOrders(mockOrders)
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setOrdersLoading(false)
    }
  }

  const loadPaymentMethods = async () => {
    if (!project) return
    setPaymentMethodsLoading(true)

    try {
      // Datos de Payment Methods según Fase 3
      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: 'pm1',
          project_id: project.project_id,
          name: 'Cortesía',
          type: 'courtesy',
          description: 'Productos de cortesía sin costo',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'pm2',
          project_id: project.project_id,
          name: 'Transferencia Bancaria',
          type: 'transfer',
          description: 'Pago mediante transferencia bancaria',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'pm3',
          project_id: project.project_id,
          name: 'Efectivo',
          type: 'cash',
          description: 'Pago en efectivo',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'pm4',
          project_id: project.project_id,
          name: 'Sinpe Móvil',
          type: 'sinpe_movil',
          description: 'Sistema de pagos móviles de Costa Rica',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      setPaymentMethods(mockPaymentMethods)
    } catch (err) {
      console.error('Error loading payment methods:', err)
    } finally {
      setPaymentMethodsLoading(false)
    }
  }

  const loadPayments = async () => {
    if (!project) return
    setPaymentsLoading(true)

    try {
      // Cargar todos los pagos del proyecto
      const allPayments: Payment[] = []
      
      // Extraer pagos de las órdenes (en un caso real vendrían de una tabla separada)
      orders.forEach(order => {
        if (order.payments) {
          allPayments.push(...order.payments)
        }
      })

      setPayments(allPayments)
    } catch (err) {
      console.error('Error loading payments:', err)
    } finally {
      setPaymentsLoading(false)
    }
  }

  // Funciones de filtrado
  const getFilteredOrders = () => {
    return orders.filter(order => {
      const matchesSearch = ordersSearch === '' || 
        order.order_number.toLowerCase().includes(ordersSearch.toLowerCase()) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(ordersSearch.toLowerCase()))
      
      const matchesStatus = ordersStatus === 'all' || order.status === ordersStatus
      const matchesPaymentStatus = ordersPaymentStatus === 'all' || order.payment_status === ordersPaymentStatus

      return matchesSearch && matchesStatus && matchesPaymentStatus
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
          loadPaymentMethods(),
          loadOrders()
        ])
        // Cargar payments después de que se carguen las órdenes
        await loadPayments()
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado de Pago
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={ordersPaymentStatus}
                      onChange={(e) => setOrdersPaymentStatus(e.target.value as any)}
                    >
                      <option value="all">Todos</option>
                      <option value="pending">Pendiente</option>
                      <option value="paid">Pagado</option>
                      <option value="partial">Parcial</option>
                      <option value="failed">Fallido</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pago
                    </label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="all">Todos</option>
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
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
                    <table className="w-full divide-y divide-gray-200 table-auto">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pedido
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total / Pagado
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Método Pago
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredOrders().map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 whitespace-nowrap w-28">
                              <div className="text-xs font-medium text-gray-900">
                                {order.order_number}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(order.order_date).toLocaleDateString('es-ES', { 
                                  day: '2-digit', 
                                  month: '2-digit' 
                                })}
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap w-28">
                              <div className="text-xs text-gray-900 truncate" title={order.customer_name || 'Cliente desconocido'}>
                                {order.customer_name || 'Cliente desconocido'}
                              </div>
                            </td>
                            <td className="px-3 py-3 w-80">
                              <div className="text-xs text-gray-900">
                                <div className="font-medium mb-1">{order.items?.length || 0} productos</div>
                                {order.items && order.items.length > 0 && (
                                  <div className="space-y-1">
                                    {order.items.slice(0, 2).map((item) => (
                                      <div key={item.id} className="bg-gray-50 rounded p-2 text-xs">
                                        <div className="font-medium text-gray-900 mb-1">
                                          {item.quantity}x {item.product_name}
                                        </div>
                                        {item.variant_description && (
                                          <div className="text-gray-500 text-xs mb-1">{item.variant_description}</div>
                                        )}
                                        <div className="text-gray-600 text-xs">
                                          {item.sku}
                                        </div>
                                      </div>
                                    ))}
                                    {order.items.length > 2 && (
                                      <div className="text-center py-1 bg-gray-100 rounded text-xs text-gray-600">
                                        + {order.items.length - 2} más
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap w-28">
                              <div className="text-xs text-gray-900">
                                <div className="font-medium">${order.total_amount.toLocaleString()}</div>
                                <div className={`text-xs mt-1 ${
                                  order.payment_status === 'paid' 
                                    ? 'text-green-600'
                                    : order.payment_status === 'partial'
                                    ? 'text-yellow-600'
                                    : 'text-gray-500'
                                }`}>
                                  ${(order.total_paid || 0).toLocaleString()}
                                  {order.pending_amount && order.pending_amount > 0 && (
                                    <div className="text-red-600 text-xs">
                                      ${order.pending_amount.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap w-28">
                              {order.payments && order.payments.length > 0 ? (
                                <div className="text-xs">
                                  {order.payments.slice(0, 1).map((payment) => (
                                    <div key={payment.id}>
                                      <div className="font-medium text-gray-900 truncate" title={payment.payment_method_name}>
                                        {payment.payment_method_name}
                                      </div>
                                      {payment.reference_number && (
                                        <div className="text-xs text-gray-500 truncate" title={payment.reference_number}>
                                          {payment.reference_number}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {order.payments.length > 1 && (
                                    <div className="text-xs text-gray-500 mt-1">+{order.payments.length - 1} más</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">Sin pagos</span>
                              )}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap w-28">
                              <div className="flex flex-col space-y-1">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium text-center ${
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
                                  {order.status === 'pending' ? 'Pend.' : 
                                   order.status === 'confirmed' ? 'Conf.' :
                                   order.status === 'processing' ? 'Proc.' :
                                   order.status === 'shipped' ? 'Env.' :
                                   order.status === 'delivered' ? 'Ent.' : 'Canc.'}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium text-center ${
                                  order.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : order.payment_status === 'partial'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : order.payment_status === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.payment_status === 'paid' ? 'Pag.' :
                                   order.payment_status === 'partial' ? 'Parc.' :
                                   order.payment_status === 'failed' ? 'Fall.' : 'S/P'}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center text-xs font-medium w-20">
                              <div className="flex flex-col space-y-1">
                                <Link
                                  href={`/projects/${projectSlug}/orders/${order.id}`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Ver
                                </Link>
                                <Link
                                  href={`/projects/${projectSlug}/orders/${order.id}/edit`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Edit
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
          </>
        )}

        {/* Contenido del Tab de Facturación */}
        {activeTab === 'facturacion' && (
          <>
            {/* Resumen de Pagos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">
                    ${payments.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Recaudado</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-600">{payments.length}</div>
                  <div className="text-sm text-gray-600">Pagos Registrados</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-yellow-600">
                    ${orders.reduce((sum, order) => sum + (order.pending_amount || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Pendiente Cobro</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-purple-600">{paymentMethods.filter(pm => pm.is_active).length}</div>
                  <div className="text-sm text-gray-600">Métodos Activos</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Historial de Pagos */}
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Pagos</CardTitle>
                  <CardDescription>
                    Últimos pagos registrados en el sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Cargando pagos...</p>
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-4">💳</div>
                      <p className="text-gray-600 mb-2">No hay pagos registrados</p>
                      <p className="text-sm text-gray-500">
                        Los pagos aparecerán aquí cuando se registren
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments.slice(0, 5).map((payment) => {
                        const order = orders.find(o => o.id === payment.order_id)
                        return (
                          <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {order?.order_number || 'Pedido desconocido'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {order?.customer_name}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-600">
                                  ${payment.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(payment.payment_date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {payment.payment_method_name}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  payment.status === 'completed' 
                                    ? 'bg-green-100 text-green-800'
                                    : payment.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {payment.status === 'completed' ? 'Completado' :
                                   payment.status === 'pending' ? 'Pendiente' : 'Fallido'}
                                </span>
                              </div>
                              
                              {payment.reference_number && (
                                <div className="text-xs text-gray-500">
                                  Ref: {payment.reference_number}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      
                      {payments.length > 5 && (
                        <div className="text-center pt-4">
                          <Button variant="outline" size="sm">
                            Ver todos los pagos ({payments.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Métodos de Pago */}
              <Card>
                <CardHeader>
                  <CardTitle>Métodos de Pago</CardTitle>
                  <CardDescription>
                    Configuración de métodos de pago disponibles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentMethodsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Cargando métodos...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                method.is_active ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {method.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {method.description}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                method.type === 'cash' 
                                  ? 'bg-green-100 text-green-800'
                                  : method.type === 'transfer'
                                  ? 'bg-blue-100 text-blue-800'
                                  : method.type === 'sinpe_movil'
                                  ? 'bg-purple-100 text-purple-800'
                                  : method.type === 'courtesy'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {method.type === 'cash' ? '💵 Efectivo' :
                                 method.type === 'transfer' ? '🏦 Transferencia' :
                                 method.type === 'sinpe_movil' ? '📱 Sinpe' :
                                 method.type === 'courtesy' ? '🎁 Cortesía' : method.type}
                              </span>
                              
                              <button 
                                className={`text-xs px-2 py-1 rounded ${
                                  method.is_active 
                                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                              >
                                {method.is_active ? 'Desactivar' : 'Activar'}
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-right text-sm text-gray-500 mt-2">
                            {/* Aquí podríamos mostrar estadísticas de uso del método */}
                            Usado en {payments.filter(p => p.payment_method_id === method.id).length} pagos
                          </div>
                        </div>
                      ))}
                      
                      <div className="text-center pt-4 border-t">
                        <Button variant="outline" size="sm" className="w-full">
                          + Agregar Método de Pago
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pedidos Pendientes de Pago */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Pedidos Pendientes de Pago</CardTitle>
                <CardDescription>
                  Pedidos que requieren seguimiento de pagos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const pendingOrders = orders.filter(order => 
                    order.payment_status === 'pending' || order.payment_status === 'partial'
                  )
                  
                  return pendingOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-4">✅</div>
                      <p className="text-gray-600 mb-2">¡Todos los pagos al día!</p>
                      <p className="text-sm text-gray-500">
                        No hay pedidos pendientes de pago
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Pedido
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Cliente
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Pagado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Pendiente
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {order.order_number}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(order.order_date).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {order.customer_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${order.total_amount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                ${(order.total_paid || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                ${(order.pending_amount || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  Registrar Pago
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </>
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