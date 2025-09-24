'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject, ProductFormData, Category, ProductLine } from '@/types/database'

export default function NewProductPage() {
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [productLines, setProductLines] = useState<ProductLine[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    sku: '',
    price: 0,
    compare_price: 0,
    cost: 0,
    category_id: '',
    product_line_id: '',
    track_inventory: true,
    continue_selling_when_out_of_stock: false,
    is_active: true,
    sort_order: 1
  })

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
      await loadOptions(currentProject.project_id)

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOptions = async (projectId: string) => {
    try {
      // Cargar categorías activas
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      // Cargar líneas de productos activas
      const { data: linesData, error: linesError } = await supabase
        .from('product_lines')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (!categoriesError) setCategories(categoriesData || [])
      if (!linesError) setProductLines(linesData || [])

    } catch (error) {
      console.error('Error cargando opciones:', error)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[áäàâã]/g, 'a')
      .replace(/[éëèê]/g, 'e')
      .replace(/[íïìî]/g, 'i')
      .replace(/[óöòôõ]/g, 'o')
      .replace(/[úüùû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-|-$/g, '')
  }

  const generateSKU = (name: string, categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    const categoryPrefix = category ? category.slug.substring(0, 3).toUpperCase() : 'PRD'
    const namePrefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '')
    const timestamp = Date.now().toString().slice(-4)
    
    return `${categoryPrefix}-${namePrefix}-${timestamp}`
  }

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-generar slug al cambiar el nombre
    if (field === 'name' && typeof value === 'string') {
      const newSlug = generateSlug(value)
      setFormData(prev => ({
        ...prev,
        slug: newSlug,
        sku: prev.sku || generateSKU(value, prev.category_id)
      }))
    }

    // Auto-generar SKU al cambiar categoría
    if (field === 'category_id' && typeof value === 'string' && formData.name) {
      setFormData(prev => ({
        ...prev,
        sku: generateSKU(prev.name, value)
      }))
    }
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.name.trim()) {
      errors.push('El nombre es requerido')
    }

    if (!formData.slug.trim()) {
      errors.push('El slug es requerido')
    }

    if (!formData.sku?.trim()) {
      errors.push('El SKU es requerido')
    }

    if (!formData.category_id) {
      errors.push('La categoría es requerida')
    }

    if (formData.price <= 0) {
      errors.push('El precio debe ser mayor a 0')
    }

    if (formData.compare_price && formData.compare_price <= formData.price) {
      errors.push('El precio de comparación debe ser mayor al precio regular')
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      alert('Errores:\n' + errors.join('\n'))
      return
    }

    if (!project) return

    setSaving(true)

    try {
      const dataToSave = {
        ...formData,
        project_id: project.project_id,
        compare_price: formData.compare_price || null,
        cost: formData.cost || null,
        product_line_id: formData.product_line_id || null
      }

      const { error } = await supabase
        .from('products')
        .insert([dataToSave])

      if (error) {
        console.error('Error creando producto:', error)
        alert('Error al crear el producto')
        return
      }

      // Redirigir a la lista
      router.push(`/projects/${projectSlug}/products/catalog`)

    } catch (error) {
      console.error('Error guardando:', error)
      alert('Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

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
      <div className="container mx-auto px-4 py-8 max-w-3xl">
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
            <Link href={`/projects/${projectSlug}/products/catalog`} className="hover:text-blue-600">
              Catálogo
            </Link>
            <span>→</span>
            <span className="text-gray-900">Nuevo</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Nuevo Producto
          </h1>
          <p className="text-gray-600 mt-2">
            Agrega un nuevo producto al catálogo de BRUMA Fightwear
          </p>
        </div>

        {/* Verificación de requisitos */}
        {(categories.length === 0 || productLines.length === 0) && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-900">Configuración requerida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-amber-800">
                {categories.length === 0 && (
                  <p>• Necesitas crear al menos una categoría activa</p>
                )}
                {productLines.length === 0 && (
                  <p>• Se recomienda crear al menos una línea de productos</p>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                {categories.length === 0 && (
                  <Link href={`/projects/${projectSlug}/products/categories/new`}>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                      Crear Categoría
                    </Button>
                  </Link>
                )}
                {productLines.length === 0 && (
                  <Link href={`/projects/${projectSlug}/products/product-lines/new`}>
                    <Button size="sm" variant="outline">
                      Crear Línea
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Datos principales del producto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nombre */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Rashguard Premium Black"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <Input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="rashguard-premium-black"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL amigable para el producto (se genera automáticamente)
                </p>
              </div>

              {/* SKU */}
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <Input
                  id="sku"
                  type="text"
                  value={formData.sku || ''}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="RAS-PRM-2024"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Código único del producto (se genera automáticamente)
                </p>
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción detallada del producto..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Descripción corta */}
              <div>
                <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Corta
                </label>
                <textarea
                  id="short_description"
                  value={formData.short_description || ''}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  placeholder="Descripción breve para listados..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categorización */}
          <Card>
            <CardHeader>
              <CardTitle>Categorización</CardTitle>
              <CardDescription>
                Organiza el producto en categorías y líneas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Categoría */}
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  id="category_id"
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Línea de Productos */}
              <div>
                <label htmlFor="product_line_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Línea de Productos
                </label>
                <select
                  id="product_line_id"
                  value={formData.product_line_id}
                  onChange={(e) => handleInputChange('product_line_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin línea específica</option>
                  {productLines.map(line => (
                    <option key={line.id} value={line.id}>
                      {line.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Precios */}
          <Card>
            <CardHeader>
              <CardTitle>Precios</CardTitle>
              <CardDescription>
                Configuración de precios del producto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Precio regular */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Regular *
                  </label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Precio de comparación */}
                <div>
                  <label htmlFor="compare_price" className="block text-sm font-medium text-gray-700 mb-2">
                    Precio de Comparación
                  </label>
                  <Input
                    id="compare_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.compare_price}
                    onChange={(e) => handleInputChange('compare_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Precio tachado para mostrar descuentos
                  </p>
                </div>

                {/* Costo */}
                <div>
                  <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
                    Costo
                  </label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost || 0}
                    onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Costo del producto (interno)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventario */}
          <Card>
            <CardHeader>
              <CardTitle>Inventario</CardTitle>
              <CardDescription>
                Configuración del inventario del producto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  id="track_inventory"
                  type="checkbox"
                  checked={formData.track_inventory}
                  onChange={(e) => handleInputChange('track_inventory', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="track_inventory" className="text-sm font-medium text-gray-700">
                  Controlar inventario
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  id="continue_selling_when_out_of_stock"
                  type="checkbox"
                  checked={formData.continue_selling_when_out_of_stock}
                  onChange={(e) => handleInputChange('continue_selling_when_out_of_stock', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="continue_selling_when_out_of_stock" className="text-sm font-medium text-gray-700">
                  Continuar vendiendo cuando no hay stock
                </label>
              </div>

              {/* Sort Order */}
              <div>
                <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-2">
                  Orden de visualización
                </label>
                <Input
                  id="sort_order"
                  type="number"
                  min="1"
                  value={formData.sort_order}
                  onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 1)}
                  placeholder="1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Número para ordenar productos (menor = primero)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Estado */}
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Producto activo (visible en el catálogo)
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={saving || categories.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Creando...' : 'Crear'} Producto
            </Button>
            
            <Link href={`/projects/${projectSlug}/products/catalog`}>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}