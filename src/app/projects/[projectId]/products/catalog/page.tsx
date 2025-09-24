'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { Product, UserProject, Category, ProductLine } from '@/types/database'

interface ProductWithRelations extends Product {
  category_name?: string
  product_line_name?: string
}

export default function ProductsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [products, setProducts] = useState<ProductWithRelations[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [productLines, setProductLines] = useState<ProductLine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const router = useRouter()
  const params = useParams()
  const projectSlug = params.projectId as string

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)

      // Obtener proyecto del usuario
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
      await loadProjectData(currentProject.project_id)

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectData = async (projectId: string) => {
    try {
      // Cargar categorías
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      // Cargar líneas de productos
      const { data: linesData, error: linesError } = await supabase
        .from('product_lines')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      // Cargar productos con relaciones
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          product_lines(name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (!categoriesError) setCategories(categoriesData || [])
      if (!linesError) setProductLines(linesData || [])
      
      if (!productsError && productsData) {
        const productsWithRelations = productsData.map(product => ({
          ...product,
          category_name: product.categories?.name,
          product_line_name: product.product_lines?.name
        }))
        setProducts(productsWithRelations)
      }

    } catch (error) {
      console.error('Error cargando datos del proyecto:', error)
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
        alert('Error al actualizar el estado del producto')
        return
      }

      // Actualizar la lista local
      setProducts(prev => 
        prev.map(p => 
          p.id === product.id 
            ? { ...p, is_active: !p.is_active }
            : p
        )
      )
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteProduct = async (product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (error) {
        console.error('Error eliminando producto:', error)
        alert('Error al eliminar el producto')
        return
      }

      // Actualizar la lista local
      setProducts(prev => prev.filter(p => p.id !== product.id))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && product.is_active) ||
                         (statusFilter === 'inactive' && !product.is_active)

    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>→</span>
            <Link href={`/projects/${projectSlug}/dashboard`} className="hover:text-blue-600">
              {project?.project_name}
            </Link>
            <span>→</span>
            <Link href={`/projects/${projectSlug}/products`} className="hover:text-blue-600">
              Productos
            </Link>
            <span>→</span>
            <span className="text-gray-900">Catálogo</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Catálogo de Productos</h1>
              <p className="text-gray-600 mt-2">
                Gestiona todos los productos de BRUMA Fightwear
              </p>
            </div>
            
            <Link href={`/projects/${projectSlug}/products/catalog/new`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                + Nuevo Producto
              </Button>
            </Link>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{products.length}</p>
                <p className="text-sm text-gray-600">Total productos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{products.filter(p => p.is_active).length}</p>
                <p className="text-sm text-gray-600">Activos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
                <p className="text-sm text-gray-600">Categorías</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{productLines.length}</p>
                <p className="text-sm text-gray-600">Líneas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo inactivos</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Productos */}
        <div className="grid gap-4">
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                      ? 'No se encontraron productos con los filtros aplicados' 
                      : 'No hay productos creados aún'
                    }
                  </p>
                  {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
                    <Link href={`/projects/${projectSlug}/products/catalog/new`}>
                      <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                        Crear primer producto
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        
                        {product.category_name && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.category_name}
                          </span>
                        )}
                        
                        {product.product_line_name && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {product.product_line_name}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                        <span><span className="font-medium">SKU:</span> {product.sku || 'N/A'}</span>
                        <span><span className="font-medium">Precio:</span> ${product.price}</span>
                        {product.compare_price && (
                          <span><span className="font-medium">Antes:</span> <s>${product.compare_price}</s></span>
                        )}
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Creado: {new Date(product.created_at).toLocaleDateString()}</span>
                        {product.updated_at !== product.created_at && (
                          <span>Actualizado: {new Date(product.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {/* Ver variantes */}
                      <Link href={`/projects/${projectSlug}/products/catalog/${product.id}/variants`}>
                        <Button variant="outline" size="sm" className="text-purple-600 hover:text-purple-700">
                          Variantes
                        </Button>
                      </Link>
                      
                      <Button
                        onClick={() => toggleProductStatus(product)}
                        variant="outline"
                        size="sm"
                        className={product.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {product.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                      
                      <Link href={`/projects/${projectSlug}/products/catalog/${product.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      
                      <Button
                        onClick={() => deleteProduct(product)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Resumen */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                Mostrando {filteredProducts.length} de {products.length} productos
              </span>
              <span>
                Activos: {products.filter(p => p.is_active).length} | 
                Inactivos: {products.filter(p => !p.is_active).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}