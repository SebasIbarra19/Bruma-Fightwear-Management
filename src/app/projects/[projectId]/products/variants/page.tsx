'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ModernTable } from '@/components/ui/modern-table'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject, ProductVariant, Product } from '@/types/database'

// Interface para variantes con datos de producto incluidos
interface ProductVariantWithProduct extends ProductVariant {
  product_name?: string
  product_sku?: string
  category_name?: string
}

export default function ProductVariantsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [variants, setVariants] = useState<ProductVariantWithProduct[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    colors: 0,
    sizes: 0
  })

  const params = useParams()
  const projectSlug = params.projectId as string

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return
      }

      setUser(session.user)

      // Cargar proyecto
      const { data: projectData } = await supabase
        .from('user_projects')
        .select('*')
        .eq('slug', projectSlug)
        .eq('user_id', session.user.id)
        .single()

      if (!projectData) return
      setProject(projectData)

      // Cargar productos
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          ),
          product_lines (
            id,
            name
          )
        `)
        .eq('project_id', projectData.project_id)
        .order('name')

      if (productsData) {
        setProducts(productsData)
      }

      // Cargar variantes
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select(`
          *,
          products!inner (
            id,
            name,
            sku,
            project_id,
            categories (
              name
            )
          )
        `)
        .eq('products.project_id', projectData.project_id)
        .order('sort_order')

      if (variantsData) {
        // Transformar los datos para que coincidan con nuestra interface
        const transformedVariants = variantsData.map(variant => ({
          ...variant,
          product_name: variant.products.name,
          product_sku: variant.products.sku,
          category_name: variant.products.categories?.name || 'Sin categoría'
        }))
        
        setVariants(transformedVariants)
        
        // Calcular estadísticas
        const newStats = {
          total: transformedVariants.length,
          active: transformedVariants.filter(v => v.is_active).length,
          inactive: transformedVariants.filter(v => !v.is_active).length,
          colors: transformedVariants.filter(v => v.variant_type === 'color').length,
          sizes: transformedVariants.filter(v => v.variant_type === 'size').length
        }
        setStats(newStats)
      }

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (variantId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ is_active: !currentStatus })
        .eq('id', variantId)

      if (error) {
        console.error('Error actualizando estado:', error)
        alert('Error al actualizar el estado')
        return
      }

      // Actualizar localmente
      setVariants(variants.map(variant => 
        variant.id === variantId 
          ? { ...variant, is_active: !currentStatus }
          : variant
      ))

      // Actualizar stats
      setStats(prev => ({
        ...prev,
        active: prev.active + (!currentStatus ? 1 : -1),
        inactive: prev.inactive + (currentStatus ? 1 : -1)
      }))

    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteVariant = async (variantId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta variante?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId)

      if (error) {
        console.error('Error eliminando variante:', error)
        alert('Error al eliminar la variante')
        return
      }

      // Actualizar localmente
      const variantToRemove = variants.find(v => v.id === variantId)
      setVariants(variants.filter(variant => variant.id !== variantId))
      
      if (variantToRemove) {
        setStats(prev => ({
          total: prev.total - 1,
          active: prev.active - (variantToRemove.is_active ? 1 : 0),
          inactive: prev.inactive - (!variantToRemove.is_active ? 1 : 0),
          colors: prev.colors - (variantToRemove.variant_type === 'color' ? 1 : 0),
          sizes: prev.sizes - (variantToRemove.variant_type === 'size' ? 1 : 0)
        }))
      }

    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Filtrar variantes
  const filteredVariants = variants.filter(variant => {
    const matchesSearch = variant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variant.variant_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variant.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variant.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesProduct = selectedProduct === 'all' || variant.product_id === selectedProduct
    const matchesType = selectedType === 'all' || variant.variant_type === selectedType

    return matchesSearch && matchesProduct && matchesType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando variantes...</p>
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
            <Link href={`/projects/${projectSlug}`} className="hover:text-blue-600">
              {project?.project_name}
            </Link>
            <span>/</span>
            <Link href={`/projects/${projectSlug}/products`} className="hover:text-blue-600">
              Productos
            </Link>
            <span>/</span>
            <span className="text-gray-900">Variantes</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Variantes de Productos</h1>
              <p className="text-gray-600 mt-2">
                Gestiona colores, tallas y otras variaciones de tus productos
              </p>
            </div>
            
            <Link href={`/projects/${projectSlug}/products/variants/new`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                + Nueva Variante
              </Button>
            </Link>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Variantes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Activas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <div className="text-sm text-gray-600">Inactivas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">{stats.colors}</div>
              <div className="text-sm text-gray-600">Colores</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">{stats.sizes}</div>
              <div className="text-sm text-gray-600">Tallas</div>
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
                    placeholder="Buscar por nombre, valor, producto o SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className=""
                  />
                </div>
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
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por tipo */}
              <div className="min-w-[150px]">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="color">Colores</option>
                  <option value="size">Tallas</option>
                  <option value="material">Material</option>
                  <option value="style">Estilo</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de variantes */}
        <ModernTable
          title="Variantes de Productos"
          subtitle={`${filteredVariants.length} variantes registradas - Lista de todas las variantes de productos`}
              data={filteredVariants}
              columns={[
                {
                  key: 'product_name',
                  title: 'Producto',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="font-medium">{value}</div>
                      <div className="text-sm text-gray-500">{row.category_name}</div>
                    </div>
                  )
                },
                {
                  key: 'name',
                  title: 'Variante',
                  sortable: true,
                  render: (value) => (
                    <div className="font-medium">{value}</div>
                  )
                },
                {
                  key: 'variant_type',
                  title: 'Tipo',
                  sortable: true,
                  render: (value) => (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      value === 'color' ? 'bg-purple-100 text-purple-800' :
                      value === 'size' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {value === 'color' ? 'Color' :
                       value === 'size' ? 'Talla' :
                       value}
                    </span>
                  )
                },
                {
                  key: 'variant_value',
                  title: 'Valor',
                  sortable: true,
                  render: (value, row) => (
                    <div className="flex items-center gap-2">
                      {row.variant_type === 'color' && (
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: value.toLowerCase() }}
                          title={value}
                        />
                      )}
                      <span>{value}</span>
                    </div>
                  )
                },
                {
                  key: 'sku',
                  title: 'SKU',
                  sortable: true,
                  render: (value) => (
                    <span className="text-sm font-mono">{value || '-'}</span>
                  )
                },
                {
                  key: 'price_adjustment',
                  title: 'Precio',
                  sortable: true,
                  render: (value) => (
                    <div>
                      {value > 0 ? '+' : ''}${value.toFixed(2)}
                    </div>
                  )
                },
                {
                  key: 'inventory_quantity',
                  title: 'Stock',
                  sortable: true,
                  render: (value) => (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      value > 10 ? 'bg-green-100 text-green-800' :
                      value > 0 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {value} unidades
                    </span>
                  )
                },
                {
                  key: 'is_active',
                  title: 'Estado',
                  sortable: true,
                  render: (value, row) => (
                    <button
                      onClick={() => toggleStatus(row.id, value)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        value 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {value ? 'Activa' : 'Inactiva'}
                    </button>
                  )
                }
              ]}
              renderExpandedRow={(row) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
                  <div>
                    <h4 className="font-semibold mb-2">Información del Producto</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">Producto:</span> {row.product_name}</p>
                      <p><span className="text-gray-500">Categoría:</span> {row.category_name}</p>
                      <p><span className="text-gray-500">SKU Producto:</span> {row.product_sku || 'Sin SKU'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Detalles de Variante</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">ID:</span> {row.id}</p>
                      <p><span className="text-gray-500">SKU Variante:</span> {row.sku || 'Sin SKU'}</p>
                      <p><span className="text-gray-500">Ajuste precio:</span> ${row.price_adjustment.toFixed(2)}</p>
                      <p><span className="text-gray-500">Stock actual:</span> {row.inventory_quantity} unidades</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Acciones</h4>
                    <div className="space-y-2">
                      <Link href={`/projects/${projectSlug}/products/variants/${row.id}`} className="block">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver Detalle
                        </Button>
                      </Link>
                      <Link href={`/projects/${projectSlug}/products/variants/${row.id}/edit`} className="block">
                        <Button variant="outline" size="sm" className="w-full">
                          Editar Variante
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteVariant(row.id)}
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              onEdit={(variant) => window.location.href = `/projects/${projectSlug}/products/variants/${variant.id}/edit`}
              onDelete={(variant) => deleteVariant(variant.id)}
              onRefresh={() => loadData()}
            />
        
      </div>
    </div>
  )
}