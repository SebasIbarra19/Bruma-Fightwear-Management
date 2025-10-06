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

interface OrderWithDetails extends Order {
  items?: OrderItem[]
  payments?: (Payment & { payment_method_name?: string })[]
  total_paid?: number
  pending_amount?: number
}

export default function OrdersPage({ params }: { params: { projectId: string } }) {
  const { user, isLoading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const projectSlug = params.projectId
  
  const [projectData, setProjectData] = useState<ProjectOrdersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // El middleware maneja la autenticación automáticamente
  useEffect(() => {
    if ((user || !authLoading) && params.projectId) {
      loadProjectData()
    }
  }, [user, authLoading, params.projectId])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      
      // Verificar autenticación
      if (!user) {
        router.push('/auth/login')
        return
      }

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
        
        // Cargar datos simulados de pedidos
        await loadOrdersData(project)
        
      } catch (error) {
        console.error('Error loading projects:', error)
        // Usar datos mock como fallback
        setProjectData({ 
          project: { 
            project_id: params.projectId, 
            project_name: "BRUMA Fightwear", 
            project_slug: "bruma-fightwear",
            project_type: "ecommerce"
          } 
        })
        
        // Cargar datos mock
        await loadOrdersData({ 
          project_id: params.projectId, 
          project_name: "BRUMA Fightwear", 
          project_slug: "bruma-fightwear",
          project_type: "ecommerce"
        })
      }
      
    } catch (error) {
      console.error('Error loading project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrdersData = async (project: UserProject) => {
    try {
      setOrdersLoading(true)
      
      // Mock data para demostración - cuando tengas las tablas reales, esto se reemplazará con queries reales
      const mockOrders: OrderWithDetails[] = [
        {
          id: '1',
          project_id: project.project_id,
          customer_id: 'cust1',
          order_number: 'ORD-2024-001',
          status: 'processing',
          order_date: '2024-09-20',
          subtotal: 280000,
          tax_amount: 44800,
          shipping_cost: 12000,
          total_amount: 336800,
          currency: 'COP',
          payment_status: 'partial',
          customer_name: 'Juan Carlos Pérez',
          created_at: '2024-09-20T10:30:00Z',
          updated_at: '2024-09-20T10:30:00Z',
          items: [
            {
              id: 'item1',
              order_id: '1',
              product_id: 'prod1',
              product_name: 'Guantes de Boxeo BRUMA Pro',
              variant_description: 'Talla L, Color Negro',
              sku: 'GBX-BRUMA-PRO-L-BLK',
              quantity: 2,
              unit_price: 85000,
              total_price: 170000,
              created_at: '2024-09-20T10:30:00Z',
              updated_at: '2024-09-20T10:30:00Z'
            },
            {
              id: 'item2',
              order_id: '1',
              product_id: 'prod2',
              product_name: 'Shorts MMA BRUMA Elite',
              variant_description: 'Talla M, Color Azul',
              sku: 'SHT-BRUMA-ELT-M-BLU',
              quantity: 1,
              unit_price: 110000,
              total_price: 110000,
              created_at: '2024-09-20T10:30:00Z',
              updated_at: '2024-09-20T10:30:00Z'
            }
          ],
          payments: [
            {
              id: 'payment1',
              project_id: project.project_id,
              order_id: '1',
              payment_method_id: 'pm1',
              amount: 200000,
              currency: 'COP',
              payment_date: '2024-09-20',
              reference_number: 'SINPE-20240920-001',
              status: 'completed',
              payment_method_name: 'SINPE Móvil',
              created_at: '2024-09-20T10:30:00Z',
              updated_at: '2024-09-20T10:30:00Z'
            }
          ],
          total_paid: 200000,
          pending_amount: 136800
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
        // Agregar más orders...
        {
          id: '3',
          project_id: project.project_id,
          customer_id: 'cust3',
          order_number: 'ORD-2024-003',
          status: 'shipped',
          order_date: '2024-09-22',
          delivery_date: '2024-09-25',
          subtotal: 450000,
          tax_amount: 72000,
          shipping_cost: 15000,
          total_amount: 537000,
          currency: 'COP',
          payment_status: 'paid',
          customer_name: 'Academia Guerreros',
          created_at: '2024-09-22T09:15:00Z',
          updated_at: '2024-09-22T09:15:00Z',
          items: [
            {
              id: 'item4',
              order_id: '3',
              product_id: 'prod4',
              product_name: 'Kit Completo MMA BRUMA',
              variant_description: 'Talla L, Kit Profesional',
              sku: 'KIT-BRUMA-MMA-L-PRO',
              quantity: 1,
              unit_price: 450000,
              total_price: 450000,
              created_at: '2024-09-22T09:15:00Z',
              updated_at: '2024-09-22T09:15:00Z'
            }
          ],
          payments: [
            {
              id: 'payment2',
              project_id: project.project_id,
              order_id: '3',
              payment_method_id: 'pm3',
              amount: 537000,
              currency: 'COP',
              payment_date: '2024-09-22',
              reference_number: 'CARD-20240922-001',
              status: 'completed',
              payment_method_name: 'Tarjeta de Crédito',
              created_at: '2024-09-22T09:15:00Z',
              updated_at: '2024-09-22T09:15:00Z'
            }
          ],
          total_paid: 537000,
          pending_amount: 0
        }
      ]

      setOrders(mockOrders)
      
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const filteredOrders = () => {
    return orders.filter(order => 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleEdit = (order: OrderWithDetails) => {
    router.push(`/projects/${projectSlug}/orders/${order.id}/edit`)
  }

  const handleDelete = (order: OrderWithDetails) => {
    console.log('Eliminar pedido:', order.id)
  }

  const handleRefresh = () => {
    if (projectData?.project) {
      loadOrdersData(projectData.project)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      'confirmed': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmado' },
      'processing': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Procesando' },
      'shipped': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Enviado' },
      'delivered': { bg: 'bg-green-100', text: 'text-green-800', label: 'Entregado' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      'paid': { bg: 'bg-green-100', text: 'text-green-800', label: 'Pagado' },
      'partial': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Parcial' },
      'failed': { bg: 'bg-red-100', text: 'text-red-800', label: 'Fallido' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
          <p style={{ color: theme.colors.textSecondary }}>Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <p style={{ color: theme.colors.textSecondary }} className="mb-4">Error al cargar el proyecto</p>
          <Button onClick={() => router.push('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const ordersTabs = [
    {
      id: 'resumen',
      label: 'Resumen de Pedidos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* KPIs de Pedidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Total Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  {orders.length}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>Este mes</p>
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
                  {orders.filter(o => o.status === 'pending').length}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>Requieren atención</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Valor Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.success }}>
                  ${orders.reduce((sum, order) => sum + order.total_amount, 0).toLocaleString()}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>En pedidos activos</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Pedidos Entregados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  {orders.filter(o => o.status === 'delivered').length}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>Completados</p>
              </CardContent>
            </Card>
          </div>

          {/* Pedidos Recientes */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>Pedidos Recientes</CardTitle>
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
                           style={{ backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, border: `1px solid ${theme.colors.border}` }}>
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
          {/* ESTRUCTURA PERFECTA - Como Control de Stock */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                  Lista de Pedidos
                </h3>
                <p style={{ color: theme.colors.textSecondary }}>
                  Gestiona todos los pedidos de ventas
                </p>
              </div>
              <Button 
                className="shadow-lg"
                onClick={() => router.push(`/projects/${projectSlug}/orders/new`)}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                  border: 'none'
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Pedido
              </Button>
            </div>

            {/* Orders Table */}
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
                    render: (value, row) => (
                      <div>
                        <div className="font-medium" style={{ color: theme.colors.primary }}>
                          {row.items?.length || 0} productos
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          {row.items?.[0]?.product_name && `${row.items[0].product_name}${row.items?.length > 1 ? '...' : ''}`}
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
                  },
                  {
                    key: 'total_amount',
                    title: 'Total',
                    sortable: true,
                    render: (value) => (
                      <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                        ${value.toLocaleString()}
                      </div>
                    )
                  }
                ]}
                renderExpandedRow={(row) => (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                    {/* Información del Pedido */}
                    <div>
                      <h4 className="font-semibold mb-3" style={{ color: theme.colors.primary }}>Información del Pedido</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">N° Pedido:</span>
                          <span style={{ color: theme.colors.textPrimary }}>{row.order_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cliente:</span>
                          <span style={{ color: theme.colors.textPrimary }}>{row.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fecha:</span>
                          <span style={{ color: theme.colors.textPrimary }}>{new Date(row.order_date).toLocaleDateString()}</span>
                        </div>
                        {row.delivery_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Entrega:</span>
                            <span style={{ color: theme.colors.textPrimary }}>{new Date(row.delivery_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Estado:</span>
                          {getStatusBadge(row.status)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Pago:</span>
                          {getPaymentStatusBadge(row.payment_status)}
                        </div>
                      </div>

                      {/* Resumen Financiero */}
                      <div className="mt-4 pt-3 border-t" style={{ borderColor: theme.colors.border }}>
                        <h5 className="font-medium mb-2" style={{ color: theme.colors.textPrimary }}>Resumen Financiero</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Subtotal:</span>
                            <span style={{ color: theme.colors.textPrimary }}>${row.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Impuestos:</span>
                            <span style={{ color: theme.colors.textPrimary }}>${row.tax_amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Envío:</span>
                            <span style={{ color: theme.colors.textPrimary }}>${row.shipping_cost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-medium pt-1 border-t" style={{ borderColor: theme.colors.border }}>
                            <span style={{ color: theme.colors.textPrimary }}>Total:</span>
                            <span style={{ color: theme.colors.success }}>${row.total_amount.toLocaleString()}</span>
                          </div>
                          {row.total_paid && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Pagado:</span>
                                <span style={{ color: theme.colors.success }}>${row.total_paid.toLocaleString()}</span>
                              </div>
                              {row.pending_amount && row.pending_amount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Pendiente:</span>
                                  <span style={{ color: theme.colors.warning }}>${row.pending_amount.toLocaleString()}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Items del Pedido y Acciones */}
                    <div>
                      <h4 className="font-semibold mb-3" style={{ color: theme.colors.success }}>Productos del Pedido</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {row.items?.map((item, index) => (
                          <div key={index} className="flex justify-between items-start p-2 rounded" style={{ backgroundColor: theme.colors.surface }}>
                            <div className="flex-1">
                              <div className="font-medium text-sm" style={{ color: theme.colors.textPrimary }}>
                                {item.product_name}
                              </div>
                              {item.variant_description && (
                                <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                                  {item.variant_description}
                                </div>
                              )}
                              <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                                SKU: {item.sku}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                {item.quantity}x ${item.unit_price.toLocaleString()}
                              </div>
                              <div className="text-xs font-medium" style={{ color: theme.colors.success }}>
                                ${item.total_price.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Acciones */}
                      <div className="mt-4 pt-3 border-t" style={{ borderColor: theme.colors.border }}>
                        <h5 className="font-medium mb-3" style={{ color: theme.colors.warning }}>Acciones</h5>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar Pedido
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H9.414a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 005.586 6H4a2 2 0 00-2 2v4a2 2 0 002 2h2m3 4h6m-6 0V9a2 2 0 012-2h4a2 2 0 012 2v8a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
                            </svg>
                            Imprimir Factura
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Gestionar Pagos
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={handleRefresh}
              />
            )}
          </div>
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
          {/* Resumen de Facturación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Total Facturado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.success }}>
                  ${orders.reduce((sum, order) => sum + (order.total_paid || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>Pagos completados</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Pagos Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.warning }}>
                  ${orders.reduce((sum, order) => sum + (order.pending_amount || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.warning }}>Por cobrar</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Facturas Generadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  {orders.filter(o => o.payment_status !== 'pending').length}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>Este mes</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Pagos */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>Historial de Pagos</CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Todos los pagos recibidos y pendientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.flatMap(order => 
                  order.payments?.map(payment => ({
                    ...payment,
                    order_number: order.order_number,
                    customer_name: order.customer_name
                  })) || []
                ).map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border"
                       style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                           style={{ backgroundColor: theme.colors.success + '20', color: theme.colors.success }}>
                        $
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                          {payment.order_number}
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          {payment.customer_name} • {payment.payment_method_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium" style={{ color: theme.colors.success }}>
                        ${payment.amount.toLocaleString()}
                      </div>
                      <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
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
      pageTitle="Gestión de Pedidos"
    >
      <div className="p-6">
        <Tabs tabs={ordersTabs} />
      </div>
    </ProjectPageLayout>
  )
}