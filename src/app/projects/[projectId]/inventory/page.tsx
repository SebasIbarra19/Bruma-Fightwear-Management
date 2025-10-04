'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { ProjectPageLayout } from '@/components/layout/ProjectPageLayout'

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
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>1,234</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>+12 nuevos este mes</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Stock Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>8,456</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.warning }}>-5% vs mes anterior</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Productos Bajo Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>23</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.error }}>Requieren reposición</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Valor del Inventario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>$156,789</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>+8% vs mes anterior</p>
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
                <div className="space-y-3">
                  {[
                    { name: 'Guantes BRUMA Pro', stock: 5, minStock: 20, status: 'critical' },
                    { name: 'Shorts MMA Elite', stock: 12, minStock: 25, status: 'warning' },
                    { name: 'Vendas Elásticas', stock: 8, minStock: 30, status: 'critical' },
                    { name: 'Protector Bucal', stock: 18, minStock: 50, status: 'warning' }
                  ].map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                          {product.name}
                        </p>
                        <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                          Stock actual: {product.stock} | Mínimo: {product.minStock}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.status === 'critical' 
                              ? 'text-red-700' 
                              : 'text-yellow-700'
                          }`}
                          style={{ 
                            backgroundColor: product.status === 'critical' 
                              ? theme.colors.error + '20' 
                              : theme.colors.warning + '20',
                            border: `1px solid ${product.status === 'critical' ? theme.colors.error : theme.colors.warning}30`
                          }}
                        >
                          {product.status === 'critical' ? 'Crítico' : 'Bajo'}
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          style={{ 
                            borderColor: theme.colors.border,
                            color: theme.colors.textSecondary
                          }}
                        >
                          Reponer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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

          {/* Tabla de productos */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: theme.colors.background }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                        Stock Actual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                        Stock Mínimo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                    {[
                      { name: 'Guantes BRUMA Pro', sku: 'GBP-001', current: 5, min: 20, status: 'critical' },
                      { name: 'Shorts MMA Elite', sku: 'SME-002', current: 45, min: 25, status: 'good' },
                      { name: 'Vendas Elásticas', sku: 'VE-003', current: 8, min: 30, status: 'critical' },
                      { name: 'Protector Bucal', sku: 'PB-004', current: 18, min: 50, status: 'warning' },
                      { name: 'Camiseta Training', sku: 'CT-005', current: 85, min: 40, status: 'good' }
                    ].map((product, index) => (
                      <tr key={index} className="hover:bg-opacity-5" style={{ backgroundColor: theme.colors.surfaceHover + '10' }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            {product.sku}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                            {product.current}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            {product.min}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              product.status === 'critical' ? 'text-red-700' :
                              product.status === 'warning' ? 'text-yellow-700' : 'text-green-700'
                            }`}
                            style={{ 
                              backgroundColor: 
                                product.status === 'critical' ? theme.colors.error + '20' :
                                product.status === 'warning' ? theme.colors.warning + '20' : theme.colors.success + '20',
                              border: `1px solid ${
                                product.status === 'critical' ? theme.colors.error :
                                product.status === 'warning' ? theme.colors.warning : theme.colors.success
                              }30`
                            }}
                          >
                            {product.status === 'critical' ? 'Crítico' :
                             product.status === 'warning' ? 'Bajo' : 'Bueno'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              Editar
                            </Button>
                            {product.status !== 'good' && (
                              <Button size="sm" style={{ backgroundColor: theme.colors.primary }}>
                                Reponer
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.colors.secondary + '20' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={theme.colors.secondary}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
            Historial de Movimientos
          </h3>
          <p style={{ color: theme.colors.textSecondary }}>
            Registro completo de entradas, salidas, transferencias y ajustes de inventario
          </p>
        </div>
      )
    },
    {
      id: 'reports',
      label: 'Reportes de Inventario',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.colors.primary + '20' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={theme.colors.primary}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
            Reportes e Informes
          </h3>
          <p style={{ color: theme.colors.textSecondary }}>
            Genera reportes personalizados de valorización, rotación y análisis de inventario
          </p>
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