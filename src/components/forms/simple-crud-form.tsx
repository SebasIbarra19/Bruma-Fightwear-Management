'use client'

import React, { useState } from 'react'
import { CrudModal } from '@/components/ui/crud-modal'
import { TextField, TextAreaField, SelectField, NumberField } from '@/components/ui/form-fields'
import { DateField, CheckboxField } from '@/components/ui/advanced-fields'

// ============= SIMPLE PRODUCT FORM =============
interface Product {
  id?: string
  name: string
  description: string
  category: string
  price: number
  stock: number
  isActive: boolean
  releaseDate: string
}

interface SimpleProductFormProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit' | 'view'
  product?: Product
  onSave: (product: Product) => Promise<void>
}

export const SimpleProductForm: React.FC<SimpleProductFormProps> = ({
  isOpen,
  onClose,
  mode,
  product,
  onSave
}) => {
  const [formData, setFormData] = useState<Product>(
    product || {
      name: '',
      description: '',
      category: '',
      price: 0,
      stock: 0,
      isActive: true,
      releaseDate: ''
    }
  )

  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categoryOptions = [
    { value: '', label: 'Seleccionar categoría' },
    { value: 'electronics', label: 'Electrónicos' },
    { value: 'clothing', label: 'Ropa' },
    { value: 'books', label: 'Libros' },
    { value: 'home', label: 'Hogar' }
  ]

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida'
    }

    if (formData.price <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0'
    }

    if (formData.stock < 0) {
      newErrors.stock = 'El stock no puede ser negativo'
    }

    if (!formData.releaseDate) {
      newErrors.releaseDate = 'La fecha de lanzamiento es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'view') return

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(product || {
      name: '',
      description: '',
      category: '',
      price: 0,
      stock: 0,
      isActive: true,
      releaseDate: ''
    })
    setErrors({})
    onClose()
  }

  return (
    <CrudModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Producto"
      mode={mode}
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <TextField
            label="Nombre del Producto"
            placeholder="Ingresa el nombre"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            required
            disabled={mode === 'view'}
          />

          <TextAreaField
            label="Descripción"
            placeholder="Describe el producto..."
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            error={errors.description}
            rows={3}
            disabled={mode === 'view'}
          />

          <SelectField
            label="Categoría"
            options={categoryOptions}
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            error={errors.category}
            required
            disabled={mode === 'view'}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumberField
              label="Precio"
              placeholder="0.00"
              prefix="$"
              value={formData.price}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              error={errors.price}
              step="0.01"
              min="0"
              required
              disabled={mode === 'view'}
            />

            <NumberField
              label="Stock"
              placeholder="0"
              suffix="unidades"
              value={formData.stock}
              onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
              error={errors.stock}
              min="0"
              required
              disabled={mode === 'view'}
            />
          </div>

          <DateField
            label="Fecha de Lanzamiento"
            value={formData.releaseDate}
            onChange={(e) => handleInputChange('releaseDate', e.target.value)}
            error={errors.releaseDate}
            required
            disabled={mode === 'view'}
          />

          <CheckboxField
            label="Producto Activo"
            description="Desmarcar para ocultar el producto del catálogo"
            checked={formData.isActive}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
            disabled={mode === 'view'}
          />
        </div>

        {/* Form Actions */}
        {mode !== 'view' && (
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear Producto' : 'Actualizar Producto'}
            </button>
          </div>
        )}
      </form>
    </CrudModal>
  )
}

// ============= DEMO COMPONENT TO SHOW USAGE =============
export const CrudFormDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>()

  // Sample products data
  const [products] = useState<Product[]>([
    {
      id: '1',
      name: 'Laptop Gamer',
      description: 'Laptop para gaming de alta gama',
      category: 'electronics',
      price: 1299.99,
      stock: 5,
      isActive: true,
      releaseDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Camiseta Básica',
      description: 'Camiseta de algodón 100%',
      category: 'clothing',
      price: 19.99,
      stock: 50,
      isActive: true,
      releaseDate: '2024-02-01'
    }
  ])

  const handleCreateProduct = () => {
    setModalMode('create')
    setSelectedProduct(undefined)
    setIsModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setModalMode('edit')
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleViewProduct = (product: Product) => {
    setModalMode('view')
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleSaveProduct = async (product: Product) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Saving product:', product)
    // Here you would typically update your state or refetch data
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Productos</h1>
        <button
          onClick={handleCreateProduct}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Crear Producto
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
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
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${product.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleViewProduct(product)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CRUD Modal */}
      <SimpleProductForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        product={selectedProduct}
        onSave={handleSaveProduct}
      />
    </div>
  )
}