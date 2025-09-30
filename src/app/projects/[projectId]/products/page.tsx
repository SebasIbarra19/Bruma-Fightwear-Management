'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { ModernSidebar } from '@/components/ui/modern-sidebar'
import { Tabs } from '@/components/ui/tabs'
import { ThemeSelector } from '@/components/ui/theme-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Icons can be replaced with SVG or other icon components as needed
// import { Search, Plus, Package, Eye, Edit, TrendingUp, AlertTriangle } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  description: string
  price: number
  cost: number
  stock: number
  min_stock: number
  category: string
  status: 'active' | 'inactive' | 'discontinued'
  image_url?: string
}

interface Category {
  id: string
  name: string
  color: string
}

interface ProjectData {
  project: {
    project_id: string
    project_name: string
    project_slug: string
  }
}

export default function ProductsPage({ params }: { params: { projectId: string } }) {
  const { user, isLoading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  // El middleware maneja la autenticación automáticamente
  // Solo necesitamos el usuario para mostrar datos personalizados

  // Cargar datos del proyecto
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
          project_slug: "bruma-fightwear" 
        } 
      })
      
      // Mock products
      setProducts([
        {
          id: "1",
          name: "Guantes BRUMA Pro",
          sku: "GBP-001",
          description: "Guantes profesionales para MMA",
          price: 89.99,
          cost: 45.00,
          stock: 25,
          min_stock: 10,
          category: "guantes",
          status: "active"
        },
        {
          id: "2", 
          name: "Shorts MMA Elite",
          sku: "SME-002",
          description: "Shorts de combate premium",
          price: 65.99,
          cost: 32.00,
          stock: 3,
          min_stock: 5,
          category: "shorts",
          status: "active"
        },
        {
          id: "3",
          name: "Camiseta BRUMA Training",
          sku: "CBT-003",
          description: "Camiseta de entrenamiento técnica",
          price: 39.99,
          cost: 18.00,
          stock: 0,
          min_stock: 8,
          category: "camisetas",
          status: "inactive"
        }
      ])
      
      // Mock categories
      setCategories([
        { id: "guantes", name: "Guantes", color: "#3B82F6" },
        { id: "shorts", name: "Shorts", color: "#10B981" },
        { id: "camisetas", name: "Camisetas", color: "#F59E0B" }
      ])

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.name : 'Sin categoría'
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.color : '#6B7280'
  }

  // Mostrar loading si estamos cargando datos o verificando auth
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-4" style={{ border: `2px solid ${theme.colors.border}`, borderTop: `2px solid ${theme.colors.primary}` }}></div>
          <p style={{ color: theme.colors.textPrimary }}>Cargando productos...</p>
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

  const projectSlug = projectData.project.project_slug

  // Configuración del sidebar (idéntico al dashboard)
  const sidebarItems = [
    {
      id: 'analytics',
      label: 'Estadísticas y Métricas',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
      isActive: true,
      subItems: [
        { id: 'products-list', label: 'Lista de Productos', href: `/projects/${projectSlug}/products`, isActive: true },
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
      href: `/projects/${projectSlug}/suppliers`
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
    },
    {
      id: 'movements',
      label: 'Movimientos de Stock',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
      href: `/projects/${projectSlug}/movements`
    }
  ]

  // Configuración de tabs
  const productsTabs = [
    {
      id: 'products-list',
      label: 'Lista de Productos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Total de Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>{products.length}</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>Catálogo completo</p>
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
                  {products.filter(p => p.status === 'active').length}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>Disponibles para venta</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Stock Bajo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.error }}>
                  {products.filter(p => p.stock <= p.min_stock).length}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.error }}>Requieren reposición</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Valor Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  ${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>Valor de inventario</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de productos */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle style={{ color: theme.colors.textPrimary }}>Catálogo de Productos</CardTitle>
                  <CardDescription style={{ color: theme.colors.textSecondary }}>
                    Gestión completa del catálogo de productos BRUMA
                  </CardDescription>
                </div>
                <Button className="shadow-lg">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Producto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <Input
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                  >
                    <option value="all">Todas las categorías</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                        Stock
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
                    {filteredProducts().length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="text-gray-400 text-4xl mb-4">📦</div>
                          <p style={{ color: theme.colors.textSecondary }}>No se encontraron productos</p>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts().map((product) => (
                        <tr key={product.id} className="hover:bg-opacity-5">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-12 h-12 rounded-lg mr-4 flex items-center justify-center text-white font-bold" 
                                   style={{ backgroundColor: getCategoryColor(product.category) }}>
                                {product.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                  {product.name}
                                </div>
                                <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                                  {product.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono" style={{ color: theme.colors.textSecondary }}>
                              {product.sku}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className="px-2 py-1 text-xs font-medium rounded-full"
                              style={{ 
                                backgroundColor: getCategoryColor(product.category) + '20',
                                color: getCategoryColor(product.category)
                              }}
                            >
                              {getCategoryName(product.category)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>
                              ${product.price.toLocaleString()}
                            </div>
                            <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                              Costo: ${product.cost.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span 
                                className={`px-2 py-1 text-xs font-medium rounded-full`}
                                style={{ 
                                  backgroundColor: 
                                    product.stock > product.min_stock ? theme.colors.success + '20' :
                                    product.stock > 0 ? theme.colors.warning + '20' : theme.colors.error + '20',
                                  color:
                                    product.stock > product.min_stock ? theme.colors.success :
                                    product.stock > 0 ? theme.colors.warning : theme.colors.error
                                }}
                              >
                                {product.stock} unidades
                              </span>
                              {product.stock <= product.min_stock && (
                                <svg className="w-4 h-4" style={{ color: theme.colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className={`px-2 py-1 text-xs font-medium rounded-full`}
                              style={{ 
                                backgroundColor: product.status === 'active' ? theme.colors.success + '20' : theme.colors.border + '20',
                                color: product.status === 'active' ? theme.colors.success : theme.colors.textSecondary
                              }}
                            >
                              {product.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Button>
                              <Button size="sm" variant="outline">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'catalog',
      label: 'Catálogo Visual',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
              Catálogo Visual
            </h3>
            <p style={{ color: theme.colors.textSecondary }}>
              Vista de catálogo con imágenes de productos en desarrollo
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'stock-management',
      label: 'Gestión de Stock',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
              Gestión de Stock
            </h3>
            <p style={{ color: theme.colors.textSecondary }}>
              Herramientas avanzadas de gestión de inventario en desarrollo
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2h-6a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2v10" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
              Reportes y Análisis
            </h3>
            <p style={{ color: theme.colors.textSecondary }}>
              Informes detallados y análisis de productos en desarrollo
            </p>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.background }}>
      <ModernSidebar 
        items={sidebarItems}
        projectName={projectData.project.project_name}
        onCollapseChange={setSidebarCollapsed}
      />

      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ backgroundColor: theme.colors.surface + '90', borderColor: theme.colors.border }}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center space-x-2 p-2 rounded-lg transition-colors hover:bg-opacity-10"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm">Dashboard Principal</span>
                </button>
                <div className="h-6 w-px" style={{ backgroundColor: theme.colors.border }}></div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
                    {projectData.project.project_name}
                  </h1>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    Gestión de Productos
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
                            className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-opacity-10"
                            style={{ color: theme.colors.textPrimary }}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3" />
                            </svg>
                            <span>Dashboard Principal</span>
                          </button>
                          
                          <button 
                            onClick={async () => {
                              await supabase.auth.signOut()
                              router.push('/auth')
                              setUserDropdownOpen(false)
                            }}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-red-600 hover:bg-red-50"
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
          <Tabs tabs={productsTabs} defaultTab="products-list" />
        </main>
      </div>
    </div>
  )
}