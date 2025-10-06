'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { dataAccess } from '@/lib/unified-data-access'
import type { Product, ApiResponse, PaginatedResponse } from '@/types/data-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { ModernTable } from '@/components/ui/modern-table'
import { ProjectPageLayout } from '@/components/layout/ProjectPageLayout'

interface UserProject {
  project_id: string
  project_name: string
  project_slug: string
  project_type: string
}

interface ProjectProductsData {
  project: UserProject
}

interface ProductTableRow {
  id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  status: 'active' | 'outofstock' | 'lowstock'
  sales: number
}

export default function ProductsPage({ params }: { params: { projectId: string } }) {
  const { user, isLoading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const projectSlug = params.projectId
  
  const [projectData, setProjectData] = useState<ProjectProductsData | null>(null)
  const [products, setProducts] = useState<ProductTableRow[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // El middleware maneja la autenticación automáticamente
  useEffect(() => {
    // Cargar datos incluso si authLoading aún está en proceso
    if ((user || !authLoading) && params.projectId) {
      loadProjectData()
    }
  }, [user, authLoading, params.projectId])

  // Función auxiliar para calcular estadísticas de productos
  const getProductStats = () => {
    const totalProducts = products.length
    const activeProducts = products.filter(p => p.status === 'active').length
    const outOfStockProducts = products.filter(p => p.status === 'outofstock').length
    const lowStockProducts = products.filter(p => p.status === 'lowstock').length
    
    return {
      total: totalProducts,
      active: activeProducts,
      outOfStock: outOfStockProducts,
      lowStock: lowStockProducts
    }
  }

  const loadProjectData = async () => {
    try {
      setLoading(true)
      
      // 🎯 DIRECTO: Usar datos conocidos del proyecto BRUMA
      console.log('🏗️ Cargando datos del proyecto BRUMA')
      
      setProjectData({ 
        project: { 
          project_id: '4cffbb29-0a5b-414c-86c0-9509a19485d3', 
          project_name: 'BRUMA Fightwear', 
          project_slug: 'bruma-fightwear',
          project_type: 'ecommerce'
        } 
      })
      
      // Cargar productos del proyecto
      await loadProducts()
      
    } catch (error) {
      console.error('Error loading project data:', error)
      // En caso de error, usar datos básicos y intentar cargar productos
      setProjectData({ 
        project: { 
          project_id: params.projectId, 
          project_name: "BRUMA Fightwear", 
          project_slug: "bruma-fightwear",
          project_type: "ecommerce"
        } 
      })
      await loadProducts()
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      setProductsLoading(true)
      setProductsError(null)
      
      // 🎯 USAR PROJECT RESOLVER CON AUTH CORREGIDA
      let resolvedProjectId = params.projectId
      
      // Si no es un UUID, convertir slug a project ID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.projectId)) {
        console.log('🔍 Resolviendo slug a project ID:', params.projectId)
        
        // Importar dinámicamente para evitar problemas de SSR
        const { getProjectIdFromSlug } = await import('@/lib/project-resolver')
        const projectId = await getProjectIdFromSlug(params.projectId)
        
        if (!projectId) {
          throw new Error(`No se encontró proyecto con slug: ${params.projectId}`)
        }
        
        resolvedProjectId = projectId
        console.log('✅ Project ID resuelto:', resolvedProjectId)
      }
      
      console.log('🔍 Cargando productos del proyecto:', resolvedProjectId)
      
      // Usar API route temporalmente hasta resolver el problema del stored procedure
      const apiUrl = `/api/products?project_id=${resolvedProjectId}&page=1&limit=50`
      console.log('📤 Llamando API:', apiUrl)
      
      const response = await fetch(apiUrl)
      console.log('📊 Response status:', response.status)
      
      const result = await response.json()
      console.log('📋 Response data:', JSON.stringify(result, null, 2))
      
      if (result.success && result.data) {
        // Transformar datos de la BD al formato esperado por la tabla
        const transformedProducts: ProductTableRow[] = result.data.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: 'Producto', // Placeholder - podríamos hacer join con categories
          price: Number(product.base_price) || 0,
          stock: 0, // Placeholder - necesitaríamos datos de inventory
          status: product.is_active ? 'active' : 'outofstock' as const,
          sales: 0 // Placeholder - necesitaríamos datos de orders
        }))
        
        setProducts(transformedProducts)
      } else {
        setProductsError(result.error || 'Error al cargar productos')
        console.error('Error loading products:', result.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setProductsError(errorMessage)
      console.error('Error loading products:', error)
    } finally {
      setProductsLoading(false)
    }
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

  const stats = getProductStats()
  const totalValue = products.reduce((sum, product) => sum + (product.price * Math.max(product.stock, 1)), 0)

  const productsTabs = [
    {
      id: 'overview',
      label: 'Resumen de Productos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* KPIs de Productos - Datos Reales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Total de Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  {productsLoading ? '...' : stats.total}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>
                  Desde la base de datos
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Productos Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  {productsLoading ? '...' : stats.active}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>
                  {stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% del total` : '0% del total'}
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Sin Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  {productsLoading ? '...' : stats.outOfStock}
                </div>
                <p className="text-xs mt-1" style={{ color: stats.outOfStock > 0 ? theme.colors.warning : theme.colors.textSecondary }}>
                  {stats.outOfStock > 0 ? 'Requieren atención' : 'Todo en stock'}
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Valor Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  {productsLoading ? '...' : `$${(totalValue / 1000).toFixed(0)}K`}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                  Valor de productos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Productos y Categorías */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>Top 5 Productos Más Vendidos</CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Productos con mayor volumen de ventas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Vendas de Boxeo", sales: 312, revenue: "$90,480", trend: "+15%" },
                    { name: "Protector Bucal Pro", sales: 203, revenue: "$91,350", trend: "+8%" },
                    { name: "Rashguard Compression", sales: 156, revenue: "$257,400", trend: "+22%" },
                    { name: "Guantes de Boxeo Pro", sales: 127, revenue: "$311,150", trend: "+5%" },
                    { name: "Shorts MMA Competition", sales: 89, revenue: "$168,210", trend: "-3%" }
                  ].map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" 
                             style={{ backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, border: `1px solid ${theme.colors.border}` }}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: theme.colors.textPrimary }}>{product.name}</p>
                          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{product.sales} vendidos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>{product.revenue}</p>
                        <span className={`text-xs ${
                          product.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>Distribución por Categorías</CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Productos por categoría de fightwear
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { category: "Guantes", count: 32, percentage: 20.5, color: "bg-blue-500" },
                    { category: "Protecciones", count: 28, percentage: 17.9, color: "bg-green-500" },
                    { category: "Shorts", count: 24, percentage: 15.4, color: "bg-yellow-500" },
                    { category: "Rashguards", count: 22, percentage: 14.1, color: "bg-purple-500" },
                    { category: "Accesorios", count: 35, percentage: 22.4, color: "bg-red-500" },
                    { category: "Otros", count: 15, percentage: 9.6, color: "bg-gray-500" }
                  ].map((cat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                        <span className="font-medium" style={{ color: theme.colors.textPrimary }}>{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>{cat.count}</span>
                        <span className="text-sm ml-2" style={{ color: theme.colors.textSecondary }}>
                          ({cat.percentage}%)
                        </span>
                      </div>
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
      id: 'catalog',
      label: 'Catálogo de Productos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* ESTRUCTURA PERFECTA - Como Control de Stock */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                  Catálogo de Productos
                </h3>
                <p style={{ color: theme.colors.textSecondary }}>
                  Gestiona tu inventario de productos fightwear
                </p>
              </div>
              <Button 
                className="shadow-lg"
                onClick={() => console.log('Crear nuevo producto')}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                  border: 'none'
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Producto
              </Button>
            </div>

            {/* Mostrar estado de carga o error */}
            {productsLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mr-3" style={{ borderColor: theme.colors.primary }}></div>
                <span style={{ color: theme.colors.textSecondary }}>Cargando productos...</span>
              </div>
            )}
            
            {productsError && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p style={{ color: theme.colors.error }} className="mb-2">Error al cargar productos: {productsError}</p>
                  <Button 
                    onClick={() => loadProducts()}
                    variant="outline"
                    size="sm"
                  >
                    Intentar nuevamente
                  </Button>
                </div>
              </div>
            )}

            {!productsLoading && !productsError && (
              <>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <p style={{ color: theme.colors.textSecondary }}>No hay productos en este proyecto</p>
                    <Button 
                      className="mt-4"
                      onClick={() => console.log('Crear primer producto')}
                      style={{ 
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                        border: 'none'
                      }}
                    >
                      Crear primer producto
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <p style={{ color: theme.colors.textSecondary }}>
                        {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
                      </p>
                      <Button 
                        onClick={() => loadProducts()}
                        variant="outline"
                        size="sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Actualizar
                      </Button>
                    </div>
                    
                    {/* Tabla de Productos usando ModernTable con datos reales */}
                    <ModernTable
                      data={products}
              columns={[
                { 
                  key: 'name', 
                  title: 'Producto', 
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="font-medium" style={{ color: theme.colors.textPrimary }}>{value}</div>
                      <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        SKU: {row.sku}
                      </div>
                    </div>
                  )
                },
                { key: 'category', title: 'Categoría', sortable: true },
                { 
                  key: 'price', 
                  title: 'Precio',
                  sortable: true,
                  render: (value) => `$${value.toLocaleString()}`
                },
                { key: 'stock', title: 'Stock', sortable: true },
                { key: 'sales', title: 'Vendidos', sortable: true },
                {
                  key: 'status',
                  title: 'Estado',
                  render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value === 'active' ? 'bg-green-100 text-green-800' :
                      value === 'outofstock' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {value === 'active' ? 'Activo' :
                       value === 'outofstock' ? 'Sin Stock' : 'Poco Stock'}
                    </span>
                  )
                }
              ]}
              renderExpandedRow={(row) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.primary }}>Detalles del Producto</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">SKU:</span> {row.sku}</p>
                      <p><span className="text-gray-400">Categoría:</span> {row.category}</p>
                      <p><span className="text-gray-400">Stock actual:</span> {row.stock} unidades</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.success }}>Información de Ventas</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Precio:</span> ${row.price.toLocaleString()}</p>
                      <p><span className="text-gray-400">Vendidos:</span> {row.sales} unidades</p>
                      <p><span className="text-gray-400">Ingresos:</span> ${(row.price * row.sales).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.warning }}>Acciones</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar Producto
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2z" />
                        </svg>
                        Ver Estadísticas
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              onEdit={(product) => console.log('Editar:', product)}
              onDelete={(product) => console.log('Eliminar:', product)}
              onRefresh={() => console.log('Refrescar productos')}
            />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'categories',
      label: 'Gestión de Categorías',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* Estadísticas rápidas de categorías */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Total Categorías
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>8</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>Incluyendo subcategorías</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Categorías Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>8</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>100% activas</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Subcategorías
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>4</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>Categorías anidadas</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Total Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>156</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>En todas las categorías</p>
              </CardContent>
            </Card>
          </div>

          {/* ESTRUCTURA PERFECTA - Como Control de Stock */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                  Categorías del Proyecto
                </h3>
                <p style={{ color: theme.colors.textSecondary }}>
                  Gestión completa de categorías y subcategorías
                </p>
              </div>
              <Button 
                className="shadow-lg"
                onClick={() => console.log('Crear nueva categoría')}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                  border: 'none'
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Categoría
              </Button>
            </div>

            {/* Tabla de categorías usando ModernTable */}
            <ModernTable
              data={[
                {
                  id: "1",
                  name: "Guantes",
                  description: "Guantes de combate y entrenamiento",
                  parent_id: undefined,
                  is_active: true,
                  products_count: 32,
                  subcategories_count: 3,
                  color: "#3B82F6",
                  created_at: "2024-01-15"
                },
                {
                  id: "2", 
                  name: "Shorts",
                  description: "Shorts para MMA y entrenamiento",
                  parent_id: undefined,
                  is_active: true,
                  products_count: 24,
                  subcategories_count: 2,
                  color: "#10B981",
                  created_at: "2024-01-20"
                },
                {
                  id: "3",
                  name: "Protecciones",
                  description: "Equipos de protección para combate",
                  parent_id: undefined,
                  is_active: true,
                  products_count: 28,
                  subcategories_count: 4,
                  color: "#F59E0B",
                  created_at: "2024-02-01"
                },
                {
                  id: "4",
                  name: "Rashguards",
                  description: "Camisetas de compresión",
                  parent_id: undefined,
                  is_active: true,
                  products_count: 22,
                  subcategories_count: 0,
                  color: "#8B5CF6",
                  created_at: "2024-01-16"
                }
              ]}
              columns={[
                {
                  key: 'name',
                  title: 'Categoría',
                  sortable: true,
                  render: (value, row) => (
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-lg mr-4 flex items-center justify-center text-white font-bold" 
                           style={{ backgroundColor: row.color }}>
                        {row.parent_id ? "📂" : "📁"}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                          {row.parent_id && "└─ "}{value}
                        </div>
                        <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                          {row.parent_id ? "Subcategoría" : "Categoría principal"}
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'description',
                  title: 'Descripción',
                  sortable: false,
                  render: (value) => value || "Sin descripción"
                },
                {
                  key: 'products_count',
                  title: 'Productos',
                  sortable: true,
                  render: (value) => (
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.textPrimary,
                        border: `1px solid ${theme.colors.border}`
                      }}
                    >
                      {value} productos
                    </span>
                  )
                },
                {
                  key: 'subcategories_count',
                  title: 'Subcategorías',
                  sortable: true,
                  render: (value) => (
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: theme.colors.secondary + '20',
                        color: theme.colors.secondary
                      }}
                    >
                      {value} subcategorías
                    </span>
                  )
                },
                {
                  key: 'is_active',
                  title: 'Estado',
                  render: (value) => (
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: value ? theme.colors.success + '20' : theme.colors.border + '20',
                        color: value ? theme.colors.success : theme.colors.textSecondary
                      }}
                    >
                      {value ? 'Activa' : 'Inactiva'}
                    </span>
                  )
                }
              ]}
              renderExpandedRow={(row) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.primary }}>Información de Categoría</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Tipo:</span> {row.parent_id ? 'Subcategoría' : 'Categoría principal'}</p>
                      <p><span className="text-gray-400">Color:</span> 
                        <span className="inline-block w-4 h-4 rounded ml-2" style={{ backgroundColor: row.color }}></span>
                      </p>
                      <p><span className="text-gray-400">Creada:</span> {row.created_at}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.success }}>Estadísticas</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Productos:</span> {row.products_count}</p>
                      <p><span className="text-gray-400">Subcategorías:</span> {row.subcategories_count}</p>
                      <p><span className="text-gray-400">Estado:</span> {row.is_active ? 'Activa' : 'Inactiva'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.warning }}>Acciones</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar Categoría
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver Productos
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Agregar Subcategoría
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              onEdit={(category) => console.log('Editar:', category)}
              onDelete={(category) => console.log('Eliminar:', category)}
              onRefresh={() => console.log('Refrescar categorías')}
            />
          </div>
        </div>
      )
    }
  ]

  return (
    <ProjectPageLayout
      projectData={projectData}
      loading={loading}
      pageTitle="Gestión de Productos"
    >
      <div className="p-6">
        <Tabs tabs={productsTabs} />
      </div>
    </ProjectPageLayout>
  )
}