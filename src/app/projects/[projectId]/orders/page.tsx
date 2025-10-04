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
import { ModernTable } from '@/components/ui/modern-table'
import Link from 'next/link'

interface UserProject {
  project_id: string
  project_name: string
  project_slug: string
  project_type: string
}

interface ProjectOrdersData {
  project: UserProject
}

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
  variant_description?: string
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

export default function ModernOrdersPage({ params }: { params: { projectId: string } }) {
  const { user, isLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const projectSlug = params.projectId
  
  const [projectData, setProjectData] = useState<ProjectOrdersData | null>(null)
  const [loading, setLoading] = useState(true)

  // Estados para datos de orders
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

  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [payments, setPayments] = useState<Payment[]>([])



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
        await loadOrdersData(project)
      } catch (error) {
        console.error('Error cargando proyecto:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadProjectData()
  }, [router, projectSlug, user, isLoading])

  const loadOrdersData = async (project: UserProject) => {
    try {
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

      // Mock orders data
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

      // Mock payment methods
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

      setOrders(mockOrders)
      setPaymentMethods(mockPaymentMethods)

      // Extract payments from orders
      const allPayments: Payment[] = []
      mockOrders.forEach(order => {
        if (order.payments) {
          allPayments.push(...order.payments)
        }
      })
      setPayments(allPayments)

    } catch (error) {
      console.error('Error cargando datos de pedidos:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Funciones de filtrado


  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmado' },
      processing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Procesando' },
      shipped: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Enviado' },
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

  const getPaymentStatusBadge = (status: Order['payment_status']) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Pagado' },
      partial: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Parcial' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Fallido' }
    }

    const config = statusConfig[status]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }



  const ordersTabs = [
    {
      id: 'overview',
      label: 'Resumen de Pedidos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Total Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  {stats.totalOrders}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>
                  Todos los pedidos
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Pedidos Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.warning }}>
                  {stats.pendingOrders}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                  Requieren atención
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Ingresos Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.success }}>
                  ${stats.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                  COP en ventas
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Valor Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  ${stats.averageOrderValue.toLocaleString()}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                  Por pedido
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>
                Pedidos Recientes
              </CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Últimos pedidos registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background + '50' }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                           style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}>
                        {order.order_number.slice(-2)}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                          {order.order_number}
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          {order.customer_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(order.status)}
                      <div className="text-right">
                        <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                          ${order.total_amount.toLocaleString()}
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          {new Date(order.order_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'pedidos',
      label: 'Gestión de Pedidos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">


          {/* Orders Table */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>
                    Lista de Pedidos
                  </h3>
                  <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                    Gestiona todos los pedidos de ventas
                  </p>
                </div>
                <Link href={`/projects/${projectSlug}/orders/new`}>
                  <Button style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                    + Nuevo Pedido
                  </Button>
                </Link>
              </div>
              {ordersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" 
                       style={{ borderColor: theme.colors.primary }}></div>
                  <p style={{ color: theme.colors.textSecondary }}>Cargando pedidos...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📦</div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                    No se encontraron pedidos
                  </h3>
                  <p style={{ color: theme.colors.textSecondary }}>
                    Los pedidos aparecerán aquí cuando se registren
                  </p>
                </div>
              ) : (
                <ModernTable
                  data={orders}
                  columns={[
                    {
                      key: 'order_number',
                      title: 'Pedido',
                      sortable: true,
                      render: (value, row) => (
                        <div>
                          <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                            {value}
                          </div>
                          <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            {new Date(row.order_date).toLocaleDateString()}
                          </div>
                        </div>
                      )
                    },
                    {
                      key: 'customer_name',
                      title: 'Cliente',
                      sortable: true,
                      render: (value) => (
                        <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                          {value}
                        </div>
                      )
                    },
                    {
                      key: 'items',
                      title: 'Items',
                      sortable: false,
                      render: (value) => (
                        <div className="text-sm" style={{ color: theme.colors.textPrimary }}>
                          {value?.length || 0} productos
                        </div>
                      )
                    },
                    {
                      key: 'total_amount',
                      title: 'Total',
                      sortable: true,
                      render: (value, row) => (
                        <div>
                          <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                            ${value.toLocaleString()}
                          </div>
                          <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            {row.currency}
                          </div>
                        </div>
                      )
                    },
                    {
                      key: 'status',
                      title: 'Estado',
                      sortable: true,
                      render: (value) => getStatusBadge(value)
                    },
                    {
                      key: 'payment_status',
                      title: 'Pago',
                      sortable: true,
                      render: (value) => getPaymentStatusBadge(value)
                    }
                  ]}
                  renderExpandedRow={(order) => (
                    <div className="space-y-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      {/* Primera fila: Información del pedido, Detalles financieros y Acciones */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme.colors.primary }}>Información del Pedido</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-gray-400">Número:</span> {order.order_number}</p>
                            <p><span className="text-gray-400">Fecha:</span> {new Date(order.order_date).toLocaleString()}</p>
                            <p><span className="text-gray-400">Cliente:</span> {order.customer_name}</p>
                            <p><span className="text-gray-400">Items:</span> {order.items?.length || 0} productos</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme.colors.success }}>Detalles Financieros</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-gray-400">Total:</span> ${order.total_amount.toLocaleString()}</p>
                            <p><span className="text-gray-400">Moneda:</span> {order.currency}</p>
                            <p><span className="text-gray-400">Estado Pago:</span> {getPaymentStatusBadge(order.payment_status)}</p>
                            <p><span className="text-gray-400">Estado:</span> {getStatusBadge(order.status)}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: theme.colors.warning }}>Acciones</h4>
                          <div className="space-y-2">
                            <Button variant="outline" size="sm" className="w-full">
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Ver Detalles
                            </Button>
                            <Button variant="outline" size="sm" className="w-full">
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editar Pedido
                            </Button>
                            <Button variant="outline" size="sm" className="w-full">
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H9.5a2 2 0 01-2-2V5a2 2 0 00-2-2H3a2 2 0 00-2 2v4a2 2 0 002 2h2.5a2 2 0 012 2v2a2 2 0 002 2z" />
                              </svg>
                              Cambiar Estado
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Segunda fila: Productos del pedido */}
                      <div>
                        <h4 className="font-semibold mb-3" style={{ color: theme.colors.primary }}>
                          📦 Productos del Pedido ({order.items?.length || 0})
                        </h4>
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-3">
                            {order.items.map((item, index) => (
                              <div 
                                key={item.id || index}
                                className="flex items-center justify-between p-3 rounded-lg border"
                                style={{ 
                                  borderColor: theme.colors.border,
                                  backgroundColor: theme.colors.surface 
                                }}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                         style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}>
                                      🏷️
                                    </div>
                                    <div>
                                      <h5 className="font-medium" style={{ color: theme.colors.textPrimary }}>
                                        {item.product_name}
                                      </h5>
                                      {item.variant_description && (
                                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                                          {item.variant_description}
                                        </p>
                                      )}
                                      <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                                        SKU: {item.sku}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                                    {item.quantity} x ${item.unit_price.toLocaleString()}
                                  </div>
                                  <div className="text-sm font-semibold" style={{ color: theme.colors.success }}>
                                    Total: ${item.total_price.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {/* Resumen total */}
                            <div 
                              className="flex justify-between items-center p-3 rounded-lg border-2"
                              style={{ 
                                borderColor: theme.colors.primary,
                                backgroundColor: theme.colors.primary + '10'
                              }}
                            >
                              <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                                Total del Pedido:
                              </span>
                              <span className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                                ${order.total_amount.toLocaleString()} {order.currency}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6" style={{ color: theme.colors.textSecondary }}>
                            <div className="text-3xl mb-2">📦</div>
                            <p>No hay productos asociados a este pedido</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  onEdit={(order) => console.log('Editar pedido:', order)}
                  onDelete={(order) => console.log('Eliminar pedido:', order)}
                  onRefresh={() => {
                    if (projectData?.project) {
                      loadOrdersData(projectData.project)
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'facturacion',
      label: 'Facturación y Pagos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* Payment Methods */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>
                Métodos de Pago
              </CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Métodos de pago disponibles para los pedidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id}
                    className="p-4 rounded-lg border"
                    style={{ 
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.background + '50'
                    }}
                  >
                    <div className="font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                      {method.name}
                    </div>
                    <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      {method.description}
                    </div>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                      method.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {method.is_active ? 'Activo' : 'Inactivo'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>
                Pagos Recientes
              </CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Últimos pagos registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">💳</div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                    No hay pagos registrados
                  </h3>
                  <p style={{ color: theme.colors.textSecondary }}>
                    Los pagos aparecerán aquí cuando se registren
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.slice(0, 10).map((payment) => {
                    const order = orders.find(o => o.id === payment.order_id)
                    return (
                      <div 
                        key={payment.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                        style={{ 
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.background + '50'
                        }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            💳
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                              {order?.order_number || 'Pedido desconocido'}
                            </div>
                            <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                              {payment.payment_method_name} • {order?.customer_name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            ${payment.amount.toLocaleString()}
                          </div>
                          <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>
                  Resumen de Ventas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Total de Pedidos</span>
                    <span className="font-medium" style={{ color: theme.colors.textPrimary }}>
                      {stats.totalOrders}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Ingresos Totales</span>
                    <span className="font-medium" style={{ color: theme.colors.success }}>
                      ${stats.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Valor Promedio</span>
                    <span className="font-medium" style={{ color: theme.colors.primary }}>
                      ${stats.averageOrderValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Clientes Activos</span>
                    <span className="font-medium" style={{ color: theme.colors.textPrimary }}>
                      {stats.activeCustomers}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>
                  Estado de Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Pendientes</span>
                    <span className="font-medium" style={{ color: theme.colors.warning }}>
                      {stats.pendingOrders}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Confirmados</span>
                    <span className="font-medium" style={{ color: theme.colors.primary }}>
                      {stats.confirmedOrders}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Enviados</span>
                    <span className="font-medium" style={{ color: theme.colors.success }}>
                      {stats.shippedOrders}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Placeholder */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>
                Tendencias de Ventas
              </CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Gráficos y análisis detallados próximamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📈</div>
                <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                  Gráficos en Desarrollo
                </h3>
                <p style={{ color: theme.colors.textSecondary }}>
                  Los gráficos de tendencias y análisis detallados estarán disponibles próximamente
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ]

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
               style={{ borderColor: theme.colors.primary }}></div>
          <p style={{ color: theme.colors.textSecondary }}>Cargando pedidos...</p>
        </div>
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <p className="text-red-600">Proyecto no encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <ProjectPageLayout
      projectData={projectData}
      loading={loading}
      pageTitle="Gestión de Pedidos"
    >
      <Tabs tabs={ordersTabs} defaultTab="overview" />
    </ProjectPageLayout>
  )
}