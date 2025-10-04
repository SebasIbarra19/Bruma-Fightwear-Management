'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { SmartLogoNavbar } from '@/components/common/SmartLogo'
import { ThemeSelector } from '@/components/ui/theme-selector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ModernSidebar } from '@/components/ui/modern-sidebar'
import { Tabs } from '@/components/ui/tabs'
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

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
      <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.background }}>
        <ModernSidebar 
          items={[]}
          projectName="Cargando..."
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" 
                 style={{ borderColor: theme.colors.primary }}></div>
            <p className="mt-4" style={{ color: theme.colors.textSecondary }}>
              Cargando proveedores...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.background }}>
        <ModernSidebar 
          items={[]}
          projectName="Error"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p style={{ color: theme.colors.error }}>Proyecto no encontrado</p>
          </div>
        </div>
      </div>
    )
  }

  const sidebarItems = [
    {
      id: 'analytics',
      label: 'Estadísticas y Métricas',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
      href: `/projects/${projectSlug}/suppliers`,
      isActive: true
    },
    {
      id: 'shipping',
      label: 'Gestión de Envíos',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: `/projects/${projectSlug}/shipping`
    }
  ]

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
                  <Button className="w-full" style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                    + Nuevo Proveedor
                  </Button>
                </Link>
                <Link href={`/projects/${projectSlug}/suppliers/orders/new`}>
                  <Button className="w-full" variant="outline" 
                          style={{ borderColor: theme.colors.border, color: theme.colors.textPrimary }}>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" 
                         style={{ color: theme.colors.textPrimary }}>
                    Buscar proveedores
                  </label>
                  <Input
                    placeholder="Nombre, contacto, email..."
                    value={suppliersSearch}
                    onChange={(e) => setSuppliersSearch(e.target.value)}
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
                    value={suppliersStatus}
                    onChange={(e) => setSuppliersStatus(e.target.value as any)}
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Link href={`/projects/${projectSlug}/suppliers/new`}>
                    <Button style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                      + Nuevo Proveedor
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
                    Lista de Proveedores
                  </h3>
                  <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                    Mostrando {getFilteredSuppliers().length} proveedores
                  </p>
                </div>
              </div>

              {suppliersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" 
                       style={{ borderColor: theme.colors.primary }}></div>
                  <p className="mt-4" style={{ color: theme.colors.textSecondary }}>
                    Cargando proveedores...
                  </p>
                </div>
              ) : getFilteredSuppliers().length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🏢</div>
                  <p className="mb-2" style={{ color: theme.colors.textSecondary }}>
                    No hay proveedores
                  </p>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    Los proveedores aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead style={{ backgroundColor: theme.colors.surface }}>
                      <tr style={{ borderBottomColor: theme.colors.border, borderBottomWidth: '1px' }}>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Proveedor
                        </th>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Contacto
                        </th>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Email/Teléfono
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
                      {getFilteredSuppliers().map((supplier) => (
                        <tr key={supplier.id} className="border-b" 
                            style={{ borderColor: theme.colors.border }}>
                          <td className="p-3">
                            <div>
                              <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                                {supplier.name}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                              {supplier.contact_person || 'N/A'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <div className="text-sm" style={{ color: theme.colors.textPrimary }}>
                                {supplier.email || 'N/A'}
                              </div>
                              <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                                {supplier.phone || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              supplier.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {supplier.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center space-x-2">
                              <Link
                                href={`/projects/${projectSlug}/suppliers/${supplier.id}`}
                                className="text-blue-600 hover:text-blue-900 text-sm"
                              >
                                Ver
                              </Link>
                              <Link
                                href={`/projects/${projectSlug}/suppliers/${supplier.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900 text-sm"
                              >
                                Editar
                              </Link>
                              <button
                                onClick={() => toggleSupplierStatus(supplier)}
                                className={`text-sm ${
                                  supplier.is_active 
                                    ? 'text-red-600 hover:text-red-900' 
                                    : 'text-green-600 hover:text-green-900'
                                }`}
                              >
                                {supplier.is_active ? 'Desactivar' : 'Activar'}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" 
                         style={{ color: theme.colors.textPrimary }}>
                    Buscar órdenes
                  </label>
                  <Input
                    placeholder="Número, proveedor..."
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
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
                    value={ordersStatus}
                    onChange={(e) => setOrdersStatus(e.target.value as any)}
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendiente</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Link href={`/projects/${projectSlug}/suppliers/orders/new`}>
                    <Button style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                      + Nueva Orden
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
                    Órdenes de Compra
                  </h3>
                  <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                    Mostrando {getFilteredOrders().length} órdenes
                  </p>
                </div>
              </div>

              {ordersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" 
                       style={{ borderColor: theme.colors.primary }}></div>
                  <p className="mt-4" style={{ color: theme.colors.textSecondary }}>
                    Cargando órdenes...
                  </p>
                </div>
              ) : getFilteredOrders().length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="mb-2" style={{ color: theme.colors.textSecondary }}>
                    No hay órdenes de compra
                  </p>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    Las órdenes aparecerán aquí
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
                          Proveedor
                        </th>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Fecha
                        </th>
                        <th className="text-left p-3 font-medium" style={{ color: theme.colors.textPrimary }}>
                          Total
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
                      {getFilteredOrders().map((order) => (
                        <tr key={order.id} className="border-b" 
                            style={{ borderColor: theme.colors.border }}>
                          <td className="p-3">
                            <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                              {order.order_number}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                              {order.supplier_name || 'N/A'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm" style={{ color: theme.colors.textPrimary }}>
                              {new Date(order.order_date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                              ${order.total_amount?.toLocaleString() || '0'}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {order.status === 'pending' ? 'Pendiente' :
                               order.status === 'completed' ? 'Completado' : 'Cancelado'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center space-x-2">
                              <Link
                                href={`/projects/${projectSlug}/suppliers/orders/${order.id}`}
                                className="text-blue-600 hover:text-blue-900 text-sm"
                              >
                                Ver
                              </Link>
                              <Link
                                href={`/projects/${projectSlug}/suppliers/orders/${order.id}/edit`}
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
    <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.background }}>
      <ModernSidebar 
        items={sidebarItems}
        projectName={projectData.project.project_name}
      />
      
      <div className="flex-1 ml-64">
        <header className="border-b" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: theme.colors.textSecondary
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-sm">Dashboard Personal</span>
                </button>
                <div className="h-6 w-px" style={{ backgroundColor: theme.colors.border }}></div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
                    {projectData.project.project_name}
                  </h1>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    Gestión de Proveedores
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <ThemeSelector />
                
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-3 p-2 rounded-xl transition-all duration-200"
                    style={{ 
                      backgroundColor: theme.colors.surface + '80',
                      border: `1px solid ${theme.colors.border}`
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm"
                      style={{ 
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                        color: 'white'
                      }}
                    >
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                      {user?.email?.split('@')[0]}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <>
                      <div 
                        className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl border z-50"
                        style={{ 
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border
                        }}
                      >
                        <div className="p-2">
                          <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors"
                            style={{ color: theme.colors.textPrimary }}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3" />
                            </svg>
                            <span>Dashboard Principal</span>
                          </button>
                          
                          <button 
                            onClick={() => {
                              handleLogout()
                              setUserDropdownOpen(false)
                            }}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-red-600"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                            </svg>
                            <span>Cerrar Sesión</span>
                          </button>
                        </div>
                      </div>
                      
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setUserDropdownOpen(false)}
                      ></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Tabs tabs={suppliersTabs} defaultTab="overview" />
        </main>
      </div>
    </div>
  )
}