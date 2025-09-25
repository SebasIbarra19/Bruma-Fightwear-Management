'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { 
  UserProject, 
  ProductLine, 
  Category, 
  Product, 
  ProductVariant 
} from '@/types/database'

interface ProductWithRelations extends Product {
  category_name?: string
  product_line_name?: string
}

interface ProductVariantWithProduct extends ProductVariant {
  product_name?: string
  product_sku?: string
  category_name?: string
}

interface ProductStats {
  totalProductLines: number
  totalCategories: number
  totalProducts: number
  activeProducts: number
  totalVariants: number
}

export default function ProductsPage() {
  // Estados generales
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'lineas' | 'categorias' | 'productos' | 'variantes'>('lineas')
  
  // Estados para estadísticas generales
  const [stats, setStats] = useState<ProductStats>({
    totalProductLines: 0,
    totalCategories: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalVariants: 0
  })

  // Estados para Líneas de Productos
  const [productLines, setProductLines] = useState<ProductLine[]>([])
  const [productLinesLoading, setProductLinesLoading] = useState(false)
  const [productLinesSearch, setProductLinesSearch] = useState('')
  const [productLinesStatus, setProductLinesStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Estados para Categorías  
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesSearch, setCategoriesSearch] = useState('')
  const [categoriesStatus, setCategoriesStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Estados para Productos
  const [products, setProducts] = useState<ProductWithRelations[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsSearch, setProductsSearch] = useState('')
  const [productsCategory, setProductsCategory] = useState<string>('all')
  const [productsStatus, setProductsStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Estados para Variantes
  const [variants, setVariants] = useState<ProductVariantWithProduct[]>([])
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [variantsSearch, setVariantsSearch] = useState('')
  const [variantsProduct, setVariantsProduct] = useState<string>('all')
  const [variantsType, setVariantsType] = useState<string>('all')
  const [variantsStats, setVariantsStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    colors: 0,
    sizes: 0
  })

  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const projectSlug = params.projectId as string

  useEffect(() => {
    // Verificar si se debe mostrar un tab específico desde URL
    const tab = searchParams.get('tab')
    if (tab && ['lineas', 'categorias', 'productos', 'variantes'].includes(tab)) {
      setActiveTab(tab as any)
    }
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
      const { data: userProjects, error } = await supabase.rpc('get_user_projects', {
        user_uuid: session.user.id
      })

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
      await loadGeneralStats(currentProject.project_id)

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGeneralStats = async (projectId: string) => {
    try {
      // Obtener estadísticas de líneas de productos
      const { data: productLines, error: linesError } = await supabase
        .from('product_lines')
        .select('id')
        .eq('project_id', projectId)

      // Obtener estadísticas de categorías
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('project_id', projectId)

      // Obtener estadísticas de productos
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, is_active')
        .eq('project_id', projectId)

      // Obtener estadísticas de variantes
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('id, products!inner(project_id)')
        .eq('products.project_id', projectId)

      if (!linesError && !categoriesError && !productsError && !variantsError) {
        setStats({
          totalProductLines: productLines?.length || 0,
          totalCategories: categories?.length || 0,
          totalProducts: products?.length || 0,
          activeProducts: products?.filter(p => p.is_active).length || 0,
          totalVariants: variants?.length || 0
        })
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  // Función para cambiar tabs
  const handleTabChange = (tab: 'lineas' | 'categorias' | 'productos' | 'variantes') => {
    setActiveTab(tab)
    
    // Cargar datos específicos del tab si no están cargados
    if (!project) return
    
    switch(tab) {
      case 'lineas':
        if (productLines.length === 0) loadProductLines(project.project_id)
        break
      case 'categorias':
        if (categories.length === 0) loadCategories(project.project_id)
        break
      case 'productos':
        if (products.length === 0) loadProducts(project.project_id)
        break
      case 'variantes':
        if (variants.length === 0) loadVariants(project.project_id)
        break
    }
  }

  // Funciones de carga de datos específicas para cada tab
  const loadProductLines = async (projectId: string) => {
    if (productLinesLoading) return
    setProductLinesLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('product_lines')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error cargando líneas:', error)
        return
      }

      setProductLines(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setProductLinesLoading(false)
    }
  }

  const loadCategories = async (projectId: string) => {
    if (categoriesLoading) return
    setCategoriesLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error cargando categorías:', error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const loadProducts = async (projectId: string) => {
    if (productsLoading) return
    setProductsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner(name),
          product_lines(name)
        `)
        .eq('project_id', projectId)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error cargando productos:', error)
        return
      }

      const productsWithRelations = data?.map(product => ({
        ...product,
        category_name: (product.categories as any)?.name,
        product_line_name: (product.product_lines as any)?.name
      })) || []

      setProducts(productsWithRelations)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setProductsLoading(false)
    }
  }

  const loadVariants = async (projectId: string) => {
    if (variantsLoading) return
    setVariantsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          products!inner(
            name,
            sku,
            project_id,
            categories!inner(name)
          )
        `)
        .eq('products.project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando variantes:', error)
        return
      }

      const variantsWithProduct = data?.map(variant => ({
        ...variant,
        product_name: (variant.products as any)?.name,
        product_sku: (variant.products as any)?.sku,
        category_name: (variant.products as any)?.categories?.name
      })) || []

      setVariants(variantsWithProduct)

      // Calcular estadísticas de variantes
      const stats = {
        total: variantsWithProduct.length,
        active: variantsWithProduct.filter(v => v.is_active).length,
        inactive: variantsWithProduct.filter(v => !v.is_active).length,
        colors: new Set(variantsWithProduct.filter(v => v.variant_type === 'color').map(v => v.variant_value)).size,
        sizes: new Set(variantsWithProduct.filter(v => v.variant_type === 'size').map(v => v.variant_value)).size
      }
      setVariantsStats(stats)

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setVariantsLoading(false)
    }
  }

  // Funciones auxiliares para cada tab
  const toggleProductLineStatus = async (line: ProductLine) => {
    try {
      const { error } = await supabase
        .from('product_lines')
        .update({ is_active: !line.is_active })
        .eq('id', line.id)

      if (error) {
        console.error('Error actualizando estado:', error)
        return
      }

      // Actualizar estado local
      setProductLines(prev => prev.map(l => 
        l.id === line.id ? { ...l, is_active: !l.is_active } : l
      ))

      // Actualizar stats generales
      await loadGeneralStats(project?.project_id || '')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const toggleCategoryStatus = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)

      if (error) {
        console.error('Error actualizando estado:', error)
        return
      }

      // Actualizar estado local
      setCategories(prev => prev.map(c => 
        c.id === category.id ? { ...c, is_active: !c.is_active } : c
      ))

      // Actualizar stats generales
      await loadGeneralStats(project?.project_id || '')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const toggleProductStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id)

      if (error) {
        console.error('Error actualizando estado:', error)
        return
      }

      // Actualizar estado local
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, is_active: !p.is_active } : p
      ))

      // Actualizar stats generales
      await loadGeneralStats(project?.project_id || '')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const toggleVariantStatus = async (variant: ProductVariant) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ is_active: !variant.is_active })
        .eq('id', variant.id)

      if (error) {
        console.error('Error actualizando estado:', error)
        return
      }

      // Actualizar estado local
      setVariants(prev => prev.map(v => 
        v.id === variant.id ? { ...v, is_active: !v.is_active } : v
      ))

      // Recalcular stats de variantes
      const updatedVariants = variants.map(v => 
        v.id === variant.id ? { ...v, is_active: !v.is_active } : v
      )
      
      const stats = {
        total: updatedVariants.length,
        active: updatedVariants.filter(v => v.is_active).length,
        inactive: updatedVariants.filter(v => !v.is_active).length,
        colors: new Set(updatedVariants.filter(v => v.variant_type === 'color').map(v => v.variant_value)).size,
        sizes: new Set(updatedVariants.filter(v => v.variant_type === 'size').map(v => v.variant_value)).size
      }
      setVariantsStats(stats)

      // Actualizar stats generales
      await loadGeneralStats(project?.project_id || '')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Funciones de filtrado
  const getFilteredProductLines = () => {
    return productLines.filter(line => {
      const matchesSearch = line.name.toLowerCase().includes(productLinesSearch.toLowerCase()) ||
                          line.description?.toLowerCase().includes(productLinesSearch.toLowerCase())
      const matchesStatus = productLinesStatus === 'all' || 
                          (productLinesStatus === 'active' ? line.is_active : !line.is_active)
      return matchesSearch && matchesStatus
    })
  }

  const getFilteredCategories = () => {
    return categories.filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(categoriesSearch.toLowerCase()) ||
                          category.description?.toLowerCase().includes(categoriesSearch.toLowerCase())
      const matchesStatus = categoriesStatus === 'all' || 
                          (categoriesStatus === 'active' ? category.is_active : !category.is_active)
      return matchesSearch && matchesStatus
    })
  }

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(productsSearch.toLowerCase()) ||
                          product.sku?.toLowerCase().includes(productsSearch.toLowerCase()) ||
                          product.description?.toLowerCase().includes(productsSearch.toLowerCase())
      const matchesCategory = productsCategory === 'all' || product.category_id === productsCategory
      const matchesStatus = productsStatus === 'all' || 
                          (productsStatus === 'active' ? product.is_active : !product.is_active)
      return matchesSearch && matchesCategory && matchesStatus
    })
  }

  const getFilteredVariants = () => {
    return variants.filter(variant => {
      const matchesSearch = variant.product_name?.toLowerCase().includes(variantsSearch.toLowerCase()) ||
                          variant.product_sku?.toLowerCase().includes(variantsSearch.toLowerCase()) ||
                          variant.variant_value?.toLowerCase().includes(variantsSearch.toLowerCase())
      const matchesProduct = variantsProduct === 'all' || variant.product_id === variantsProduct
      const matchesType = variantsType === 'all' || variant.variant_type === variantsType
      return matchesSearch && matchesProduct && matchesType
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
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
            <span className="text-gray-900">Productos</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/images/bruma/logo-circle.svg" 
                alt="BRUMA Fightwear" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
                <p className="text-gray-600 mt-2">
                  Sistema completo para gestionar el catálogo de {project.project_name}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link href="/insert-data">
                <Button variant="outline" className="bg-green-50 hover:bg-green-100 border-green-200">
                  📊 Insertar Datos de Prueba
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.totalProductLines}</div>
              <div className="text-sm text-gray-600">Líneas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{stats.totalCategories}</div>
              <div className="text-sm text-gray-600">Categorías</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">{stats.totalProducts}</div>
              <div className="text-sm text-gray-600">Productos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">{stats.activeProducts}</div>
              <div className="text-sm text-gray-600">Activos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">{stats.totalVariants}</div>
              <div className="text-sm text-gray-600">Variantes</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleTabChange('lineas')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'lineas'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Líneas
            </button>
            <button
              onClick={() => handleTabChange('categorias')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'categorias'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏷️ Categorías
            </button>
            <button
              onClick={() => handleTabChange('productos')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'productos'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 Productos
            </button>
            <button
              onClick={() => handleTabChange('variantes')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'variantes'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎨 Variantes
            </button>
          </div>
        </div>

        {/* Contenido del Tab de Líneas */}
        {activeTab === 'lineas' && (
          <>
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar líneas
                    </label>
                    <Input
                      placeholder="Nombre, descripción..."
                      value={productLinesSearch}
                      onChange={(e) => setProductLinesSearch(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={productLinesStatus}
                      onChange={(e) => setProductLinesStatus(e.target.value as any)}
                    >
                      <option value="all">Todas</option>
                      <option value="active">Activas</option>
                      <option value="inactive">Inactivas</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Link href={`/projects/${projectSlug}/products/product-lines/new`}>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        + Nueva Línea
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
                      Líneas de Productos
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Mostrando {getFilteredProductLines().length} líneas
                    </p>
                  </div>
                </div>

                {productLinesLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando líneas...</p>
                  </div>
                ) : getFilteredProductLines().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">📋</div>
                    <p className="text-gray-600 mb-2">No hay líneas de productos</p>
                    <p className="text-sm text-gray-500">
                      Las líneas de productos aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Línea
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descripción
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Orden
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredProductLines().map((line) => (
                          <tr key={line.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {line.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {line.description || 'Sin descripción'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => toggleProductLineStatus(line)}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  line.is_active
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {line.is_active ? 'Activa' : 'Inactiva'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {line.sort_order}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/projects/${projectSlug}/products/product-lines/${line.id}/edit`}
                                className="text-blue-600 hover:text-blue-900 mr-4"
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

        {/* Contenido del Tab de Categorías */}
        {activeTab === 'categorias' && (
          <>
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar categorías
                    </label>
                    <Input
                      placeholder="Nombre, descripción..."
                      value={categoriesSearch}
                      onChange={(e) => setCategoriesSearch(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={categoriesStatus}
                      onChange={(e) => setCategoriesStatus(e.target.value as any)}
                    >
                      <option value="all">Todas</option>
                      <option value="active">Activas</option>
                      <option value="inactive">Inactivas</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Link href={`/projects/${projectSlug}/products/categories/new`}>
                      <Button className="bg-green-600 hover:bg-green-700">
                        + Nueva Categoría
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
                      Categorías
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Mostrando {getFilteredCategories().length} categorías
                    </p>
                  </div>
                </div>

                {categoriesLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando categorías...</p>
                  </div>
                ) : getFilteredCategories().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">🏷️</div>
                    <p className="text-gray-600 mb-2">No hay categorías</p>
                    <p className="text-sm text-gray-500">
                      Las categorías aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoría
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descripción
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
                        {getFilteredCategories().map((category) => (
                          <tr key={category.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {category.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {category.description || 'Sin descripción'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => toggleCategoryStatus(category)}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  category.is_active
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {category.is_active ? 'Activa' : 'Inactiva'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/projects/${projectSlug}/products/categories/${category.id}/edit`}
                                className="text-green-600 hover:text-green-900 mr-4"
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

        {/* Contenido del Tab de Productos */}
        {activeTab === 'productos' && (
          <>
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar productos
                    </label>
                    <Input
                      placeholder="Nombre, SKU..."
                      value={productsSearch}
                      onChange={(e) => setProductsSearch(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={productsCategory}
                      onChange={(e) => setProductsCategory(e.target.value)}
                    >
                      <option value="all">Todas las categorías</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={productsStatus}
                      onChange={(e) => setProductsStatus(e.target.value as any)}
                    >
                      <option value="all">Todos</option>
                      <option value="active">Activos</option>
                      <option value="inactive">Inactivos</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Link href={`/projects/${projectSlug}/products/catalog/new`}>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        + Nuevo Producto
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
                      Productos
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Mostrando {getFilteredProducts().length} productos
                    </p>
                  </div>
                </div>

                {productsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando productos...</p>
                  </div>
                ) : getFilteredProducts().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">📦</div>
                    <p className="text-gray-600 mb-2">No hay productos</p>
                    <p className="text-sm text-gray-500">
                      Los productos aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoría
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio
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
                        {getFilteredProducts().map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  SKU: {product.sku}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {product.category_name}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${product.price?.toLocaleString() || '0'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => toggleProductStatus(product)}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  product.is_active
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {product.is_active ? 'Activo' : 'Inactivo'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/projects/${projectSlug}/products/catalog/${product.id}`}
                                className="text-purple-600 hover:text-purple-900 mr-4"
                              >
                                Ver
                              </Link>
                              <Link
                                href={`/projects/${projectSlug}/products/catalog/${product.id}/edit`}
                                className="text-blue-600 hover:text-blue-900"
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

        {/* Contenido del Tab de Variantes */}
        {activeTab === 'variantes' && (
          <>
            {/* Estadísticas específicas de variantes */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-600">{variantsStats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">{variantsStats.active}</div>
                  <div className="text-sm text-gray-600">Activas</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-red-600">{variantsStats.inactive}</div>
                  <div className="text-sm text-gray-600">Inactivas</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-purple-600">{variantsStats.colors}</div>
                  <div className="text-sm text-gray-600">Colores</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-orange-600">{variantsStats.sizes}</div>
                  <div className="text-sm text-gray-600">Tallas</div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar variantes
                    </label>
                    <Input
                      placeholder="Producto, SKU, valor..."
                      value={variantsSearch}
                      onChange={(e) => setVariantsSearch(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Producto
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={variantsProduct}
                      onChange={(e) => setVariantsProduct(e.target.value)}
                    >
                      <option value="all">Todos los productos</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={variantsType}
                      onChange={(e) => setVariantsType(e.target.value)}
                    >
                      <option value="all">Todos los tipos</option>
                      <option value="color">Color</option>
                      <option value="size">Talla</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Link href={`/projects/${projectSlug}/products/variants/new`}>
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        + Nueva Variante
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
                      Variantes de Productos
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Mostrando {getFilteredVariants().length} variantes
                    </p>
                  </div>
                </div>

                {variantsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando variantes...</p>
                  </div>
                ) : getFilteredVariants().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">🎨</div>
                    <p className="text-gray-600 mb-2">No hay variantes</p>
                    <p className="text-sm text-gray-500">
                      Las variantes aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valor
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
                        {getFilteredVariants().map((variant) => (
                          <tr key={variant.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {variant.product_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  SKU: {variant.product_sku}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                variant.variant_type === 'color'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {variant.variant_type === 'color' ? '🎨 Color' : '📏 Talla'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variant.variant_value}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => toggleVariantStatus(variant)}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  variant.is_active
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {variant.is_active ? 'Activa' : 'Inactiva'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/projects/${projectSlug}/products/variants/${variant.id}/edit`}
                                className="text-orange-600 hover:text-orange-900 mr-4"
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

      </div>
    </div>
  )
}