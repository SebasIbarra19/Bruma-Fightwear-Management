'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject } from '@/types/database'

// Tipos específicos para inventory_movements de Phase 2
interface InventoryMovementPhase2 {
  id: string
  project_id: string
  inventory_id: string
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  unit_cost: number | null
  total_cost: number | null
  reference_type: string | null
  reference_id: string | null
  notes: string | null
  created_by: string
  created_at: string
  // Relaciones
  inventory?: {
    id: string
    sku: string
    product_name: string | null
    product_description: string | null
  } | null
  created_by_user?: {
    email: string
  } | null
}

export default function InventoryMovementsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [project, setProject] = useState<UserProject | null>(null)
  const [movements, setMovements] = useState<InventoryMovementPhase2[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [products, setProducts] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    inMovements: 0,
    outMovements: 0,
    adjustments: 0,
    transfers: 0,
    totalValue: 0
  })

  const router = useRouter()
  const params = useParams()
  const projectSlug = params.projectId as string

  // El middleware maneja la autenticación automáticamente
  useEffect(() => {
    // Cargar datos incluso si authLoading aún está en proceso
    if ((user || !authLoading) && projectSlug) {
      loadProjectData()
    }
  }, [user, authLoading, projectSlug])

  const loadProjectData = async () => {
    try {
      setLoading(true)

      // Obtener proyectos del usuario
      const { data: userProjects, error } = await supabase
        .rpc('get_user_projects', { user_uuid: user?.id })

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
      await loadMovementsData(currentProject.project_id)
      await loadProductsData(currentProject.project_id)
      
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadMovementsData = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          inventory (
            id,
            sku,
            product_name,
            product_description
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading inventory movements:', error)
        return
      }

      const movementsData = (data as InventoryMovementPhase2[]) || []
      setMovements(movementsData)

      // Calcular estadísticas
      const total = movementsData.length
      const inMovements = movementsData.filter(m => m.movement_type === 'in').length
      const outMovements = movementsData.filter(m => m.movement_type === 'out').length
      const adjustments = movementsData.filter(m => m.movement_type === 'adjustment').length
      const transfers = movementsData.filter(m => m.movement_type === 'transfer').length
      const totalValue = movementsData.reduce((sum, m) => sum + (m.total_cost || 0), 0)

      setStats({
        total,
        inMovements,
        outMovements,
        adjustments,
        transfers,
        totalValue
      })

    } catch (error) {
      console.error('Error:', error)
    }
  }

  const loadProductsData = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, sku, product_name')
        .eq('project_id', projectId)
        .order('product_name')

      if (error) {
        console.error('Error loading products:', error)
        return
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Filtrar movimientos
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = 
      movement.inventory?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.inventory?.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reference_type?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === 'all' || movement.movement_type === selectedType
    const matchesProduct = selectedProduct === 'all' || movement.inventory_id === selectedProduct
    
    // Filtro por fecha
    let matchesDate = true
    if (selectedDateRange !== 'all' && movement.created_at) {
      const movementDate = new Date(movement.created_at)
      const now = new Date()
      
      switch (selectedDateRange) {
        case 'today':
          matchesDate = movementDate.toDateString() === now.toDateString()
          break
        case 'week':
          matchesDate = (now.getTime() - movementDate.getTime()) <= (7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          matchesDate = (now.getTime() - movementDate.getTime()) <= (30 * 24 * 60 * 60 * 1000)
          break
        case '3months':
          matchesDate = (now.getTime() - movementDate.getTime()) <= (90 * 24 * 60 * 60 * 1000)
          break
      }
    }

    return matchesSearch && matchesType && matchesProduct && matchesDate
  })

  const getMovementTypeBadge = (type: string) => {
    const typeConfig = {
      'in': { bg: 'bg-green-100', text: 'text-green-800', label: 'Entrada', icon: '↗️' },
      'out': { bg: 'bg-red-100', text: 'text-red-800', label: 'Salida', icon: '↖️' },
      'adjustment': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Ajuste', icon: '⚖️' },
      'transfer': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Transferencia', icon: '🔄' }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.adjustment
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} flex items-center gap-1`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    )
  }

  const formatQuantity = (quantity: number, type: string) => {
    const sign = type === 'in' || type === 'adjustment' ? '+' : '-'
    const color = type === 'in' ? 'text-green-600' : type === 'out' ? 'text-red-600' : 'text-yellow-600'
    return (
      <span className={`font-medium ${color}`}>
        {sign}{Math.abs(quantity)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando movimientos de inventario...</p>
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
            <span className="text-gray-900">Movimientos de Inventario</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/public/images/bruma/logo-circle.png" 
                alt="BRUMA Fightwear" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Movimientos de Inventario</h1>
                <p className="text-gray-600 mt-2">
                  Historial completo de entradas y salidas de {project.project_name}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link href={`/projects/${projectSlug}/inventory-movements/new`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  + Nuevo Movimiento
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
              <div className="text-sm text-gray-600">Total Movimientos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{stats.inMovements}</div>
              <div className="text-sm text-gray-600">Entradas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">{stats.outMovements}</div>
              <div className="text-sm text-gray-600">Salidas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.adjustments}</div>
              <div className="text-sm text-gray-600">Ajustes</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.transfers}</div>
              <div className="text-sm text-gray-600">Transferencias</div>
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
                    placeholder="Buscar por SKU, producto, notas o referencia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className=""
                  />
                </div>
              </div>

              {/* Filtro por tipo */}
              <div className="min-w-[150px]">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="in">Entradas</option>
                  <option value="out">Salidas</option>
                  <option value="adjustment">Ajustes</option>
                  <option value="transfer">Transferencias</option>
                </select>
              </div>

              {/* Filtro por producto */}
              <div className="min-w-[200px]">
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los productos</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.product_name || product.sku}
                    </option>
                  ))}
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
                  <option value="today">Hoy</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mes</option>
                  <option value="3months">Últimos 3 meses</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de movimientos */}
        <Card>
          <CardHeader>
            <CardTitle>Movimientos de Inventario ({filteredMovements.length})</CardTitle>
            <CardDescription>
              Historial completo de todos los movimientos de inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMovements.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">📦</div>
                <p className="text-gray-600">No se encontraron movimientos</p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchTerm || selectedType !== 'all' || selectedProduct !== 'all' || selectedDateRange !== 'all'
                    ? 'Intenta ajustar los filtros'
                    : 'Los movimientos aparecerán aquí cuando se registren entradas y salidas'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-900">Fecha</th>
                      <th className="text-left p-3 font-medium text-gray-900">Producto</th>
                      <th className="text-left p-3 font-medium text-gray-900">Tipo</th>
                      <th className="text-left p-3 font-medium text-gray-900">Cantidad</th>
                      <th className="text-left p-3 font-medium text-gray-900">Costo Unit.</th>
                      <th className="text-left p-3 font-medium text-gray-900">Total</th>
                      <th className="text-left p-3 font-medium text-gray-900">Referencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.map((movement) => (
                      <tr key={movement.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {new Date(movement.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(movement.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {movement.inventory?.sku || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {movement.inventory?.product_name || 'Sin nombre'}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {getMovementTypeBadge(movement.movement_type)}
                        </td>
                        <td className="p-3">
                          {formatQuantity(movement.quantity, movement.movement_type)}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">
                            {movement.unit_cost ? formatCurrency(movement.unit_cost) : '-'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">
                            {movement.total_cost ? formatCurrency(movement.total_cost) : '-'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            {movement.reference_type && (
                              <div className="text-sm text-gray-600 capitalize">
                                {movement.reference_type}
                              </div>
                            )}
                            {movement.notes && (
                              <div className="text-sm text-gray-500 mt-1">
                                {movement.notes}
                              </div>
                            )}
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