'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject } from '@/types/database'

// Tipos específicos para purchase_orders de Phase 2
interface PurchaseOrderPhase2 {
  id: string
  project_id: string
  supplier_id: string
  order_number: string | null
  status: 'draft' | 'pending' | 'ordered' | 'partial' | 'received' | 'cancelled'
  order_date: string | null
  expected_date: string | null
  received_date: string | null
  subtotal: number
  tax_amount: number
  shipping_cost: number
  total_amount: number
  currency: string
  payment_terms: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Relación con suppliers
  suppliers?: {
    id: string
    name: string
    contact_person?: string
    email?: string
  } | null
}

export default function ProjectPurchaseOrdersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderPhase2[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    ordered: 0,
    received: 0,
    totalValue: 0
  })

  const router = useRouter()
  const params = useParams()
  const projectSlug = params.projectId as string

  useEffect(() => {
    loadProjectAndAuth()
  }, [])

  const loadProjectAndAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)

      // Obtener proyectos del usuario
      const { data: userProjects, error } = await supabase
        .rpc('get_user_projects', { user_uuid: session.user.id })

      if (error) {
        console.error('Error obteniendo proyectos:', error)
        router.push('/dashboard')
        return
      }

      const currentProject = userProjects?.find((p: UserProject) => p.project_slug === projectSlug)
      
      if (!currentProject) {
        console.error('Proyecto no encontrado o sin acceso')
        router.push('/dashboard')
        return
      }

      setProject(currentProject)
      await loadPurchaseOrdersData(currentProject.project_id)
      await loadSuppliersData(currentProject.project_id)
      
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadPurchaseOrdersData = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_person,
            email
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading purchase orders:', error)
        return
      }

      const orderData = (data as PurchaseOrderPhase2[]) || []
      setPurchaseOrders(orderData)

      // Calcular estadísticas
      const total = orderData.length
      const draft = orderData.filter(order => order.status === 'draft').length
      const pending = orderData.filter(order => order.status === 'pending').length
      const ordered = orderData.filter(order => order.status === 'ordered').length
      const received = orderData.filter(order => order.status === 'received').length
      const totalValue = orderData.reduce((sum, order) => sum + order.total_amount, 0)

      setStats({
        total,
        draft,
        pending,
        ordered,
        received,
        totalValue
      })

    } catch (error) {
      console.error('Error:', error)
    }
  }

  const loadSuppliersData = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error loading suppliers:', error)
        return
      }

      setSuppliers(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Filtrar órdenes de compra
  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSupplier = selectedSupplier === 'all' || order.supplier_id === selectedSupplier
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    
    // Filtro por fecha (último mes, últimos 3 meses, etc.)
    let matchesDate = true
    if (selectedDateRange !== 'all' && order.created_at) {
      const orderDate = new Date(order.created_at)
      const now = new Date()
      
      switch (selectedDateRange) {
        case 'week':
          matchesDate = (now.getTime() - orderDate.getTime()) <= (7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          matchesDate = (now.getTime() - orderDate.getTime()) <= (30 * 24 * 60 * 60 * 1000)
          break
        case '3months':
          matchesDate = (now.getTime() - orderDate.getTime()) <= (90 * 24 * 60 * 60 * 1000)
          break
      }
    }

    return matchesSearch && matchesSupplier && matchesStatus && matchesDate
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Borrador' },
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      'ordered': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Ordenado' },
      'partial': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Parcial' },
      'received': { bg: 'bg-green-100', text: 'text-green-800', label: 'Recibido' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando órdenes de compra...</p>
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
            <span className="text-gray-900">Órdenes de Compra</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/images/bruma/logo-circle.svg" 
                alt="BRUMA Fightwear" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Órdenes de Compra</h1>
                <p className="text-gray-600 mt-2">
                  Gestión de pedidos a proveedores de {project.project_name}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link href={`/projects/${projectSlug}/purchase-orders/new`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  + Nueva Orden
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Órdenes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              <div className="text-sm text-gray-600">Borrador</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.ordered}</div>
              <div className="text-sm text-gray-600">Ordenadas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{stats.received}</div>
              <div className="text-sm text-gray-600">Recibidas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalValue)}</div>
              <div className="text-sm text-gray-600">Valor Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Buscar por número de orden, proveedor o notas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className=""
                  />
                </div>
              </div>

              {/* Filtro por proveedor */}
              <div className="min-w-[200px]">
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los proveedores</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por estado */}
              <div className="min-w-[150px]">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="draft">Borrador</option>
                  <option value="pending">Pendiente</option>
                  <option value="ordered">Ordenado</option>
                  <option value="partial">Parcial</option>
                  <option value="received">Recibido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {/* Filtro por fecha */}
              <div className="min-w-[150px]">
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las fechas</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mes</option>
                  <option value="3months">Últimos 3 meses</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de órdenes de compra */}
        <Card>
          <CardHeader>
            <CardTitle>Órdenes de Compra ({filteredOrders.length})</CardTitle>
            <CardDescription>
              Lista de todas las órdenes de compra
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">📋</div>
                <p className="text-gray-600">No se encontraron órdenes de compra</p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchTerm || selectedSupplier !== 'all' || selectedStatus !== 'all' 
                    ? 'Intenta ajustar los filtros'
                    : 'Crea tu primera orden de compra'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-900">N° Orden</th>
                      <th className="text-left p-3 font-medium text-gray-900">Proveedor</th>
                      <th className="text-left p-3 font-medium text-gray-900">Fecha</th>
                      <th className="text-left p-3 font-medium text-gray-900">Estado</th>
                      <th className="text-left p-3 font-medium text-gray-900">Total</th>
                      <th className="text-left p-3 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {order.order_number || `PO-${order.id.slice(0, 8)}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {order.suppliers?.name || 'Sin proveedor'}
                            </div>
                            {order.suppliers?.contact_person && (
                              <div className="text-sm text-gray-500">
                                {order.suppliers.contact_person}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            {order.order_date && (
                              <div className="text-sm text-gray-900">
                                {new Date(order.order_date).toLocaleDateString()}
                              </div>
                            )}
                            {order.expected_date && (
                              <div className="text-sm text-gray-500">
                                Esperado: {new Date(order.expected_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.currency}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Link 
                              href={`/projects/${projectSlug}/purchase-orders/${order.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Ver
                            </Link>
                            <Link 
                              href={`/projects/${projectSlug}/purchase-orders/${order.id}/edit`}
                              className="text-green-600 hover:text-green-800 text-sm"
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
    </div>
  )
}