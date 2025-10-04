'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
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

export default function ProductsPage({ params }: { params: { projectId: string } }) {
  const { user, isLoading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const projectSlug = params.projectId
  
  const [projectData, setProjectData] = useState<ProjectProductsData | null>(null)
  const [loading, setLoading] = useState(true)

  // El middleware maneja la autenticación automáticamente
  useEffect(() => {
    // Cargar datos incluso si authLoading aún está en proceso
    if ((user || !authLoading) && params.projectId) {
      loadProjectData()
    }
  }, [user, authLoading, params.projectId])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      
      // Mock data para demostración
      setProjectData({ 
        project: { 
          project_id: params.projectId, 
          project_name: "BRUMA Fightwear", 
          project_slug: "bruma-fightwear",
          project_type: "ecommerce"
        } 
      })
      
    } catch (error) {
      console.error('Error loading project data:', error)
    } finally {
      setLoading(false)
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

  const productsTabs = [
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
          {/* Herramientas de Búsqueda y Filtrado */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle style={{ color: theme.colors.textPrimary }}>Catálogo de Productos</CardTitle>
                  <CardDescription style={{ color: theme.colors.textSecondary }}>
                    Gestiona tu inventario de productos de MMA y fightwear
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" style={{ borderColor: theme.colors.border }}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                    </svg>
                    Vista Tabla
                  </Button>
                  <Button style={{ backgroundColor: theme.colors.primary }}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Producto
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>


              {/* Tabla de Productos usando ModernTable */}
              <ModernTable
                data={[
                  {
                    id: 1,
                    name: "Guantes de Boxeo Pro",
                    sku: "GBP-001",
                    category: "Guantes",
                    price: 2450,
                    stock: 45,
                    status: "active",
                    sales: 127
                  },
                  {
                    id: 2,
                    name: "Shorts MMA Competition",
                    sku: "SMC-002", 
                    category: "Shorts",
                    price: 1890,
                    stock: 23,
                    status: "active",
                    sales: 89
                  },
                  {
                    id: 3,
                    name: "Protector Bucal Pro",
                    sku: "PBP-003",
                    category: "Protecciones",
                    price: 450,
                    stock: 0,
                    status: "outofstock",
                    sales: 203
                  },
                  {
                    id: 4,
                    name: "Rashguard Compression",
                    sku: "RC-004",
                    category: "Rashguards",
                    price: 1650,
                    stock: 67,
                    status: "active",
                    sales: 156
                  },
                  {
                    id: 5,
                    name: "Vendas de Boxeo",
                    sku: "VB-005",
                    category: "Accesorios",
                    price: 290,
                    stock: 145,
                    status: "active",
                    sales: 312
                  },
                  {
                    id: 6,
                    name: "Casco de Sparring",
                    sku: "CS-006",
                    category: "Protecciones",
                    price: 3200,
                    stock: 12,
                    status: "lowstock",
                    sales: 34
                  },
                  {
                    id: 7,
                    name: "Espinilleras MMA",
                    sku: "EMM-007",
                    category: "Protecciones",
                    price: 1850,
                    stock: 28,
                    status: "active",
                    sales: 76
                  },
                  {
                    id: 8,
                    name: "Camiseta Training",
                    sku: "CT-008",
                    category: "Ropa",
                    price: 650,
                    stock: 89,
                    status: "active",
                    sales: 234
                  }
                ]}
                columns={[
                  { key: 'name', title: 'Producto', sortable: true },
                  { key: 'sku', title: 'SKU', sortable: true },
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
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'dashboard',
      label: 'Dashboard de Productos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* KPIs de Productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Total de Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>156</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>+12 este mes</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Productos Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>142</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>91% del total</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Valor del Inventario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>$892K</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.warning }}>-3% vs mes anterior</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Productos Bajo Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>8</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.error }}>Requieren atención</p>
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
                             style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
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
      id: 'management',
      label: 'Gestión Avanzada',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Herramientas de Gestión Masiva */}
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>Gestión Masiva</CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Herramientas para gestionar múltiples productos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full" style={{ backgroundColor: theme.colors.primary }}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Importar Productos (CSV/Excel)
                  </Button>
                  <Button variant="outline" className="w-full" style={{ borderColor: theme.colors.border }}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    Exportar Catálogo Completo
                  </Button>
                  <Button variant="outline" className="w-full" style={{ borderColor: theme.colors.border }}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h4a2 2 0 002-2l-2-9M10 11h4m-2 2v6" />
                    </svg>
                    Actualizar Precios Masivamente
                  </Button>
                  <Button variant="outline" className="w-full" style={{ borderColor: theme.colors.border }}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar Productos Inactivos
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alertas y Notificaciones */}
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>Alertas del Sistema</CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Notificaciones importantes sobre tu inventario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      type: "warning",
                      title: "Stock Bajo",
                      message: "8 productos con menos de 10 unidades",
                      action: "Ver Productos"
                    },
                    {
                      type: "error", 
                      title: "Sin Stock",
                      message: "3 productos completamente agotados",
                      action: "Reabastecer"
                    },
                    {
                      type: "info",
                      title: "Nuevos Pedidos",
                      message: "12 productos solicitados por clientes",
                      action: "Revisar"
                    },
                    {
                      type: "success",
                      title: "Productos Populares",
                      message: "5 productos superaron las ventas esperadas",
                      action: "Ver Detalles"
                    }
                  ].map((alert, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        alert.type === 'warning' ? 'bg-yellow-500' :
                        alert.type === 'error' ? 'bg-red-500' :
                        alert.type === 'info' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <h4 className="font-medium" style={{ color: theme.colors.textPrimary }}>{alert.title}</h4>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{alert.message}</p>
                        <Button variant="outline" size="sm" className="mt-2" style={{ borderColor: theme.colors.border }}>
                          {alert.action}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuración de Categorías y Atributos */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>Configuración de Categorías</CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Gestiona las categorías y atributos de tus productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Guantes", products: 32, subcategories: 4 },
                  { name: "Protecciones", products: 28, subcategories: 6 },
                  { name: "Shorts", products: 24, subcategories: 3 },
                  { name: "Rashguards", products: 22, subcategories: 2 },
                  { name: "Accesorios", products: 35, subcategories: 8 },
                  { name: "Equipamiento", products: 15, subcategories: 5 }
                ].map((category, index) => (
                  <div key={index} className="p-4 rounded-lg border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                    <h4 className="font-medium mb-2" style={{ color: theme.colors.textPrimary }}>{category.name}</h4>
                    <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>
                      {category.products} productos
                    </p>
                    <p className="text-xs mb-3" style={{ color: theme.colors.textSecondary }}>
                      {category.subcategories} subcategorías
                    </p>
                    <Button variant="outline" size="sm" className="w-full" style={{ borderColor: theme.colors.border }}>
                      Gestionar
                    </Button>
                  </div>
                ))}
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
      pageTitle="Gestión de Productos"
    >
      <div className="p-6">
        <Tabs tabs={productsTabs} />
      </div>
    </ProjectPageLayout>
  )
}
