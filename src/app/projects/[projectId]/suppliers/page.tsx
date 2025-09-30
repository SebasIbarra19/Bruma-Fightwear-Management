'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { 
  UserProject, 
  Supplier, 
  PurchaseOrder,
  SupplierWithStats 
} from '@/types/database'

interface SupplierStats {
  totalSuppliers: number
  activeSuppliers: number
  inactiveSuppliers: number
  totalOrders: number
  pendingOrders: number
  totalSpent: number
}

interface PurchaseOrderWithSupplier extends PurchaseOrder {
  supplier_name?: string
}

export default function SuppliersPage({ params }: { params: { projectId: string } }) {
  // Estados generales
  const { user, isLoading: authLoading } = useAuth()
  const [project, setProject] = useState<UserProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'proveedores' | 'ordenes' | 'pagos' | 'estadisticas'>('proveedores')
  
  // Estados para estadísticas generales
  const [stats, setStats] = useState<SupplierStats>({
    totalSuppliers: 0,
    activeSuppliers: 0,
    inactiveSuppliers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0
  })

  // Estados para Proveedores
  const [suppliers, setSuppliers] = useState<SupplierWithStats[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [suppliersSearch, setSuppliersSearch] = useState('')
  const [suppliersStatus, setSuppliersStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Estados para Órdenes de Compra
  const [orders, setOrders] = useState<PurchaseOrderWithSupplier[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersSearch, setOrdersSearch] = useState('')
  const [ordersStatus, setOrdersStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all')
  const [ordersSupplier, setOrdersSupplier] = useState<string>('all')

  const router = useRouter()
  const searchParams = useSearchParams()
  const projectSlug = params.projectId as string

  // El middleware maneja la autenticación automáticamente
  // Solo necesitamos el usuario para mostrar datos personalizados

  useEffect(() => {
    // Verificar si se debe mostrar un tab específico desde URL
    const tab = searchParams.get('tab')
    if (tab && ['proveedores', 'ordenes', 'pagos', 'estadisticas'].includes(tab)) {
      setActiveTab(tab as any)
    }
    
    // Cargar datos incluso si authLoading aún está en proceso
    if ((user || !authLoading) && params.projectId) {
      loadProjectData()
    }
  }, [user, authLoading, params.projectId])

  const loadProjectData = async () => {
    try {
      setLoading(true)

      // Obtener proyectos del usuario
      const { data: userProjects, error } = await supabase.rpc('get_user_projects', {
        user_uuid: user?.id
      })

      if (error) {
        console.error('Error obteniendo proyectos:', error)
        return
      }

      const currentProject = userProjects?.find((p: UserProject) => p.project_slug === projectSlug)
      
      if (!currentProject) {
        console.error('Proyecto no encontrado o sin acceso')
        return
      }

      setProject(currentProject)
      await loadGeneralStats(currentProject.project_id)

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGeneralStats = async (projectId: string) => {
    try {
      // Obtener estadísticas de proveedores
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, is_active')
        .eq('project_id', projectId)

      // Obtener estadísticas de órdenes de compra
      const { data: orders, error: ordersError } = await supabase
        .from('purchase_orders')
        .select('id, status, total_amount')
        .eq('project_id', projectId)

      if (!suppliersError && !ordersError) {
        const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
        
        setStats({
          totalSuppliers: suppliers?.length || 0,
          activeSuppliers: suppliers?.filter(s => s.is_active).length || 0,
          inactiveSuppliers: suppliers?.filter(s => !s.is_active).length || 0,
          totalOrders: orders?.length || 0,
          pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
          totalSpent
        })
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  // Función para cambiar tabs
  const handleTabChange = (tab: 'proveedores' | 'ordenes' | 'pagos' | 'estadisticas') => {
    setActiveTab(tab)
    
    // Cargar datos específicos del tab si no están cargados
    if (!project) return
    
    switch(tab) {
      case 'proveedores':
        if (suppliers.length === 0) loadSuppliers(project.project_id)
        break
      case 'ordenes':
        if (orders.length === 0) loadOrders(project.project_id)
        break
      case 'pagos':
        // Por implementar
        break
      case 'estadisticas':
        // Las estadísticas ya se cargan en loadGeneralStats
        break
    }
  }

  // Funciones de carga de datos específicas para cada tab
  const loadSuppliers = async (projectId: string) => {
    if (suppliersLoading) return
    setSuppliersLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error cargando proveedores:', error)
        return
      }

      // Agregar estadísticas básicas a cada proveedor
      const suppliersWithStats = (data || []).map(supplier => ({
        ...supplier,
        total_orders: 0,
        total_spent: 0,
        last_order_date: null
      }))

      setSuppliers(suppliersWithStats)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSuppliersLoading(false)
    }
  }

  const loadOrders = async (projectId: string) => {
    if (ordersLoading) return
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

      if (error) {
        console.error('Error cargando órdenes:', error)
        return
      }

      const ordersWithSupplier = data?.map(order => ({
        ...order,
        supplier_name: (order.suppliers as any)?.name
      })) || []

      setOrders(ordersWithSupplier)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  // Funciones auxiliares
  const toggleSupplierStatus = async (supplier: Supplier) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: !supplier.is_active })
        .eq('id', supplier.id)

      if (error) {
        console.error('Error actualizando estado:', error)
        return
      }

      // Actualizar estado local
      setSuppliers(prev => prev.map(s => 
        s.id === supplier.id ? { ...s, is_active: !s.is_active } : s
      ))

      // Actualizar stats generales
      await loadGeneralStats(project?.project_id || '')
    } catch (error) {
      console.error('Error:', error)
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
      const matchesSupplier = ordersSupplier === 'all' || order.supplier_id === ordersSupplier
      return matchesSearch && matchesStatus && matchesSupplier
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando proveedores...</p>
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
            <span className="text-gray-900">Proveedores</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/images/bruma/logo-circle.svg" 
                alt="BRUMA Fightwear" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Proveedores</h1>
                <p className="text-gray-600 mt-2">
                  Administra la red de proveedores de {project.project_name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.totalSuppliers}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{stats.activeSuppliers}</div>
              <div className="text-sm text-gray-600">Activos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">{stats.inactiveSuppliers}</div>
              <div className="text-sm text-gray-600">Inactivos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">{stats.totalOrders}</div>
              <div className="text-sm text-gray-600">Órdenes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-indigo-600">${stats.totalSpent.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Gastado</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleTabChange('proveedores')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'proveedores'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏢 Proveedores
            </button>
            <button
              onClick={() => handleTabChange('ordenes')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'ordenes'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 Órdenes de Compra
            </button>
            <button
              onClick={() => handleTabChange('pagos')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'pagos'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💰 Pagos
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

        {/* Contenido del Tab de Proveedores */}
        {activeTab === 'proveedores' && (
          <>
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar proveedores
                    </label>
                    <Input
                      placeholder="Nombre, contacto, email..."
                      value={suppliersSearch}
                      onChange={(e) => setSuppliersSearch(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
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
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        + Nuevo Proveedor
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
                      Proveedores
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Mostrando {getFilteredSuppliers().length} proveedores
                    </p>
                  </div>
                </div>

                {suppliersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando proveedores...</p>
                  </div>
                ) : getFilteredSuppliers().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">🏢</div>
                    <p className="text-gray-600 mb-2">No hay proveedores</p>
                    <p className="text-sm text-gray-500">
                      Los proveedores aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Proveedor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contacto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ciudad
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredSuppliers().map((supplier) => (
                          <tr key={supplier.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {supplier.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {supplier.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {supplier.contact_person || 'Sin contacto'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {supplier.phone}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {supplier.city ? `${supplier.city}, ${supplier.country}` : 'Sin especificar'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => toggleSupplierStatus(supplier)}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  supplier.is_active
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {supplier.is_active ? 'Activo' : 'Inactivo'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/projects/${projectSlug}/suppliers/${supplier.id}`}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Ver
                              </Link>
                              <Link
                                href={`/projects/${projectSlug}/suppliers/${supplier.id}/edit`}
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

        {/* Contenido del Tab de Órdenes de Compra */}
        {activeTab === 'ordenes' && (
          <>
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar órdenes
                    </label>
                    <Input
                      placeholder="Número, proveedor..."
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
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proveedor
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={ordersSupplier}
                      onChange={(e) => setOrdersSupplier(e.target.value)}
                    >
                      <option value="all">Todos los proveedores</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Link href={`/projects/${projectSlug}/suppliers/orders/new`}>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        + Nueva Orden
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
                      Órdenes de Compra
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Mostrando {getFilteredOrders().length} órdenes
                    </p>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando órdenes...</p>
                  </div>
                ) : getFilteredOrders().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">📦</div>
                    <p className="text-gray-600 mb-2">No hay órdenes de compra</p>
                    <p className="text-sm text-gray-500">
                      Las órdenes aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Orden
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Proveedor
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
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {order.supplier_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.order_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${order.total_amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : order.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order.status === 'pending' ? 'Pendiente' : 
                                 order.status === 'completed' ? 'Completada' : 'Cancelada'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/projects/${projectSlug}/suppliers/orders/${order.id}`}
                                className="text-purple-600 hover:text-purple-900 mr-4"
                              >
                                Ver
                              </Link>
                              <Link
                                href={`/projects/${projectSlug}/suppliers/orders/${order.id}/edit`}
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

        {/* Contenido del Tab de Pagos */}
        {activeTab === 'pagos' && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">💰</div>
                <p className="text-gray-600 mb-2">Gestión de Pagos</p>
                <p className="text-sm text-gray-500">
                  Este módulo estará disponible próximamente
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contenido del Tab de Estadísticas */}
        {activeTab === 'estadisticas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Proveedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Proveedores</span>
                    <span className="font-semibold">{stats.totalSuppliers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proveedores Activos</span>
                    <span className="font-semibold text-green-600">{stats.activeSuppliers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proveedores Inactivos</span>
                    <span className="font-semibold text-red-600">{stats.inactiveSuppliers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen de Órdenes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Órdenes</span>
                    <span className="font-semibold">{stats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Órdenes Pendientes</span>
                    <span className="font-semibold text-yellow-600">{stats.pendingOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Gastado</span>
                    <span className="font-semibold text-blue-600">${stats.totalSpent.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}