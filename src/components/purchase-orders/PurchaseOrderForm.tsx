'use client'

import { useState, useEffect } from 'react'
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders'
import { useSuppliers } from '@/hooks/useSuppliers'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PURCHASE_ORDER_STATUS } from '@/types/database'
import type { 
  PurchaseOrder, 
  PurchaseOrderFormData, 
  PurchaseOrderItemFormData, 
  PurchaseOrderStatus 
} from '@/types/database'

interface PurchaseOrderFormProps {
  isOpen: boolean
  onClose: () => void
  purchaseOrder?: PurchaseOrder | null
  onSuccess?: () => void
}

export default function PurchaseOrderForm({ isOpen, onClose, purchaseOrder, onSuccess }: PurchaseOrderFormProps) {
  const { createPurchaseOrder, updatePurchaseOrder, error } = usePurchaseOrders()
  const { suppliers } = useSuppliers()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    supplier_id: '',
    order_number: '',
    status: PURCHASE_ORDER_STATUS.DRAFT,
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    subtotal: 0,
    tax_amount: 0,
    shipping_cost: 0,
    total_amount: 0,
    currency: 'USD',
    payment_terms: '',
    notes: '',
    items: []
  })

  // Cargar datos necesarios al abrir el modal
  useEffect(() => {
    if (isOpen && !suppliers.length) {
      // Los suppliers ya se cargan automáticamente en el hook
    }
  }, [isOpen, suppliers.length])

  // Cargar datos de la orden si está en modo edición
  useEffect(() => {
    if (purchaseOrder) {
      setFormData({
        supplier_id: purchaseOrder.supplier_id,
        order_number: purchaseOrder.order_number || '',
        status: purchaseOrder.status as PurchaseOrderStatus,
        order_date: purchaseOrder.order_date || new Date().toISOString().split('T')[0],
        expected_date: purchaseOrder.expected_date || '',
        subtotal: purchaseOrder.subtotal,
        tax_amount: purchaseOrder.tax_amount,
        shipping_cost: purchaseOrder.shipping_cost,
        total_amount: purchaseOrder.total_amount,
        currency: purchaseOrder.currency,
        payment_terms: purchaseOrder.payment_terms || '',
        notes: purchaseOrder.notes || '',
        items: [] // Se cargarían desde la base de datos
      })
    } else {
      // Reset form for new order
      const orderNumber = `PO-${Date.now().toString().slice(-6)}`
      setFormData({
        supplier_id: '',
        order_number: orderNumber,
        status: PURCHASE_ORDER_STATUS.DRAFT,
        order_date: new Date().toISOString().split('T')[0],
        expected_date: '',
        subtotal: 0,
        tax_amount: 0,
        shipping_cost: 0,
        total_amount: 0,
        currency: 'USD',
        payment_terms: '',
        notes: '',
        items: []
      })
    }
  }, [purchaseOrder])

  // Recalcular totales cuando cambien los items
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total_cost, 0)
    const total = subtotal + formData.tax_amount + formData.shipping_cost
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      total_amount: total
    }))
  }, [formData.items, formData.tax_amount, formData.shipping_cost])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.supplier_id) {
      alert('Debe seleccionar un proveedor')
      return
    }

    if (formData.items.length === 0) {
      alert('Debe agregar al menos un elemento a la orden')
      return
    }

    setIsLoading(true)

    try {
      let result
      
      if (purchaseOrder) {
        result = await updatePurchaseOrder(purchaseOrder.id, formData)
      } else {
        result = await createPurchaseOrder(formData)
      }

      if (result) {
        onSuccess?.()
        onClose()
      } else if (error) {
        alert(`Error: ${error}`)
      }
    } catch (err) {
      console.error('Error saving purchase order:', err)
      alert('Error al guardar orden de compra')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof Omit<PurchaseOrderFormData, 'items'>, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addItem = () => {
    const newItem: PurchaseOrderItemFormData = {
      sku: '',
      description: '',
      quantity_ordered: 1,
      unit_cost: 0,
      total_cost: 0,
      notes: ''
    }
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const updateItem = (index: number, field: keyof PurchaseOrderItemFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          
          // Recalcular total_cost si cambió quantity_ordered o unit_cost
          if (field === 'quantity_ordered' || field === 'unit_cost') {
            updatedItem.total_cost = updatedItem.quantity_ordered * updatedItem.unit_cost
          }
          
          return updatedItem
        }
        return item
      })
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {purchaseOrder ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
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
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Orden
                </label>
                <input
                  type="text"
                  value={formData.order_number}
                  onChange={(e) => handleInputChange('order_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="PO-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as PurchaseOrderStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={PURCHASE_ORDER_STATUS.DRAFT}>Borrador</option>
                  <option value={PURCHASE_ORDER_STATUS.PENDING}>Pendiente</option>
                  <option value={PURCHASE_ORDER_STATUS.ORDERED}>Ordenada</option>
                  <option value={PURCHASE_ORDER_STATUS.PARTIAL}>Parcial</option>
                  <option value={PURCHASE_ORDER_STATUS.RECEIVED}>Recibida</option>
                  <option value={PURCHASE_ORDER_STATUS.CANCELLED}>Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD - Dólares</option>
                  <option value="EUR">EUR - Euros</option>
                  <option value="PEN">PEN - Soles</option>
                </select>
              </div>
            </div>

            {/* Proveedor y fechas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor *
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {selectedSupplier && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedSupplier.email} • {selectedSupplier.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Orden
                </label>
                <input
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => handleInputChange('order_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Esperada
                </label>
                <input
                  type="date"
                  value={formData.expected_date}
                  onChange={(e) => handleInputChange('expected_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Términos de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Términos de Pago
              </label>
              <input
                type="text"
                value={formData.payment_terms}
                onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 30 días, contado, etc."
              />
            </div>

            {/* Items de la orden */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Elementos de la Orden</h4>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar Elemento
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-500">No hay elementos en la orden</p>
                  <button
                    type="button"
                    onClick={addItem}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                  >
                    Agregar primer elemento
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-3 border border-gray-200 rounded-lg">
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="SKU"
                          value={item.sku}
                          onChange={(e) => updateItem(index, 'sku', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Descripción"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Cantidad"
                          value={item.quantity_ordered}
                          onChange={(e) => updateItem(index, 'quantity_ordered', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Precio"
                          value={item.unit_cost}
                          onChange={(e) => updateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-1">
                        <div className="px-2 py-1 text-sm text-gray-700">
                          {formatCurrency(item.total_cost)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-full h-7 text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notas adicionales sobre la orden"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(formData.subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-600">Impuestos:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.tax_amount}
                    onChange={(e) => handleInputChange('tax_amount', parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-600">Envío:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shipping_cost}
                    onChange={(e) => handleInputChange('shipping_cost', parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                  />
                </div>
                
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(formData.total_amount)}</span>
                </div>
              </div>
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
                disabled={isLoading || formData.items.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : purchaseOrder ? 'Actualizar' : 'Crear Orden'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}