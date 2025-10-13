'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { ModernTable } from '@/components/ui/modern-table'
import { ProjectPageLayout } from '@/components/layout/ProjectPageLayout'
import { useInventoryData } from '@/hooks/useInventoryData'

interface UserProject {
  project_id: string
  project_name: string
  project_slug: string
  project_type: string
}

interface ProjectInventoryData {
  project: UserProject
}

export default function InventoryPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const projectSlug = params.projectId
  
  const [projectData, setProjectData] = useState<ProjectInventoryData | null>(null)
  const [loading, setLoading] = useState(true)

  // Hook para datos de inventario
  const {
    stats,
    alerts,
    items,
    movements,
    movementStats,
    loadingStats,
    loadingAlerts,
    loadingItems,
    loadingMovements,
    loadingMovementStats,
    fetchItems,
    fetchMovements,
    fetchMovementStats,
    error: inventoryError
  } = useInventoryData(projectData?.project?.project_id)

  // Debug: log cuando cambian los datos
  useEffect(() => {
    console.log('🔍 DEBUG COMPLETO:')
    console.log('   - Project Data:', projectData?.project?.project_id)
    console.log('   - Project Slug:', projectSlug)
    console.log('   - Items:', items)
    console.log('   - Items Length:', items?.length)
    console.log('   - Loading Items:', loadingItems)
    console.log('   - Inventory Error:', inventoryError)
    console.log('   - Stats:', stats)
    console.log('   - LoadingStats:', loadingStats)
  }, [projectData, items, loadingItems, inventoryError, projectSlug, stats, loadingStats])

  // Test manual de la API
  useEffect(() => {
    if (projectData?.project?.project_id) {
      console.log('🧪 TESTING API MANUAL:')
      fetch(`/api/inventory/items?projectId=${projectData.project.project_id}&limit=5`)
        .then(res => res.json())
        .then(data => {
          console.log('🧪 API Response:', data)
        })
        .catch(err => {
          console.error('🧪 API Error:', err)
        })
    }
  }, [projectData?.project?.project_id])

  useEffect(() => {
    const loadProjectData = async () => {
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
      } catch (error) {
        console.error('Error cargando proyecto:', error)
        router.push('/dashboard')
      }

      setLoading(false)
    }

    loadProjectData()
  }, [router, projectSlug, user])





  const inventoryTabs = [
    {
      id: 'overview',
      label: 'Resumen de Inventario',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Total de Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                      {stats?.total_products?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                      Productos únicos en inventario
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Stock Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                      {stats?.total_items?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                      Items disponibles en almacén
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Items Bajo Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-12 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold" style={{ 
                      color: (stats?.low_stock_items || 0) > 0 ? theme.colors.error : theme.colors.textPrimary 
                    }}>
                      {stats?.low_stock_items?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs mt-1" style={{ 
                      color: (stats?.low_stock_items || 0) > 0 ? theme.colors.error : theme.colors.success 
                    }}>
                      {(stats?.low_stock_items || 0) > 0 ? 'Requieren reposición' : 'Todo en orden'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Valor del Inventario
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="animate-pulse">
                    <div className="h-8 w-24 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                      ${stats?.total_value?.toLocaleString() || '0'}
                    </div>
                    <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                      Valor total a costo promedio
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alertas y Acciones Rápidas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>Alertas de Stock</CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Productos que requieren atención inmediata
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAlerts ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded"></div>
                          <div className="h-3 w-24 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                ) : alerts && alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.slice(0, 4).map((alert, index) => (
                      <div key={alert.alert_id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                            {alert.product_name}
                          </p>
                          <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                            {alert.variant_name} • Stock: {alert.current_stock} | Mínimo: {alert.reorder_level}
                          </p>
                          <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                            SKU: {alert.variant_sku} • Sugerido: {alert.suggested_order_quantity}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              alert.alert_level === 'critical' 
                                ? 'text-red-700' 
                                : alert.alert_level === 'high'
                                ? 'text-orange-700'
                                : 'text-yellow-700'
                            }`}
                            style={{ 
                              backgroundColor: 
                                alert.alert_level === 'critical' 
                                  ? theme.colors.error + '20' 
                                  : alert.alert_level === 'high'
                                  ? '#f97316' + '20'
                                  : theme.colors.warning + '20',
                              border: `1px solid ${
                                alert.alert_level === 'critical' 
                                  ? theme.colors.error 
                                  : alert.alert_level === 'high'
                                  ? '#f97316'
                                  : theme.colors.warning
                              }30`
                            }}
                          >
                            {alert.alert_level === 'critical' ? 'Crítico' : 
                             alert.alert_level === 'high' ? 'Alto' : 'Medio'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.colors.success + '20' }}>
                      <svg className="w-8 h-8" style={{ color: theme.colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: theme.colors.textPrimary }}>
                      ¡Excelente!
                    </p>
                    <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                      No hay alertas de stock bajo en este momento
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>Movimientos Recientes</CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Últimas entradas y salidas de inventario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: 'entrada', product: 'Guantes BRUMA Pro', quantity: 50, date: '2024-01-15' },
                    { type: 'salida', product: 'Shorts MMA Elite', quantity: -25, date: '2024-01-15' },
                    { type: 'entrada', product: 'Vendas Elásticas', quantity: 100, date: '2024-01-14' },
                    { type: 'salida', product: 'Protector Bucal', quantity: -15, date: '2024-01-14' }
                  ].map((movement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <div className="flex items-center space-x-3">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            movement.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                          }`}
                          style={{ 
                            backgroundColor: movement.type === 'entrada' 
                              ? theme.colors.success + '20' 
                              : theme.colors.error + '20'
                          }}
                        >
                          {movement.type === 'entrada' ? '+' : '-'}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                            {movement.product}
                          </p>
                          <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                            {movement.date}
                          </p>
                        </div>
                      </div>
                      <span 
                        className={`text-sm font-medium ${
                          movement.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'stock-control',
      label: 'Control de Stock',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                Control de Stock por Producto
              </h3>
              <p style={{ color: theme.colors.textSecondary }}>
                Gestiona los niveles de inventario y configura alertas automáticas
              </p>
            </div>
            <Button 
              className="shadow-lg"
              onClick={() => console.log('Agregar producto al inventario')}
              style={{ 
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                border: 'none'
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar Producto
            </Button>
          </div>

          {/* Tabla de productos usando ModernTable */}
          {loadingItems ? (
            // Skeleton loading para la tabla
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6 border-b">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {Array(5).fill(0).map((_, index) => (
                  <div key={index} className="p-6 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="w-16 h-4 bg-gray-200 rounded"></div>
                      <div className="w-12 h-4 bg-gray-200 rounded"></div>
                      <div className="w-12 h-4 bg-gray-200 rounded"></div>
                      <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : items.length === 0 ? (
            // Estado vacío
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.colors.secondary + '20' }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={theme.colors.secondary}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4m8 4l-4 4-4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                No hay productos en inventario
              </h3>
              <p style={{ color: theme.colors.textSecondary }} className="mb-4">
                Comienza agregando productos a tu inventario para gestionar el stock
              </p>
              <Button
                onClick={() => console.log('Agregar primer producto')}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                  border: 'none'
                }}
              >
                Agregar Primer Producto
              </Button>
            </div>
          ) : (
            <ModernTable
              data={items.map(item => ({
                id: item.id,
                name: item.name,
                sku: item.sku,
                category: item.category_name,
                variants_count: item.total_variants,
                total_stock: item.total_stock,
                total_value: item.total_value,
                status: item.status,
                variants: item.variants
              }))}
              columns={[
                { 
                  key: 'name', 
                  title: 'Producto', 
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="font-semibold" style={{ color: theme.colors.textPrimary }}>{value}</div>
                      <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        SKU: {row.sku} • {row.category}
                      </div>
                    </div>
                  )
                },
                { 
                  key: 'variants_count', 
                  title: 'Variantes', 
                  sortable: true,
                  render: (value) => (
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: theme.colors.secondary + '20',
                        color: theme.colors.secondary
                      }}
                    >
                      {value} variante{value !== 1 ? 's' : ''}
                    </span>
                  )
                },
                { 
                  key: 'total_stock', 
                  title: 'Stock Total', 
                  sortable: true,
                  render: (value) => (
                    <span className="font-semibold text-lg" style={{ color: theme.colors.textPrimary }}>
                      {value?.toLocaleString() || 0}
                    </span>
                  )
                },
                { 
                  key: 'total_value', 
                  title: 'Valor Total',
                  sortable: true,
                  render: (value) => (
                    <span className="font-medium" style={{ color: theme.colors.textPrimary }}>
                      ${(value || 0).toFixed(2)}
                    </span>
                  )
                },
                {
                  key: 'status',
                  title: 'Estado',
                  render: (value) => (
                    <span 
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        value === 'critical' ? 'text-red-700' :
                        value === 'warning' ? 'text-yellow-700' : 'text-green-700'
                      }`}
                      style={{ 
                        backgroundColor: 
                          value === 'critical' ? theme.colors.error + '20' :
                          value === 'warning' ? theme.colors.warning + '20' : theme.colors.success + '20',
                        border: `1px solid ${
                          value === 'critical' ? theme.colors.error :
                          value === 'warning' ? theme.colors.warning : theme.colors.success
                        }30`
                      }}
                    >
                      {value === 'critical' ? 'Crítico' :
                       value === 'warning' ? 'Bajo Stock' : 'Normal'}
                    </span>
                  )
                }
              ]}
              renderExpandedRow={(row) => (
                <div className="p-6 rounded-lg border-l-4" style={{ 
                  backgroundColor: theme.colors.surface, 
                  borderLeftColor: theme.colors.primary,
                  borderColor: theme.colors.border + '40'
                }}>
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ 
                      backgroundColor: theme.colors.primary + '20' 
                    }}>
                      <svg className="w-4 h-4" style={{ color: theme.colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold" style={{ color: theme.colors.primary }}>
                      Variantes de {row.name}
                    </h4>
                    <span className="ml-auto px-3 py-1 rounded-full text-sm font-medium" style={{
                      backgroundColor: theme.colors.secondary + '20',
                      color: theme.colors.secondary
                    }}>
                      {row.variants?.length || 0} variantes
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto rounded-lg border" style={{ borderColor: theme.colors.border }}>
                    <table className="w-full">
                      <thead style={{ backgroundColor: theme.colors.background }}>
                        <tr className="border-b" style={{ borderColor: theme.colors.border }}>
                          <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>Variante</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>SKU</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>Tamaño</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>Color</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>Stock</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>Valor</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>Estado</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {row.variants?.map((variant: any, index: number) => (
                          <tr 
                            key={variant.inventory_id} 
                            className="border-b hover:bg-opacity-50 transition-colors" 
                            style={{ 
                              backgroundColor: index % 2 === 0 ? 'transparent' : theme.colors.background + '30',
                              borderColor: theme.colors.border + '30'
                            }}
                          >
                            <td className="py-3 px-4 text-sm">
                              <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                                {variant.variant_name}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm font-mono" style={{ color: theme.colors.textSecondary }}>
                              {variant.variant_sku}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className="px-2 py-1 rounded-md text-xs font-medium" style={{
                                backgroundColor: theme.colors.secondary + '15',
                                color: theme.colors.secondary
                              }}>
                                {variant.size || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className="px-2 py-1 rounded-md text-xs font-medium" style={{
                                backgroundColor: theme.colors.primary + '15',
                                color: theme.colors.primary
                              }}>
                                {variant.color || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className="font-semibold text-lg" style={{ color: theme.colors.textPrimary }}>
                                {variant.quantity_available?.toLocaleString() || 0}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                              ${variant.total_value?.toFixed(2) || '0.00'}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span 
                                className="px-3 py-1 text-xs font-medium rounded-full border"
                                style={{ 
                                  backgroundColor: variant.stock_status === 'out_of_stock' ? theme.colors.error + '15' :
                                                variant.stock_status === 'low_stock' ? theme.colors.warning + '15' : 
                                                theme.colors.success + '15',
                                  color: variant.stock_status === 'out_of_stock' ? theme.colors.error :
                                         variant.stock_status === 'low_stock' ? theme.colors.warning : 
                                         theme.colors.success,
                                  borderColor: variant.stock_status === 'out_of_stock' ? theme.colors.error + '30' :
                                              variant.stock_status === 'low_stock' ? theme.colors.warning + '30' : 
                                              theme.colors.success + '30'
                                }}
                              >
                                {variant.stock_status === 'out_of_stock' ? 'Sin Stock' :
                                 variant.stock_status === 'low_stock' ? 'Bajo Stock' : 'Stock Normal'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  className="p-1.5 rounded-md hover:bg-opacity-80 transition-colors"
                                  style={{ 
                                    backgroundColor: theme.colors.primary + '15',
                                    color: theme.colors.primary
                                  }}
                                  onClick={() => console.log('Editar variante:', variant.variant_name)}
                                  title="Editar variante"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                
                                <button
                                  className="p-1.5 rounded-md hover:bg-opacity-80 transition-colors"
                                  style={{ 
                                    backgroundColor: theme.colors.secondary + '15',
                                    color: theme.colors.secondary
                                  }}
                                  onClick={() => console.log('Ajustar stock:', variant.variant_name)}
                                  title="Ajustar stock"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 010-2h4zM6 6v12h12V6H6zm3 3h6v2H9V9zm0 4h6v2H9v-2z" />
                                  </svg>
                                </button>
                                
                                {variant.needs_reorder && (
                                  <button
                                    className="p-1.5 rounded-md hover:bg-opacity-80 transition-colors"
                                    style={{ 
                                      backgroundColor: theme.colors.warning + '15',
                                      color: theme.colors.warning
                                    }}
                                    onClick={() => console.log('Reponer stock:', variant.variant_name)}
                                    title="Reponer stock"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )) || []}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              onEdit={(product) => console.log('Editar:', product)}
              onDelete={(product) => console.log('Eliminar:', product)}
              onRefresh={() => {
                console.log('Refrescando inventario...')
                fetchItems()
              }}
            />
          )}
        </div>
      )
    },
    {
      id: 'movements',
      label: 'Movimientos de Inventario',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                Movimientos de Inventario
              </h3>
              <p style={{ color: theme.colors.textSecondary }}>
                Registro completo de entradas, salidas, transferencias y ajustes de inventario
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={() => console.log('Registrar entrada')}
                style={{ 
                  borderColor: theme.colors.success,
                  color: theme.colors.success
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Entrada
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => console.log('Registrar salida')}
                style={{ 
                  borderColor: theme.colors.error,
                  color: theme.colors.error
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                Salida
              </Button>
              
              <Button 
                onClick={() => console.log('Ajuste de inventario')}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                  border: 'none'
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Ajustar Stock
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.textPrimary }}>
                    Tipo de Movimiento
                  </label>
                  <select className="w-full px-3 py-2 rounded-md border" style={{ 
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background
                  }}>
                    <option>Todos</option>
                    <option>Entrada</option>
                    <option>Salida</option>
                    <option>Transferencia</option>
                    <option>Ajuste</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.textPrimary }}>
                    Fecha Desde
                  </label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 rounded-md border"
                    style={{ 
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.background
                    }}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.textPrimary }}>
                    Fecha Hasta
                  </label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 rounded-md border"
                    style={{ 
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.background
                    }}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.textPrimary }}>
                    Producto
                  </label>
                  <input 
                    type="text" 
                    placeholder="Buscar producto..."
                    className="w-full px-3 py-2 rounded-md border"
                    style={{ 
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.background
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Movimientos */}
          {loadingMovements ? (
            // Skeleton loading para la tabla de movimientos
            <div 
              className="rounded-lg shadow-sm border overflow-hidden"
              style={{ 
                backgroundColor: theme.colors.surface, 
                borderColor: theme.colors.border 
              }}
            >
              <div className="p-6 border-b" style={{ borderColor: theme.colors.border }}>
                <div className="animate-pulse">
                  <div 
                    className="h-6 rounded w-1/3 mb-2" 
                    style={{ backgroundColor: theme.colors.border + '40' }}
                  ></div>
                  <div 
                    className="h-4 rounded w-1/2" 
                    style={{ backgroundColor: theme.colors.border + '30' }}
                  ></div>
                </div>
              </div>
              <div className="divide-y" style={{ borderColor: theme.colors.border + '30' }}>
                {Array(5).fill(0).map((_, index) => (
                  <div key={index} className="p-6 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-16 h-6 rounded-full" 
                        style={{ backgroundColor: theme.colors.border + '40' }}
                      ></div>
                      <div className="flex-1 space-y-2">
                        <div 
                          className="h-4 rounded w-3/4" 
                          style={{ backgroundColor: theme.colors.border + '40' }}
                        ></div>
                        <div 
                          className="h-3 rounded w-1/2" 
                          style={{ backgroundColor: theme.colors.border + '30' }}
                        ></div>
                      </div>
                      <div 
                        className="w-12 h-4 rounded" 
                        style={{ backgroundColor: theme.colors.border + '40' }}
                      ></div>
                      <div 
                        className="w-16 h-4 rounded" 
                        style={{ backgroundColor: theme.colors.border + '40' }}
                      ></div>
                      <div 
                        className="w-20 h-4 rounded" 
                        style={{ backgroundColor: theme.colors.border + '40' }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : movements.length === 0 ? (
            // Estado vacío
            <div 
              className="rounded-lg shadow-sm border p-12 text-center"
              style={{ 
                backgroundColor: theme.colors.surface, 
                borderColor: theme.colors.border 
              }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.colors.secondary + '20' }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={theme.colors.secondary}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                No hay movimientos registrados
              </h3>
              <p style={{ color: theme.colors.textSecondary }} className="mb-4">
                Los movimientos de inventario aparecerán aquí cuando registres entradas, salidas o ajustes
              </p>
              <Button
                onClick={() => console.log('Registrar primer movimiento')}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                  border: 'none'
                }}
              >
                Registrar Primer Movimiento
              </Button>
            </div>
          ) : (
            <ModernTable
              data={movements}
            columns={[
              {
                key: 'type',
                title: 'Tipo',
                sortable: true,
                render: (value) => (
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium flex items-center w-fit"
                    style={{
                      backgroundColor: 
                        value === 'entrada' ? theme.colors.success + '20' :
                        value === 'salida' ? theme.colors.error + '20' :
                        value === 'transferencia' ? theme.colors.secondary + '20' :
                        theme.colors.warning + '20',
                      color:
                        value === 'entrada' ? theme.colors.success :
                        value === 'salida' ? theme.colors.error :
                        value === 'transferencia' ? theme.colors.secondary :
                        theme.colors.warning
                    }}
                  >
                    {value === 'entrada' && (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                    )}
                    {value === 'salida' && (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    )}
                    {value === 'transferencia' && (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    )}
                    {value === 'ajuste' && (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    )}
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </span>
                )
              },
              {
                key: 'product_name',
                title: 'Producto',
                sortable: true,
                render: (value, row) => (
                  <div>
                    <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                      {value}
                    </div>
                    <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      {row.variant_name} • SKU: {row.sku}
                    </div>
                  </div>
                )
              },
              {
                key: 'quantity',
                title: 'Cantidad',
                sortable: true,
                render: (value) => (
                  <span 
                    className="font-semibold"
                    style={{ 
                      color: value > 0 ? theme.colors.success : theme.colors.error 
                    }}
                  >
                    {value > 0 ? '+' : ''}{value}
                  </span>
                )
              },
              {
                key: 'total_cost',
                title: 'Valor',
                sortable: true,
                render: (value) => (
                  <span 
                    className="font-medium"
                    style={{ 
                      color: value === 0 ? theme.colors.textSecondary : 
                             value > 0 ? theme.colors.success : theme.colors.error 
                    }}
                  >
                    {value === 0 ? '-' : `$${Math.abs(value).toFixed(2)}`}
                  </span>
                )
              },
              {
                key: 'location_from',
                title: 'Origen → Destino',
                render: (value, row) => (
                  <div className="text-sm">
                    <div style={{ color: theme.colors.textPrimary }}>
                      {value}
                    </div>
                    <div className="flex items-center mt-1" style={{ color: theme.colors.textSecondary }}>
                      <svg className="w-3 h-3 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      {row.location_to}
                    </div>
                  </div>
                )
              },
              {
                key: 'date',
                title: 'Fecha',
                sortable: true,
                render: (value) => (
                  <div className="text-sm">
                    <div style={{ color: theme.colors.textPrimary }}>
                      {new Date(value).toLocaleDateString()}
                    </div>
                    <div style={{ color: theme.colors.textSecondary }}>
                      {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              },
              {
                key: 'user',
                title: 'Usuario',
                render: (value) => (
                  <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    {value}
                  </span>
                )
              }
            ]}
            renderExpandedRow={(row) => (
              <div className="p-6 rounded-lg border-l-4" style={{ 
                backgroundColor: theme.colors.surface, 
                borderLeftColor: 
                  row.type === 'entrada' ? theme.colors.success :
                  row.type === 'salida' ? theme.colors.error :
                  row.type === 'transferencia' ? theme.colors.secondary :
                  theme.colors.warning,
                borderColor: theme.colors.border + '40'
              }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: theme.colors.primary }}>
                      Detalles del Movimiento
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span style={{ color: theme.colors.textSecondary }}>Referencia:</span>
                        <span className="ml-2 font-mono" style={{ color: theme.colors.textPrimary }}>
                          {row.reference}
                        </span>
                      </p>
                      <p>
                        <span style={{ color: theme.colors.textSecondary }}>Motivo:</span>
                        <span className="ml-2" style={{ color: theme.colors.textPrimary }}>
                          {row.reason}
                        </span>
                      </p>
                      <p>
                        <span style={{ color: theme.colors.textSecondary }}>Usuario:</span>
                        <span className="ml-2" style={{ color: theme.colors.textPrimary }}>
                          {row.user}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: theme.colors.primary }}>
                      Información Financiera
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span style={{ color: theme.colors.textSecondary }}>Costo Unitario:</span>
                        <span className="ml-2 font-medium" style={{ color: theme.colors.textPrimary }}>
                          ${row.unit_cost.toFixed(2)}
                        </span>
                      </p>
                      <p>
                        <span style={{ color: theme.colors.textSecondary }}>Cantidad:</span>
                        <span 
                          className="ml-2 font-medium" 
                          style={{ 
                            color: row.quantity > 0 ? theme.colors.success : theme.colors.error 
                          }}
                        >
                          {row.quantity > 0 ? '+' : ''}{row.quantity}
                        </span>
                      </p>
                      <p>
                        <span style={{ color: theme.colors.textSecondary }}>Valor Total:</span>
                        <span 
                          className="ml-2 font-semibold" 
                          style={{ 
                            color: row.total_cost === 0 ? theme.colors.textSecondary : 
                                   row.total_cost > 0 ? theme.colors.success : theme.colors.error 
                          }}
                        >
                          {row.total_cost === 0 ? 'Sin costo' : `$${Math.abs(row.total_cost).toFixed(2)}`}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: theme.colors.primary }}>
                      Acciones
                    </h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => console.log('Ver detalles completos:', row.id)}
                      >
                        Ver Detalles
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => console.log('Descargar comprobante:', row.id)}
                      >
                        Descargar PDF
                      </Button>
                      
                      {row.type === 'ajuste' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          style={{ 
                            borderColor: theme.colors.error + '50',
                            color: theme.colors.error 
                          }}
                          onClick={() => console.log('Revertir ajuste:', row.id)}
                        >
                          Revertir
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            onEdit={(movement) => console.log('Editar movimiento:', movement)}
            onDelete={(movement) => console.log('Eliminar movimiento:', movement)}
            onRefresh={() => {
              console.log('Refrescando movimientos...')
              fetchMovements()
            }}
          />
          )}
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-4" style={{ border: `2px solid ${theme.colors.border}`, borderTop: `2px solid ${theme.colors.primary}` }}></div>
          <p style={{ color: theme.colors.textPrimary }}>Cargando inventario...</p>
        </div>
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <p style={{ color: theme.colors.error }}>Error cargando el proyecto</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ProjectPageLayout
      projectData={projectData}
      loading={loading}
      pageTitle="Gestión de Inventario"
    >
      <Tabs tabs={inventoryTabs} defaultTab="overview" />
    </ProjectPageLayout>
  )
}