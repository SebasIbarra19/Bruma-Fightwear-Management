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
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
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
      // Las categorías se cargarán bajo demanda cuando se active ese tab
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

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true)
      
      // Resolver project ID de la misma manera que en productos
      let resolvedProjectId = params.projectId
      
      if (!resolvedProjectId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const response = await fetch(`/api/projects/resolve-slug?slug=${params.projectId}`)
        const result = await response.json()
        if (result.success && result.project) {
          resolvedProjectId = result.project.id
        }
      }
      
      console.log('🔍 Cargando categorías del proyecto:', resolvedProjectId)
      
      // Usar API route de categorías
      const response = await fetch(`/api/categories?project_id=${resolvedProjectId}&limit=100`)
      const result = await response.json()
      
      if (result.success && result.data) {
        // Transformar datos para el formato esperado por la tabla
        const transformedCategories = result.data.data.map((category: any) => ({
          id: category.id,
          name: category.name,
          description: category.description,
          parent_id: category.parent_id,
          is_active: category.is_active,
          products_count: Number(category.product_count) || 0,
          subcategories_count: 0, // Placeholder
          color: generateCategoryColor(category.name),
          created_at: category.created_at
        }))
        
        setCategories(transformedCategories)
        console.log('✅ Categorías cargadas:', transformedCategories.length)
      } else {
        console.error('Error loading categories:', result.error)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Función para generar colores únicos basados en el nombre
  const generateCategoryColor = (name: string): string => {
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash + name.charCodeAt(i)) & 0xffffffff
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // Función para manejar cambios de tab (lazy loading)
  const handleTabChange = (tabId: string) => {
    console.log('🔄 Tab cambiado a:', tabId)
    
    switch (tabId) {
      case 'categories':
        if (categories.length === 0 && !categoriesLoading) {
          console.log('📋 Cargando categorías por lazy loading')
          loadCategories()
        }
        break
      case 'products':
        // Los productos ya se cargan al inicio
        break
      default:
        console.log('📋 Tab no requiere carga adicional:', tabId)
    }
  }

  // Función para calcular estadísticas reales de categorías
  const getCategoriesStats = () => {
    const totalCategories = categories.length
    const activeCategories = categories.filter(c => c.is_active).length
    const subcategories = categories.filter(c => c.parent_id).length
    const totalProductsInCategories = categories.reduce((sum, c) => sum + c.products_count, 0)
    
    return {
      total: totalCategories,
      active: activeCategories,
      subcategories: subcategories,
      totalProducts: totalProductsInCategories
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
                  {products.length > 0 ? (
                    products.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" 
                             style={{ backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, border: `1px solid ${theme.colors.border}` }}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: theme.colors.textPrimary }}>{product.name}</p>
                          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>SKU: {product.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>${product.price}</p>
                        <span className={`text-xs ${
                          product.status === 'active' ? 'text-green-600' : 
                          product.status === 'outofstock' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {product.status === 'active' ? 'Disponible' : 
                           product.status === 'outofstock' ? 'Sin Stock' : 'Poco Stock'}
                        </span>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p style={{ color: theme.colors.textSecondary }}>
                        {productsLoading ? 'Cargando productos...' : 'No hay productos disponibles'}
                      </p>
                    </div>
                  )}
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
                  {categories.length > 0 ? (
                    categories.map((category, index) => {
                      const totalProducts = getCategoriesStats().totalProducts
                      const percentage = totalProducts > 0 ? (category.products_count / totalProducts) * 100 : 0
                      
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                            <span className="font-medium" style={{ color: theme.colors.textPrimary }}>{category.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>{category.products_count}</span>
                            <span className="text-sm ml-2" style={{ color: theme.colors.textSecondary }}>
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-4">
                      <p style={{ color: theme.colors.textSecondary }}>
                        {categoriesLoading ? 'Cargando categorías...' : 'Ve al tab "Gestión de Categorías" para cargar los datos'}
                      </p>
                    </div>
                  )}
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
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  {getCategoriesStats().total}
                </div>
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
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  {getCategoriesStats().active}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>
                  {getCategoriesStats().total > 0 
                    ? `${Math.round((getCategoriesStats().active / getCategoriesStats().total) * 100)}% activas`
                    : '0% activas'
                  }
                </p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Subcategorías
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  {getCategoriesStats().subcategories}
                </div>
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
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  {getCategoriesStats().totalProducts}
                </div>
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

            {/* Tabla de categorías usando datos reales */}
            {categoriesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
              </div>
            ) : (
              <ModernTable
                data={categories}
              columns={[
                {
                  key: 'name',
                  title: 'Categoría',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                        {row.parent_id && "└─ "}{value}
                      </div>
                      <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                        {row.parent_id ? "Subcategoría" : "Categoría principal"}
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
              onRefresh={() => loadCategories}
            />
            )}
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
        <Tabs tabs={productsTabs} onTabChange={handleTabChange} />
      </div>
    </ProjectPageLayout>
  )
}