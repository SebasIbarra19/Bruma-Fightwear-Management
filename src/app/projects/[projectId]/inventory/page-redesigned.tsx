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

// Tipo específico para inventory de Phase 2
interface InventoryItemPhase2 {
  id: string
  project_id: string
  product_id?: string | null
  product_variant_id?: string | null
  supplier_id?: string | null
  sku: string
  product_name?: string | null
  product_description?: string | null
  quantity_available: number
  quantity_reserved: number
  quantity_on_order: number
  reorder_level?: number | null
  reorder_quantity?: number | null
  unit_cost?: number | null
  last_cost?: number | null
  average_cost?: number | null
  location?: string | null
  created_at: string
  updated_at: string
  // Relación con suppliers
  suppliers?: {
    id: string
    name: string
    contact_person?: string
  } | null
}

// Agregamos campos adicionales para compatibilidad
interface InventoryWithDetailsPhase2 extends InventoryItemPhase2 {
  name: string // alias para product_name
  description?: string | null // alias para product_description
  category: string // lo obtendremos del SKU o lo agregaremos
  quantity: number // alias para quantity_available
  min_stock_level: number // alias para reorder_level
  max_stock_level: number // calculado o por defecto
  selling_price: number // lo calcularemos basado en unit_cost
  is_active: boolean // por defecto true para Phase 2
}

