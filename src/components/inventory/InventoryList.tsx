'use client'

import { useState, useEffect } from 'react'
import { useInventory } from '@/hooks/useInventory'
import { formatCurrency, formatNumber } from '@/lib/utils'
import InventoryForm from './InventoryForm'
import type { Inventory, InventoryWithDetails } from '@/types/database'

interface InventoryListProps {
  projectId: string
}

export default function InventoryList({ projectId }: InventoryListProps) {
  const { 
    inventory, 
    isLoading, 
    error, 
    deleteInventoryItem, 
    searchInventory,
    getLowStockItems,
    adjustStock
  } = useInventory(projectId)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredInventory, setFilteredInventory] = useState<InventoryWithDetails[]>([])
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [showLowStock, setShowLowStock] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [adjustingStock, setAdjustingStock] = useState<string | null>(null)
  const [newQuantity, setNewQuantity] = useState<number>(0)

  // Si hay error de tabla no existe, mostrar guía de configuración
  if (error && (error.includes('relation "inventory" does not exist') || error.includes('relation') || error.includes('does not exist'))) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-6 text-lg font-medium text-gray-900">Configuración de Base de Datos Requerida</h3>
            <p className="mt-2 text-sm text-gray-600">
              Las tablas de inventario necesitan ser creadas en Supabase.
            </p>
            <div className="mt-6">
              <a 
                href="/setup"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Configurar Base de Datos
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Si hay otro tipo de error, mostrarlo
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error al cargar inventario</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Filtrar inventario
  useEffect(() => {
    let filtered = inventory

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      filtered = inventory.filter(item =>
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.variant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por stock bajo
    if (showLowStock) {
      filtered = filtered.filter(item => item.low_stock)
    }

    // Filtrar por estado activo/inactivo
    if (!showInactive) {
      filtered = filtered.filter(item => item.is_active)
    }

    setFilteredInventory(filtered)
  }, [inventory, searchTerm, showLowStock, showInactive])

  const handleEdit = (item: Inventory) => {
    setSelectedInventory(item)
    setIsFormOpen(true)
  }

  const handleDelete = async (item: InventoryWithDetails) => {
    if (confirm(`¿Está seguro que desea eliminar el elemento "${item.sku}"?`)) {
      const success = await deleteInventoryItem(item.id)
      if (!success) {
        alert('No se pudo eliminar el elemento de inventario')
      }
    }
  }

  const handleFormClose = () => {
    setSelectedInventory(null)
    setIsFormOpen(false)
  }

  const handleFormSuccess = () => {
    // El hook ya actualiza la lista automáticamente
  }

  const handleAdjustStock = async (inventoryId: string) => {
    const reason = prompt('Razón del ajuste de stock:')
    if (reason === null) return // Usuario canceló
    
    const success = await adjustStock(inventoryId, newQuantity, reason)
    if (success) {
      setAdjustingStock(null)
      setNewQuantity(0)
    } else {
      alert('No se pudo ajustar el stock')
    }
  }

  const startStockAdjustment = (item: InventoryWithDetails) => {
    setAdjustingStock(item.id)
    setNewQuantity(item.quantity_available)
  }

  const cancelStockAdjustment = () => {
    setAdjustingStock(null)
    setNewQuantity(0)
  }

  const getStockStatusBadge = (item: InventoryWithDetails) => {
    if (!item.is_active) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          Inactivo
        </span>
      )
    }

    if (item.low_stock) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Stock Bajo
        </span>
      )
    }

    if (item.quantity_available === 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
          Sin Stock
        </span>
      )
    }

    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
        En Stock
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando inventario...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">Error al cargar inventario</h3>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona el stock y ubicaciones de tus productos
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Elemento
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Total Elementos</p>
              <p className="text-lg font-semibold text-gray-600">{formatNumber(inventory.length)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">En Stock</p>
              <p className="text-lg font-semibold text-gray-600">
                {formatNumber(inventory.filter(item => item.quantity_available > 0).length)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Stock Bajo</p>
              <p className="text-lg font-semibold text-gray-600">
                {formatNumber(inventory.filter(item => item.low_stock).length)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Sin Stock</p>
              <p className="text-lg font-semibold text-gray-600">
                {formatNumber(inventory.filter(item => item.quantity_available === 0).length)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar en inventario
            </label>
            <input
              type="text"
              placeholder="Buscar por SKU, producto, variante o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Solo stock bajo</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Mostrar inactivos</span>
            </label>
          </div>
        </div>
      </div>

      {/* Lista de inventario */}
      {filteredInventory.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay elementos en inventario</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron elementos que coincidan con tu búsqueda.' : 'Comienza agregando tu primer elemento de inventario.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Elemento
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo
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
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.product_name || 'Producto sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {item.sku}
                        </div>
                        {item.variant_name && (
                          <div className="text-sm text-gray-500">
                            {item.variant_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {adjustingStock === item.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            value={newQuantity}
                            onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleAdjustStock(item.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelStockAdjustment}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-900">
                            Disponible: <strong>{formatNumber(item.quantity_available)}</strong>
                          </div>
                          <div className="text-sm text-gray-500">
                            Reservado: {formatNumber(item.quantity_reserved)}
                          </div>
                          <div className="text-sm text-gray-500">
                            En pedido: {formatNumber(item.quantity_on_order)}
                          </div>
                          {item.reorder_level && (
                            <div className="text-xs text-gray-400">
                              Min: {formatNumber(item.reorder_level)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.location || 'Sin ubicación'}
                      </div>
                      {item.supplier_name && (
                        <div className="text-sm text-gray-500">
                          {item.supplier_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.unit_cost ? formatCurrency(item.unit_cost) : 'Sin costo'}
                      </div>
                      {item.unit_cost && item.quantity_available > 0 && (
                        <div className="text-sm text-gray-500">
                          Total: {formatCurrency(item.unit_cost * item.quantity_available)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStockStatusBadge(item)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => startStockAdjustment(item)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Ajustar
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      <InventoryForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        inventory={selectedInventory}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}