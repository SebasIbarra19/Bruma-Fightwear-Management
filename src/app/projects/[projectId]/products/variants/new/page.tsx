'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject, ProductVariantFormData, Product } from '@/types/database'

export default function NewVariantPage() {
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState<ProductVariantFormData>({
    name: '',
    sku: '',
    variant_type: 'color',
    variant_value: '',
    price_adjustment: 0,
    cost_adjustment: 0,
    inventory_quantity: 0,
    inventory_policy: 'deny',
    is_active: true,
    sort_order: 1
  })

  const [selectedProduct, setSelectedProduct] = useState<string>('')

  const router = useRouter()
  const params = useParams()
  const projectSlug = params.projectId as string

  // Colores predefinidos para BRUMA Fightwear
  const predefinedColors = [
    'Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Amarillo',
    'Gris', 'Rosa', 'Naranja', 'Morado', 'Café', 'Beige'
  ]

  // Tallas predefinidas XS a XL
  const predefinedSizes = ['XS', 'S', 'M', 'L', 'XL']

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
            name
          )
        `)
        .eq('project_id', projectData.project_id)
        .eq('is_active', true)
        .order('name')

      if (productsData) {
        setProducts(productsData)
      }

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProductVariantFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Auto-generar nombre si cambian tipo o valor
    if (field === 'variant_type' || field === 'variant_value') {
      const newType = field === 'variant_type' ? value : formData.variant_type
      const newValue = field === 'variant_value' ? value : formData.variant_value
      
      if (newType && newValue) {
        const typeName = newType === 'color' ? 'Color' : 
                        newType === 'size' ? 'Talla' : 
                        String(newType).charAt(0).toUpperCase() + String(newType).slice(1)
        setFormData(prev => ({ ...prev, name: `${typeName} ${newValue}` }))
      }
    }

    // Auto-generar SKU si cambian producto o datos de variante
    if (field === 'variant_type' || field === 'variant_value') {
      const selectedProd = products.find(p => p.id === selectedProduct)
      if (selectedProd) {
        const newType = field === 'variant_type' ? value : formData.variant_type
        const newValue = field === 'variant_value' ? value : formData.variant_value
        
        if (newType && newValue) {
          const basesku = selectedProd.sku || selectedProd.name.substring(0, 3).toUpperCase()
          const typeCode = String(newType).substring(0, 2).toUpperCase()
          const valueCode = String(newValue).substring(0, 3).toUpperCase()
          const generatedSku = `${basesku}-${typeCode}-${valueCode}`
          setFormData(prev => ({ ...prev, sku: generatedSku }))
        }
      }
    }
  }

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId)
    
    // Auto-generar SKU con el nuevo producto
    const selectedProd = products.find(p => p.id === productId)
    if (selectedProd && formData.variant_type && formData.variant_value) {
      const basesku = selectedProd.sku || selectedProd.name.substring(0, 3).toUpperCase()
      const typeCode = formData.variant_type.substring(0, 2).toUpperCase()
      const valueCode = formData.variant_value.substring(0, 3).toUpperCase()
      const generatedSku = `${basesku}-${typeCode}-${valueCode}`
      setFormData(prev => ({ ...prev, sku: generatedSku }))
    }
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!selectedProduct) {
      errors.push('Selecciona un producto')
    }

    if (!formData.name.trim()) {
      errors.push('El nombre es requerido')
    }

    if (!formData.variant_type) {
      errors.push('El tipo de variante es requerido')
    }

    if (!formData.variant_value.trim()) {
      errors.push('El valor de la variante es requerido')
    }

    if (errors.length > 0) {
      alert('Por favor corrige los siguientes errores:\n' + errors.join('\n'))
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !project) return

    setSaving(true)

    try {
      const dataToSave = {
        ...formData,
        product_id: selectedProduct
      }

      const { error } = await supabase
        .from('product_variants')
        .insert([dataToSave])

      if (error) {
        console.error('Error creando variante:', error)
        alert('Error al crear la variante')
        return
      }

      // Redirigir a la lista
      router.push(`/projects/${projectSlug}/products/variants`)

    } catch (error) {
      console.error('Error guardando:', error)
      alert('Error al guardar la variante')
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
            <Link href={`/projects/${projectSlug}`} className="hover:text-blue-600">
              {project?.project_name}
            </Link>
            <span>/</span>
            <Link href={`/projects/${projectSlug}/products`} className="hover:text-blue-600">
              Productos
            </Link>
            <span>/</span>
            <Link href={`/projects/${projectSlug}/products/variants`} className="hover:text-blue-600">
              Variantes
            </Link>
            <span>/</span>
            <span className="text-gray-900">Nueva</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">Nueva Variante</h1>
          <p className="text-gray-600 mt-2">
            Crea una nueva variante de color, talla o estilo para un producto
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de producto */}
          <Card>
            <CardHeader>
              <CardTitle>Producto Base</CardTitle>
              <CardDescription>
                Selecciona el producto al cual pertenece esta variante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <select
                value={selectedProduct}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecciona un producto...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ${product.price.toFixed(2)}
                  </option>
                ))}
              </select>
              {products.length === 0 && (
                <p className="text-sm text-red-600 mt-2">
                  No hay productos activos. <Link href={`/projects/${projectSlug}/products/catalog/new`} className="text-blue-600 hover:underline">Crea un producto primero</Link>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Variante</CardTitle>
              <CardDescription>
                Define las características específicas de esta variante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de variante */}
              <div>
                <label htmlFor="variant_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Variante *
                </label>
                <select
                  id="variant_type"
                  value={formData.variant_type}
                  onChange={(e) => handleInputChange('variant_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="color">Color</option>
                  <option value="size">Talla</option>
                  <option value="material">Material</option>
                  <option value="style">Estilo</option>
                </select>
              </div>

              {/* Valor de variante con opciones predefinidas */}
              <div>
                <label htmlFor="variant_value" className="block text-sm font-medium text-gray-700 mb-2">
                  Valor de la Variante *
                </label>
                
                {formData.variant_type === 'color' && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-2">Colores sugeridos:</p>
                    <div className="flex flex-wrap gap-2">
                      {predefinedColors.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleInputChange('variant_value', color)}
                          className="px-3 py-1 text-xs border rounded-full hover:bg-gray-100"
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.variant_type === 'size' && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-2">Tallas disponibles:</p>
                    <div className="flex flex-wrap gap-2">
                      {predefinedSizes.map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleInputChange('variant_value', size)}
                          className="px-3 py-1 text-xs border rounded-full hover:bg-gray-100"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Input
                  id="variant_value"
                  type="text"
                  value={formData.variant_value}
                  onChange={(e) => handleInputChange('variant_value', e.target.value)}
                  placeholder={
                    formData.variant_type === 'color' ? 'Ej: Negro, Azul marino' :
                    formData.variant_type === 'size' ? 'Ej: XS, S, M, L, XL' :
                    'Ej: Algodón, Premium'
                  }
                  required
                />
              </div>

              {/* Nombre */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Variante *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Se genera automáticamente"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Se genera automáticamente basado en el tipo y valor
                </p>
              </div>

              {/* SKU */}
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                </label>
                <Input
                  id="sku"
                  type="text"
                  value={formData.sku || ''}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Se genera automáticamente"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Se genera automáticamente basado en el producto y variante
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Precios y costos */}
          <Card>
            <CardHeader>
              <CardTitle>Precios</CardTitle>
              <CardDescription>
                Ajustes de precio para esta variante (se suma/resta al precio base)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Ajuste de precio */}
                <div>
                  <label htmlFor="price_adjustment" className="block text-sm font-medium text-gray-700 mb-2">
                    Ajuste de Precio
                  </label>
                  <Input
                    id="price_adjustment"
                    type="number"
                    step="0.01"
                    value={formData.price_adjustment}
                    onChange={(e) => handleInputChange('price_adjustment', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    + valores aumentan el precio, - valores lo reducen
                  </p>
                </div>

                {/* Ajuste de costo */}
                <div>
                  <label htmlFor="cost_adjustment" className="block text-sm font-medium text-gray-700 mb-2">
                    Ajuste de Costo
                  </label>
                  <Input
                    id="cost_adjustment"
                    type="number"
                    step="0.01"
                    value={formData.cost_adjustment}
                    onChange={(e) => handleInputChange('cost_adjustment', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ajuste al costo base del producto
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
                Configuración del inventario para esta variante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cantidad inicial */}
              <div>
                <label htmlFor="inventory_quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad Inicial
                </label>
                <Input
                  id="inventory_quantity"
                  type="number"
                  min="0"
                  value={formData.inventory_quantity}
                  onChange={(e) => handleInputChange('inventory_quantity', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              {/* Política de inventario */}
              <div>
                <label htmlFor="inventory_policy" className="block text-sm font-medium text-gray-700 mb-2">
                  Política de Inventario
                </label>
                <select
                  id="inventory_policy"
                  value={formData.inventory_policy}
                  onChange={(e) => handleInputChange('inventory_policy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="deny">No permitir venta sin stock</option>
                  <option value="continue">Permitir venta sin stock</option>
                </select>
              </div>

              {/* Orden */}
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
                  Número para ordenar variantes (menor = primero)
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
                  Variante activa (disponible para venta)
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={saving || products.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Creando...' : 'Crear'} Variante
            </Button>
            
            <Link href={`/projects/${projectSlug}/products/variants`}>
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