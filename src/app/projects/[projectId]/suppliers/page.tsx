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

interface ProjectSuppliersData {
  project: UserProject
}

interface Supplier {
  id: string
  project_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  contact_person?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PurchaseOrder {
  id: string
  project_id: string
  supplier_id: string
  order_number: string
  status: 'pending' | 'completed' | 'cancelled'
  order_date: string
  delivery_date?: string
  total_amount?: number
  currency?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface SupplierWithStats extends Supplier {
  total_orders?: number
  total_spent?: number
  last_order_date?: string
}

interface PurchaseOrderWithSupplier extends PurchaseOrder {
  supplier_name?: string
}

interface SupplierStats {
  totalSuppliers: number
  activeSuppliers: number
  inactiveSuppliers: number
  totalOrders: number
  pendingOrders: number
  totalSpent: number
}

export default function SuppliersPage({ params }: { params: { projectId: string } }) {
  const { user, isLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const projectSlug = params.projectId

  // Estados principales
  const [loading, setLoading] = useState(true)
  const [projectData, setProjectData] = useState<ProjectSuppliersData | null>(null)

  // Estados para estadísticas
  const [stats, setStats] = useState<SupplierStats>({
    totalSuppliers: 0,
    activeSuppliers: 0,
    inactiveSuppliers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0
  })

  // Estados para proveedores
  const [suppliers, setSuppliers] = useState<SupplierWithStats[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(false)

  // Estados para órdenes
  const [orders, setOrders] = useState<PurchaseOrderWithSupplier[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // Estados para filtros
  const [suppliersSearch, setSuppliersSearch] = useState('')
  const [suppliersStatus, setSuppliersStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [ordersSearch, setOrdersSearch] = useState('')
  const [ordersStatus, setOrdersStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all')

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
        await loadSuppliersData(project)
      } catch (error) {
        console.error('Error cargando proyecto:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadProjectData()
  }, [router, projectSlug, user, isLoading])



  const loadSuppliersData = async (project: UserProject) => {
    try {
      // Cargar estadísticas generales
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, is_active')
        .eq('project_id', project.project_id)

      const { data: ordersData, error: ordersError } = await supabase
        .from('purchase_orders')
        .select('id, status, total_amount')
        .eq('project_id', project.project_id)

      if (!suppliersError && !ordersError) {
        const totalSpent = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
        
        setStats({
          totalSuppliers: suppliersData?.length || 0,
          activeSuppliers: suppliersData?.filter(s => s.is_active).length || 0,
          inactiveSuppliers: suppliersData?.filter(s => !s.is_active).length || 0,
          totalOrders: ordersData?.length || 0,
          pendingOrders: ordersData?.filter(o => o.status === 'pending').length || 0,
          totalSpent
        })
      }

      // Cargar lista de proveedores
      await loadSuppliers(project.project_id)
      await loadOrders(project.project_id)

    } catch (error) {
      console.error('Error cargando datos de proveedores:', error)
    }
  }

  const loadSuppliers = async (projectId: string) => {
    setSuppliersLoading(true)
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true })

      if (error) throw error

      const suppliersWithStats = (data || []).map(supplier => ({
        ...supplier,
        total_orders: 0,
        total_spent: 0,
        last_order_date: null
      }))

      setSuppliers(suppliersWithStats)
    } catch (error) {
      console.error('Error cargando proveedores:', error)
    } finally {
      setSuppliersLoading(false)
    }
  }

  const loadOrders = async (projectId: string) => {
    setOrdersLoading(true)
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers!inner(name)
        `)
        .eq('project_id', projectId)
        .order('order_date', { ascending: false })

      if (error) throw error

      const ordersWithSupplier = data?.map(order => ({
        ...order,
        supplier_name: (order.suppliers as any)?.name
      })) || []

      setOrders(ordersWithSupplier)
    } catch (error) {
      console.error('Error cargando órdenes:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  // Funciones de filtrado
  const getFilteredSuppliers = () => {
    return suppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(suppliersSearch.toLowerCase()) ||
                          supplier.contact_person?.toLowerCase().includes(suppliersSearch.toLowerCase()) ||
                          supplier.email?.toLowerCase().includes(suppliersSearch.toLowerCase())
      const matchesStatus = suppliersStatus === 'all' || 
                          (suppliersStatus === 'active' ? supplier.is_active : !supplier.is_active)
      return matchesSearch && matchesStatus
    })
  }

  const getFilteredOrders = () => {
    return orders.filter(order => {
      const matchesSearch = order.order_number.toLowerCase().includes(ordersSearch.toLowerCase()) ||
                          order.supplier_name?.toLowerCase().includes(ordersSearch.toLowerCase())
      const matchesStatus = ordersStatus === 'all' || order.status === ordersStatus
      return matchesSearch && matchesStatus
    })
  }

  const toggleSupplierStatus = async (supplier: Supplier) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: !supplier.is_active })
        .eq('id', supplier.id)

      if (error) throw error

      setSuppliers(prev => prev.map(s => 
        s.id === supplier.id ? { ...s, is_active: !s.is_active } : s
      ))

      // Actualizar stats
      if (projectData) {
        await loadSuppliersData(projectData.project)
      }
    } catch (error) {
      console.error('Error actualizando estado:', error)
    }
  }

  if (loading) {
    return (
      <ProjectPageLayout
        projectData={null}
        loading={true}
        pageTitle="Gestión de Proveedores"
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
        pageTitle="Gestión de Proveedores"
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



  // Definir tabs como en orders
  const suppliersTabs = [
    {
      id: 'overview',
      label: 'Resumen de Proveedores',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* Estadísticas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  {stats.totalSuppliers}
                </div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Total Proveedores
                </div>
              </CardContent>
            </Card>
            
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {stats.activeSuppliers}
                </div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Activos
                </div>
              </CardContent>
            </Card>
            
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold" style={{ color: theme.colors.error }}>
                  {stats.inactiveSuppliers}
                </div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Inactivos
                </div>
              </CardContent>
            </Card>
            
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totalOrders}
                </div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Órdenes Totales
                </div>
              </CardContent>
            </Card>
            
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.pendingOrders}
                </div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Pendientes
                </div>
              </CardContent>
            </Card>
            
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-indigo-600">
                  ${stats.totalSpent.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Total Gastado
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>
                  Resumen de Proveedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.colors.textSecondary }}>Total de Proveedores</span>
                    <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                      {stats.totalSuppliers}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.colors.textSecondary }}>Proveedores Activos</span>
                    <span className="font-semibold text-green-600">
                      {stats.activeSuppliers}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.colors.textSecondary }}>Proveedores Inactivos</span>
                    <span className="font-semibold" style={{ color: theme.colors.error }}>
                      {stats.inactiveSuppliers}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>
                  Actividad de Compras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.colors.textSecondary }}>Total de Órdenes</span>
                    <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                      {stats.totalOrders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.colors.textSecondary }}>Órdenes Pendientes</span>
                    <span className="font-semibold text-yellow-600">
                      {stats.pendingOrders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: theme.colors.textSecondary }}>Total Gastado</span>
                    <span className="font-semibold text-blue-600">
                      ${stats.totalSpent.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Acciones Rápidas */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href={`/projects/${projectSlug}/suppliers/new`}>
                  <Button 
                    className="w-full" 
                    style={{ backgroundColor: theme.colors.primary, color: 'white' }}
                    onClick={() => console.log('Crear nuevo proveedor')}
                  >
                    + Nuevo Proveedor
                  </Button>
                </Link>
                <Link href={`/projects/${projectSlug}/suppliers/orders/new`}>
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    style={{ borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                    onClick={() => console.log('Crear nueva orden de compra')}
                  >
                    + Nueva Orden de Compra
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
      id: 'proveedores',
      label: 'Gestión de Proveedores',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>
                    Lista de Proveedores
                  </h3>
                  <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                    Gestiona todos tus proveedores
                  </p>
                </div>
                <Link href={`/projects/${projectSlug}/suppliers/new`}>
                  <Button style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                    + Nuevo Proveedor
                  </Button>
                </Link>
              </div>

              {/* Tabla de Proveedores usando ModernTable */}
              <ModernTable
                data={getFilteredSuppliers()}
                columns={[
                  { key: 'name', title: 'Proveedor', sortable: true },
                  { key: 'contact_person', title: 'Contacto', sortable: true, render: (value) => value || 'N/A' },
                  {
                    key: 'email',
                    title: 'Email/Teléfono',
                    sortable: false,
                    render: (value, row) => (
                      <div>
                        <div className="text-sm" style={{ color: theme.colors.textPrimary }}>
                          {value || 'N/A'}
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          {row.phone || 'N/A'}
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'is_active',
                    title: 'Estado',
                    render: (value) => (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        value 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {value ? 'Activo' : 'Inactivo'}
                      </span>
                    )
                  }
                ]}
                renderExpandedRow={(row) => (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.primary }}>Información de Contacto</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-gray-400">Contacto:</span> {row.contact_person || 'N/A'}</p>
                        <p><span className="text-gray-400">Email:</span> {row.email || 'N/A'}</p>
                        <p><span className="text-gray-400">Teléfono:</span> {row.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.success }}>Ubicación</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-gray-400">Dirección:</span> {row.address || 'N/A'}</p>
                        <p><span className="text-gray-400">Ciudad:</span> {row.city || 'N/A'}</p>
                        <p><span className="text-gray-400">País:</span> {row.country || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.warning }}>Acciones</h4>
                      <div className="space-y-2">
                        <Link href={`/projects/${projectSlug}/suppliers/${row.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver Detalles
                          </Button>
                        </Link>
                        <Link href={`/projects/${projectSlug}/suppliers/${row.id}/edit`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => toggleSupplierStatus(row)}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                          </svg>
                          {row.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                onEdit={(supplier) => router.push(`/projects/${projectSlug}/suppliers/${supplier.id}/edit`)}
                onDelete={(supplier) => console.log('Eliminar:', supplier)}
                onRefresh={() => console.log('Refrescar proveedores')}
              />
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'ordenes',
      label: 'Órdenes de Compra',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>
                    Órdenes de Compra
                  </h3>
                  <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                    Gestiona todas las órdenes de compra
                  </p>
                </div>
                <Link href={`/projects/${projectSlug}/suppliers/orders/new`}>
                  <Button style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                    + Nueva Orden
                  </Button>
                </Link>
              </div>

              {/* Tabla de Órdenes usando ModernTable */}
              <ModernTable
                data={getFilteredOrders()}
                columns={[
                  { key: 'order_number', title: 'Orden', sortable: true },
                  { key: 'supplier_name', title: 'Proveedor', sortable: true, render: (value) => value || 'N/A' },
                  {
                    key: 'order_date',
                    title: 'Fecha',
                    sortable: true,
                    render: (value) => new Date(value).toLocaleDateString()
                  },
                  {
                    key: 'total_amount',
                    title: 'Total',
                    sortable: true,
                    render: (value) => `$${value?.toLocaleString() || '0'}`
                  },
                  {
                    key: 'status',
                    title: 'Estado',
                    render: (value) => (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        value === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : value === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {value === 'pending' ? 'Pendiente' :
                         value === 'completed' ? 'Completado' : 'Cancelado'}
                      </span>
                    )
                  }
                ]}
                renderExpandedRow={(row) => (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.primary }}>Detalles de la Orden</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-gray-400">Número:</span> {row.order_number}</p>
                        <p><span className="text-gray-400">Fecha de orden:</span> {new Date(row.order_date).toLocaleDateString()}</p>
                        <p><span className="text-gray-400">Fecha de entrega:</span> {row.delivery_date ? new Date(row.delivery_date).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.success }}>Información Financiera</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-gray-400">Total:</span> ${row.total_amount?.toLocaleString() || '0'}</p>
                        <p><span className="text-gray-400">Moneda:</span> {row.currency || 'USD'}</p>
                        <p><span className="text-gray-400">Estado:</span> {row.status === 'pending' ? 'Pendiente' : row.status === 'completed' ? 'Completado' : 'Cancelado'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.warning }}>Acciones</h4>
                      <div className="space-y-2">
                        <Link href={`/projects/${projectSlug}/suppliers/orders/${row.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver Detalles
                          </Button>
                        </Link>
                        <Link href={`/projects/${projectSlug}/suppliers/orders/${row.id}/edit`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar Orden
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="w-full">
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                          Descargar PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                onEdit={(order) => router.push(`/projects/${projectSlug}/suppliers/orders/${order.id}/edit`)}
                onDelete={(order) => console.log('Eliminar:', order)}
                onRefresh={() => console.log('Refrescar órdenes')}
              />
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
                  Resumen de Proveedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Total de Proveedores</span>
                    <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                      {stats.totalSuppliers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Proveedores Activos</span>
                    <span className="font-semibold text-green-600">{stats.activeSuppliers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Proveedores Inactivos</span>
                    <span className="font-semibold" style={{ color: theme.colors.error }}>
                      {stats.inactiveSuppliers}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>
                  Resumen de Órdenes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Total de Órdenes</span>
                    <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                      {stats.totalOrders}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Órdenes Pendientes</span>
                    <span className="font-semibold text-yellow-600">{stats.pendingOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.textSecondary }}>Total Gastado</span>
                    <span className="font-semibold text-blue-600">
                      ${stats.totalSpent.toLocaleString()}
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
                <div className="text-4xl mb-4">📈</div>
                <p className="mb-2" style={{ color: theme.colors.textSecondary }}>
                  Análisis Avanzado
                </p>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Gráficos de tendencias, análisis de proveedores top,<br />
                  métricas de rendimiento y proyecciones
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
      pageTitle="Gestión de Proveedores"
    >
      <Tabs tabs={suppliersTabs} defaultTab="overview" />
    </ProjectPageLayout>
  )
}