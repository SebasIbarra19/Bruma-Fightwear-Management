'use client'

import { useState, useEffect } from 'react'
import { useInventory } from '@/hooks/useInventory'
import { useProducts } from '@/hooks/useProducts'
import { useSuppliers } from '@/hooks/useSuppliers'
import type { Inventory, InventoryFormData, Product, ProductVariant, Supplier } from '@/types/database'

interface InventoryFormProps {
  isOpen: boolean
  onClose: () => void
  inventory?: Inventory | null
  onSuccess?: () => void
}

export default function InventoryForm({ isOpen, onClose, inventory, onSuccess }: InventoryFormProps) {
  const { createInventoryItem, updateInventoryItem, error } = useInventory()
  const { products, productVariants, fetchProducts, fetchProductVariants } = useProducts()
  const { suppliers } = useSuppliers()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState<InventoryFormData>({
    product_id: '',
    product_variant_id: '',
    supplier_id: '',
    sku: '',
    quantity_available: 0,
    quantity_reserved: 0,
    quantity_on_order: 0,
    reorder_level: 10,
    reorder_quantity: 50,
    unit_cost: 0,
    location: '',
    notes: '',
    is_active: true
  })

  // Cargar productos y proveedores al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchProducts()
    }
  }, [isOpen, fetchProducts])

  // Cargar variantes cuando se selecciona un producto
  useEffect(() => {
    if (formData.product_id) {
      fetchProductVariants()
    }
  }, [formData.product_id, fetchProductVariants])

  // Cargar datos del inventario si está en modo edición
  useEffect(() => {
    if (inventory) {
      setFormData({
        product_id: inventory.product_id || '',
        product_variant_id: inventory.product_variant_id || '',
        supplier_id: inventory.supplier_id || '',
        sku: inventory.sku,
        quantity_available: inventory.quantity_available,
        quantity_reserved: inventory.quantity_reserved,
        quantity_on_order: inventory.quantity_on_order,
        reorder_level: inventory.reorder_level || 10,
        reorder_quantity: inventory.reorder_quantity || 50,
        unit_cost: inventory.unit_cost || 0,
        location: inventory.location || '',
        notes: inventory.notes || '',
        is_active: inventory.is_active
      })
    } else {
      // Reset form for new inventory item
      setFormData({
        product_id: '',
        product_variant_id: '',
        supplier_id: '',
        sku: '',
        quantity_available: 0,
        quantity_reserved: 0,
        quantity_on_order: 0,
        reorder_level: 10,
        reorder_quantity: 50,
        unit_cost: 0,
        location: '',
        notes: '',
        is_active: true
      })
    }
  }, [inventory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.sku.trim()) {
      alert('El SKU es requerido')
      return
    }

    setIsLoading(true)

    try {
      let result
      
      if (inventory) {
        result = await updateInventoryItem(inventory.id, formData)
      } else {
        result = await createInventoryItem(formData)
      }

      if (result) {
        onSuccess?.()
        onClose()
      } else if (error) {
        alert(`Error: ${error}`)
      }
    } catch (err) {
      console.error('Error saving inventory item:', err)
      alert('Error al guardar elemento de inventario')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof InventoryFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProductChange = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      product_id: productId,
      product_variant_id: '' // Reset variant when product changes
    }))
  }

  const generateSKU = () => {
    const selectedProduct = products.find((p: any) => p.id === formData.product_id)
    const selectedVariant = productVariants.find((v: any) => v.id === formData.product_variant_id)
    
    if (selectedProduct) {
      let sku = selectedProduct.sku || selectedProduct.name.toUpperCase().replace(/\s+/g, '')
      if (selectedVariant) {
        sku += `-${selectedVariant.variant_value.toUpperCase().replace(/\s+/g, '')}`
      }
      sku += `-${Date.now().toString().slice(-4)}`
      
      handleInputChange('sku', sku)
    }
  }

  if (!isOpen) return null

  const totalQuantity = formData.quantity_available + formData.quantity_reserved + formData.quantity_on_order
  const isLowStock = formData.reorder_level && formData.quantity_available <= formData.reorder_level

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {inventory ? 'Editar Elemento de Inventario' : 'Nuevo Elemento de Inventario'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Información del producto */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Información del Producto</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Producto
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map((product: any) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variante
                  </label>
                  <select
                    value={formData.product_variant_id}
                    onChange={(e) => handleInputChange('product_variant_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!formData.product_id}
                  >
                    <option value="">Sin variante</option>
                    {productVariants.map((variant: any) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name} ({variant.variant_type}: {variant.variant_value})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SKU y Proveedor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Código único del producto"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateSKU}
                    className="px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-l-0 border-gray-300 rounded-r-md hover:bg-blue-100"
                  >
                    Generar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sin proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cantidades */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Gestión de Stock</h4>
                {isLowStock && (
                  <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
                    ⚠️ Stock Bajo
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad Disponible
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity_available}
                    onChange={(e) => handleInputChange('quantity_available', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad Reservada
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity_reserved}
                    onChange={(e) => handleInputChange('quantity_reserved', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    En Pedido
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity_on_order}
                    onChange={(e) => handleInputChange('quantity_on_order', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">
                  <strong>Stock Total: {totalQuantity} unidades</strong>
                </div>
              </div>
            </div>

            {/* Configuración de reorden */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel de Reorden
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorder_level}
                  onChange={(e) => handleInputChange('reorder_level', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Cantidad mínima antes de reordenar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad de Reorden
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorder_quantity}
                  onChange={(e) => handleInputChange('reorder_quantity', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Cantidad a pedir cuando sea necesario"
                />
              </div>
            </div>

            {/* Costo y ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo Unitario
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => handleInputChange('unit_cost', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Estante, pasillo, almacén..."
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notas adicionales sobre el elemento de inventario"
              />
            </div>

            {/* Estado activo */}
            <div className="flex items-center">
              <input
                id="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Elemento activo
              </label>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : inventory ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}