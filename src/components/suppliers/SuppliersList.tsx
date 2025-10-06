'use client'

import { useState, useEffect } from 'react'
import { useSuppliers } from '@/hooks/useSuppliers'
import { formatCurrency, formatDate } from '@/lib/utils'
import SupplierForm from './SupplierForm'
import type { Supplier, SupplierWithStats } from '@/types/database'

interface SuppliersListProps {
  projectId: string
}

export default function SuppliersList({ projectId }: SuppliersListProps) {
  const { 
    suppliers, 
    isLoading, 
    error, 
    deleteSupplier, 
    searchSuppliers 
  } = useSuppliers(projectId)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredSuppliers, setFilteredSuppliers] = useState<SupplierWithStats[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    // El hook useSuppliers ya maneja la carga automática
  }, [])

  // Filtrar proveedores
  useEffect(() => {
    let filtered = suppliers

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      filtered = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.tax_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado activo/inactivo
    if (!showInactive) {
      filtered = filtered.filter(supplier => supplier.is_active)
    }

    setFilteredSuppliers(filtered)
  }, [suppliers, searchTerm, showInactive])

  // Si hay error (posiblemente tablas no existen), mostrar guía de configuración
  if (error && error.includes('relation "suppliers" does not exist')) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-6 text-lg font-medium text-gray-900">Configuración de Base de Datos Requerida</h3>
            <p className="mt-2 text-sm text-gray-600">
              Las tablas de la Fase 2 (Inventario y Proveedores) necesitan ser creadas en Supabase.
            </p>
            <div className="mt-6">
              <a 
                href="/setup"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Configurar Base de Datos
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Una vez configurada la base de datos, este módulo funcionará correctamente.
            </p>
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
              <h3 className="text-sm font-medium text-red-800">Error al cargar proveedores</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsFormOpen(true)
  }

  const handleDelete = async (supplier: Supplier) => {
    if (confirm(`¿Está seguro que desea eliminar el proveedor "${supplier.name}"?`)) {
      const success = await deleteSupplier(supplier.id)
      if (!success) {
        alert('No se pudo eliminar el proveedor')
      }
    }
  }

  const handleFormClose = () => {
    setSelectedSupplier(null)
    setIsFormOpen(false)
  }

  const handleFormSuccess = () => {
    // El hook ya actualiza la lista automáticamente
  }

  const getStatusBadge = (supplier: SupplierWithStats) => {
    if (!supplier.is_active) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          Inactivo
        </span>
      )
    }

    if (supplier.pending_orders && supplier.pending_orders > 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
          Con pedidos
        </span>
      )
    }

    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
        Activo
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando proveedores...</span>
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
        <h3 className="text-sm font-medium text-gray-900 mb-1">Error al cargar proveedores</h3>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona la información de tus proveedores
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Proveedor
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar proveedores
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre, contacto, email o RUC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
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

      {/* Lista de proveedores */}
      {filteredSuppliers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proveedores</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron proveedores que coincidan con tu búsqueda.' : 'Comienza creando tu primer proveedor.'}
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
                Crear Proveedor
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
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estadísticas
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
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.name}
                        </div>
                        {supplier.tax_id && (
                          <div className="text-sm text-gray-500">
                            RUC: {supplier.tax_id}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {supplier.contact_person && (
                          <div className="text-sm text-gray-900">
                            {supplier.contact_person}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="text-sm text-gray-500">
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="text-sm text-gray-500">
                            {supplier.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Órdenes: {supplier.total_orders || 0}</div>
                        <div>Pendientes: {supplier.pending_orders || 0}</div>
                        {supplier.total_spent && supplier.total_spent > 0 && (
                          <div>Total: {formatCurrency(supplier.total_spent)}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(supplier)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(supplier)}
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
      <SupplierForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        supplier={selectedSupplier}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}