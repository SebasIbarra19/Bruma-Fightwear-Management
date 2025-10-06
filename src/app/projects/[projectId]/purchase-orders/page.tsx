'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ModernTable } from '@/components/ui/modern-table'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'

interface UserProject {
  project_id: string
  project_name: string
  project_slug: string
  project_type: string
}

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
  const { theme } = useTheme()
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

      // Mock project data
      setProject({
        project_id: projectSlug,
        project_name: "BRUMA Fightwear",
        project_slug: projectSlug,
        project_type: "ecommerce"
      })

      await loadPurchaseOrdersData(projectSlug)
      await loadSuppliersData(projectSlug)
      
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadPurchaseOrdersData = async (projectId: string) => {
    try {
      // Mock data
      const orderData: PurchaseOrderPhase2[] = [
        {
          id: "1",
          project_id: projectId,
          supplier_id: "1",
          order_number: "PO-2024-001",
          status: "received",
          order_date: "2024-01-15T10:00:00Z",
          expected_date: "2024-01-25T10:00:00Z",
          received_date: "2024-01-24T10:00:00Z",
          subtotal: 4500.00,
          tax_amount: 450.00,
          shipping_cost: 100.00,
          total_amount: 5050.00,
          currency: "USD",
          payment_terms: "Net 30",
          notes: "Pedido urgente para restock",
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-24T10:00:00Z",
          suppliers: {
            id: "1",
            name: "Textiles MMA Pro",
            contact_person: "Carlos Rodriguez",
            email: "ventas@mmapro.com"
          }
        },
        {
          id: "2",
          project_id: projectId,
          supplier_id: "2",
          order_number: "PO-2024-002",
          status: "pending",
          order_date: "2024-02-01T10:00:00Z",
          expected_date: "2024-02-15T10:00:00Z",
          received_date: null,
          subtotal: 3200.00,
          tax_amount: 320.00,
          shipping_cost: 80.00,
          total_amount: 3600.00,
          currency: "USD",
          payment_terms: "Net 15",
          notes: null,
          created_at: "2024-02-01T10:00:00Z",
          updated_at: "2024-02-01T10:00:00Z",
          suppliers: {
            id: "2",
            name: "Leather Goods Co.",
            contact_person: "Maria Santos",
            email: "info@leathergoods.com"
          }
        }
      ]

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
      // Mock suppliers
      setSuppliers([
        { id: "1", name: "Textiles MMA Pro" },
        { id: "2", name: "Leather Goods Co." }
      ])
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

  const handleEdit = (order: PurchaseOrderPhase2) => {
    router.push(`/projects/${projectSlug}/purchase-orders/${order.id}/edit`)
  }

  const handleDelete = (order: PurchaseOrderPhase2) => {
    console.log('Eliminar orden:', order.id)
  }

  const handleRefresh = () => {
    if (project) {
      loadPurchaseOrdersData(project.project_id)
    }
  }

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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

        {/* ESTRUCTURA PERFECTA - Como Control de Stock */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                Órdenes de Compra
              </h3>
              <p style={{ color: theme.colors.textSecondary }}>
                Gestiona todas las órdenes de compra
              </p>
            </div>
          </div>

          {/* Lista de órdenes de compra */}
          <ModernTable
            data={filteredOrders}
            columns={[
              {
                key: 'order_number',
                title: 'N° Orden',
                sortable: true,
                render: (value, row) => (
                  <div>
                    <div className="font-medium">{value || `PO-${row.id.slice(0, 8)}`}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(row.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )
              },
              {
                key: 'suppliers',
                title: 'Proveedor',
                sortable: true,
                render: (value, row) => (
                  <div>
                    <div className="font-medium">{value?.name || 'Sin proveedor'}</div>
                    {value?.contact_person && (
                      <div className="text-sm text-gray-500">{value.contact_person}</div>
                    )}
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
                key: 'expected_date',
                title: 'Fecha Esperada',
                sortable: true,
                render: (value) => (
                  <div className="text-sm">
                    {value ? new Date(value).toLocaleDateString() : 'No definida'}
                  </div>
                )
              },
              {
                key: 'total_amount',
                title: 'Total',
                sortable: true,
                render: (value) => (
                  <div className="font-medium text-green-600">
                    {formatCurrency(value)}
                  </div>
                )
              }
            ]}
            renderExpandedRow={(row) => (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
                <div>
                  <h4 className="font-semibold mb-2">Detalles de la Orden</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">N° Orden:</span> {row.order_number}</p>
                    <p><span className="text-gray-500">Estado:</span> {getStatusBadge(row.status)}</p>
                    <p><span className="text-gray-500">Fecha de Orden:</span> {row.order_date ? new Date(row.order_date).toLocaleDateString() : 'No definida'}</p>
                    <p><span className="text-gray-500">Fecha Esperada:</span> {row.expected_date ? new Date(row.expected_date).toLocaleDateString() : 'No definida'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Proveedor</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Nombre:</span> {row.suppliers?.name || 'No asignado'}</p>
                    <p><span className="text-gray-500">Contacto:</span> {row.suppliers?.contact_person || 'No especificado'}</p>
                    <p><span className="text-gray-500">Email:</span> {row.suppliers?.email || 'No disponible'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Montos</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Subtotal:</span> {formatCurrency(row.subtotal)}</p>
                    <p><span className="text-gray-500">Impuestos:</span> {formatCurrency(row.tax_amount)}</p>
                    <p><span className="text-gray-500">Envío:</span> {formatCurrency(row.shipping_cost)}</p>
                    <p><span className="text-gray-500 font-bold">Total:</span> <span className="font-bold text-green-600">{formatCurrency(row.total_amount)}</span></p>
                  </div>
                </div>
                <div className="md:col-span-3">
                  <div className="flex gap-2 pt-4">
                    <Link
                      href={`/projects/${projectSlug}/purchase-orders/${row.id}`}
                      className="block px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      Ver Detalles
                    </Link>
                    <Link
                      href={`/projects/${projectSlug}/purchase-orders/${row.id}/edit`}
                      className="block px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      Editar Orden
                    </Link>
                  </div>
                </div>
              </div>
            )}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
          />
        </div>
        
      </div>
    </div>
  )
}