export default function ProjectInventoryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [inventory, setInventory] = useState<InventoryWithDetailsPhase2[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    lowStock: 0,
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
      await loadInventoryData(currentProject.project_id)
      await loadSuppliersData(currentProject.project_id)
      
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadInventoryData = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_person
          )
        `)
        .eq('project_id', projectId)
        .order('product_name')

      if (error) {
        console.error('Error loading inventory:', error)
        return
      }

      // Transformar datos de Phase 2 al formato esperado por la UI
      const inventoryData = (data as InventoryItemPhase2[]).map((item): InventoryWithDetailsPhase2 => ({
        ...item,
        name: item.product_name || item.sku || 'Sin nombre',
        description: item.product_description || '',
        category: extractCategoryFromSKU(item.sku) || 'General',
        quantity: item.quantity_available,
        min_stock_level: item.reorder_level || 5,
        max_stock_level: (item.reorder_level || 5) * 4,
        selling_price: calculateSellingPrice(item.unit_cost),
        is_active: true // Por defecto activo en Phase 2
      }))

      setInventory(inventoryData)

      // Calcular estadísticas
      const total = inventoryData.length
      const active = inventoryData.filter(item => item.is_active).length
      const inactive = total - active
      const lowStock = inventoryData.filter(item => item.quantity <= item.min_stock_level).length
      const totalValue = inventoryData.reduce((sum, item) => sum + (item.quantity * (item.unit_cost || 0)), 0)

      setStats({
        total,
        active,
        inactive,
        lowStock,
        totalValue
      })

    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Función auxiliar para extraer categoría del SKU
  const extractCategoryFromSKU = (sku: string): string => {
    if (!sku) return 'General'
    
    const skuParts = sku.split('-')
    if (skuParts.length < 3) return 'General'
    
    const categoryCode = skuParts[1]
    const categoryMap: Record<string, string> = {
      'RG': 'Rashguards',
      'SH': 'Shorts',
      'GL': 'Guantes',
      'SP': 'Protecciones',
      'TS': 'Camisetas',
      'HD': 'Sudaderas',
      'VD': 'Accesorios',
      'PB': 'Protecciones'
    }
    
    return categoryMap[categoryCode] || 'General'
  }

  // Función auxiliar para calcular precio de venta
  const calculateSellingPrice = (unitCost: number | null): number => {
    if (!unitCost) return 0
    return Math.round(unitCost * 2.5 * 100) / 100 // Margen del 150%
  }

      setStats({
        total,
        active,
        inactive,
        lowStock,
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

  // Filtrar inventario
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSupplier = selectedSupplier === 'all' || item.supplier_id === selectedSupplier
    const matchesStatus = 
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && item.is_active) ||
      (selectedStatus === 'inactive' && !item.is_active) ||
      (selectedStatus === 'low-stock' && item.quantity <= item.min_stock_level)

    return matchesSearch && matchesCategory && matchesSupplier && matchesStatus
  })

  // Obtener categorías únicas
  const categories = Array.from(new Set(inventory.map(item => item.category).filter(Boolean)))

  const toggleItemStatus = async (itemId: string) => {
    try {
      const item = inventory.find(i => i.id === itemId)
      if (!item) return

      const newStatus = !item.is_active

      const { error } = await supabase
        .from('inventory')
        .update({ is_active: newStatus })
        .eq('id', itemId)

      if (error) {
        console.error('Error:', error)
        return
      }

      // Actualizar localmente
      setInventory(inventory.map(i => 
        i.id === itemId 
          ? { ...i, is_active: newStatus }
          : i
      ))

      // Actualizar stats
      setStats(prev => ({
        ...prev,
        active: prev.active + (newStatus ? 1 : -1),
        inactive: prev.inactive + (!newStatus ? 1 : -1)
      }))

    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando inventario...</p>
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
            <span className="text-gray-900">Inventario</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/images/bruma/logo-circle.svg" 
                alt="BRUMA Fightwear" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
                <p className="text-gray-600 mt-2">
                  Control de stock y productos de {project.project_name}
                </p>
              </div>
            </div>
            
            <Link href={`/projects/${projectSlug}/inventory/new`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                + Nuevo Item
              </Button>
            </Link>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Activos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <div className="text-sm text-gray-600">Inactivos</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
              <div className="text-sm text-gray-600">Stock Bajo</div>
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
                    placeholder="Buscar por nombre, SKU, descripción o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className=""
                  />
                </div>
              </div>

              {/* Filtro por categoría */}
              <div className="min-w-[200px]">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
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
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                  <option value="low-stock">Stock Bajo</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de inventario */}
        <Card>
          <CardHeader>
            <CardTitle>Inventario ({filteredInventory.length})</CardTitle>
            <CardDescription>
              Lista de todos los items de inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInventory.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay items de inventario
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || selectedCategory !== 'all' || selectedSupplier !== 'all' || selectedStatus !== 'all'
                    ? 'No se encontraron items con los filtros aplicados'
                    : 'Comienza agregando tu primer item de inventario'
                  }
                </p>
                {searchTerm || selectedCategory !== 'all' || selectedSupplier !== 'all' || selectedStatus !== 'all' ? (
                  <Button 
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                      setSelectedSupplier('all')
                      setSelectedStatus('all')
                    }}
                    variant="outline"
                  >
                    Limpiar Filtros
                  </Button>
                ) : (
                  <Link href={`/projects/${projectSlug}/inventory/new`}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      + Nuevo Item
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-4 font-medium text-gray-700">Producto</th>
                      <th className="text-left p-4 font-medium text-gray-700">SKU</th>
                      <th className="text-left p-4 font-medium text-gray-700">Categoría</th>
                      <th className="text-left p-4 font-medium text-gray-700">Proveedor</th>
                      <th className="text-left p-4 font-medium text-gray-700">Stock</th>
                      <th className="text-left p-4 font-medium text-gray-700">Costo Unit.</th>
                      <th className="text-left p-4 font-medium text-gray-700">Precio Venta</th>
                      <th className="text-left p-4 font-medium text-gray-700">Estado</th>
                      <th className="text-left p-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.description}
                            </div>
                            {item.location && (
                              <div className="text-xs text-blue-600 mt-1">
                                📍 {item.location}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600 font-mono">
                            {item.sku || '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {item.category || 'Sin categoría'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-900">
                            {(item.suppliers as any)?.name || 'Sin proveedor'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.quantity > item.max_stock_level ? 'bg-blue-100 text-blue-800' :
                              item.quantity > item.min_stock_level ? 'bg-green-100 text-green-800' :
                              item.quantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.quantity} unidades
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              Min: {item.min_stock_level} | Max: {item.max_stock_level}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-gray-900">
                            {formatCurrency(item.unit_cost)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-gray-900">
                            {formatCurrency(item.selling_price)}
                          </div>
                          <div className="text-xs text-green-600">
                            +{Math.round(((item.selling_price - item.unit_cost) / item.unit_cost) * 100)}% margen
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => toggleItemStatus(item.id)}
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              item.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {item.is_active ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Link href={`/projects/${projectSlug}/inventory/${item.id}/edit`}>
                              <Button variant="outline" size="sm">
                                Editar
                              </Button>
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