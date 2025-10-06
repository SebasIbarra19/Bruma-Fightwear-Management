'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { ProjectPageLayout } from '@/components/layout/ProjectPageLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { ModernTable } from '@/components/ui/modern-table'
import Link from 'next/link'

interface UserProject {
  project_id: string
  project_name: string
  project_slug: string
  project_type: string
}

interface ProjectSuppliersData {
  project: UserProject
}

interface Supplier {
  id: string
  project_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  contact_person?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PurchaseOrder {
  id: string
  project_id: string
  supplier_id: string
  order_number: string
  status: 'pending' | 'completed' | 'cancelled'
  order_date: string
  delivery_date?: string
  total_amount?: number
  currency: string
  created_at: string
}

export default function SuppliersPage({ params }: { params: { projectId: string } }) {
  const { user, isLoading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [projectData, setProjectData] = useState<ProjectSuppliersData | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])

  // Cargar datos del proyecto
  useEffect(() => {
    if ((user || !authLoading) && params.projectId) {
      loadProjectData()
    }
  }, [user, authLoading, params.projectId])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      
      // Mock data para demostración
      setProjectData({ 
        project: { 
          project_id: params.projectId, 
          project_name: "BRUMA Fightwear", 
          project_slug: "bruma-fightwear",
          project_type: "ecommerce"
        } 
      })
      
      // Mock suppliers
      setSuppliers([
        {
          id: "1",
          project_id: params.projectId,
          name: "Textiles MMA Pro",
          email: "ventas@mmapro.com",
          phone: "+1-555-0123",
          address: "123 Industrial Ave",
          city: "Los Angeles",
          country: "USA",
          contact_person: "Carlos Rodriguez",
          is_active: true,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z"
        },
        {
          id: "2",
          project_id: params.projectId,
          name: "Leather Goods Co.",
          email: "info@leathergoods.com",
          phone: "+1-555-0124",
          address: "456 Craft Street",
          city: "Chicago",
          country: "USA",
          contact_person: "Maria Santos",
          is_active: true,
          created_at: "2024-01-20T10:00:00Z",
          updated_at: "2024-01-20T10:00:00Z"
        },
        {
          id: "3",
          project_id: params.projectId,
          name: "Equipment Direct",
          email: "orders@equipmentdirect.com",
          phone: "+1-555-0125",
          address: "789 Supply Blvd",
          city: "Miami",
          country: "USA",
          contact_person: "John Smith",
          is_active: false,
          created_at: "2024-02-01T10:00:00Z",
          updated_at: "2024-02-01T10:00:00Z"
        }
      ])
      
      // Mock purchase orders
      setPurchaseOrders([
        {
          id: "1",
          project_id: params.projectId,
          supplier_id: "1",
          order_number: "PO-2024-001",
          status: "completed",
          order_date: "2024-01-25T10:00:00Z",
          delivery_date: "2024-02-05T10:00:00Z",
          total_amount: 5420.50,
          currency: "USD",
          created_at: "2024-01-25T10:00:00Z"
        },
        {
          id: "2",
          project_id: params.projectId,
          supplier_id: "2",
          order_number: "PO-2024-002",
          status: "pending",
          order_date: "2024-02-01T10:00:00Z",
          total_amount: 3280.75,
          currency: "USD",
          created_at: "2024-02-01T10:00:00Z"
        }
      ])
      
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completada' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const suppliersTabs = [
    {
      id: 'suppliers',
      label: 'Gestión de Proveedores',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Total Proveedores</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  {suppliers.length}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>Activos: {suppliers.filter(s => s.is_active).length}</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Órdenes Totales</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" style={{ color: theme.colors.warning }}>
                  {purchaseOrders.length}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>Este mes</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Valor Total</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" style={{ color: theme.colors.success }}>
                  {formatCurrency(purchaseOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0))}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>En órdenes</p>
              </CardContent>
            </Card>
          </div>

          {/* ESTRUCTURA PERFECTA - Como Control de Stock */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                  Lista de Proveedores
                </h3>
                <p style={{ color: theme.colors.textSecondary }}>
                  Gestiona todos tus proveedores
                </p>
              </div>
              <Button 
                className="shadow-lg"
                onClick={() => console.log('Agregar proveedor')}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                  border: 'none'
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Proveedor
              </Button>
            </div>

            {/* Tabla de proveedores usando ModernTable */}
            <ModernTable
              data={suppliers}
              columns={[
                {
                  key: 'name',
                  title: 'Proveedor',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="font-medium" style={{ color: theme.colors.textPrimary }}>{value}</div>
                      <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {row.contact_person && `${row.contact_person} • `}{row.city}, {row.country}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'email',
                  title: 'Contacto',
                  render: (value, row) => (
                    <div>
                      {value && <div className="text-sm" style={{ color: theme.colors.textPrimary }}>{value}</div>}
                      {row.phone && <div className="text-sm" style={{ color: theme.colors.textSecondary }}>{row.phone}</div>}
                    </div>
                  )
                },
                {
                  key: 'is_active',
                  title: 'Estado',
                  render: (value) => (
                    <span 
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        value ? 'text-green-700' : 'text-red-700'
                      }`}
                      style={{ 
                        backgroundColor: value ? theme.colors.success + '20' : theme.colors.error + '20',
                        border: `1px solid ${value ? theme.colors.success : theme.colors.error}30`
                      }}
                    >
                      {value ? 'Activo' : 'Inactivo'}
                    </span>
                  )
                },
                {
                  key: 'created_at',
                  title: 'Registrado',
                  sortable: true,
                  render: (value) => (
                    <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      {new Date(value).toLocaleDateString()}
                    </div>
                  )
                }
              ]}
              renderExpandedRow={(row) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.primary }}>Información de Contacto</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Email:</span> {row.email || 'No disponible'}</p>
                      <p><span className="text-gray-400">Teléfono:</span> {row.phone || 'No disponible'}</p>
                      <p><span className="text-gray-400">Contacto:</span> {row.contact_person || 'No especificado'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.success }}>Dirección</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Dirección:</span> {row.address || 'No disponible'}</p>
                      <p><span className="text-gray-400">Ciudad:</span> {row.city || 'No disponible'}</p>
                      <p><span className="text-gray-400">País:</span> {row.country || 'No disponible'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.warning }}>Acciones</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar Proveedor
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Ver Órdenes
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Nueva Orden
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              onEdit={(supplier) => console.log('Editar:', supplier)}
              onDelete={(supplier) => console.log('Eliminar:', supplier)}
              onRefresh={() => console.log('Refrescar proveedores')}
            />
          </div>
        </div>
      )
    },
    {
      id: 'orders',
      label: 'Órdenes de Compra',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* ESTRUCTURA PERFECTA - Como Control de Stock */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                  Órdenes de Compra
                </h3>
                <p style={{ color: theme.colors.textSecondary }}>
                  Gestiona todas las órdenes de compra
                </p>
              </div>
              <Button 
                className="shadow-lg"
                onClick={() => console.log('Nueva orden')}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                  border: 'none'
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Orden
              </Button>
            </div>

            {/* Tabla de órdenes usando ModernTable */}
            <ModernTable
              data={purchaseOrders}
              columns={[
                {
                  key: 'order_number',
                  title: 'N° Orden',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="font-medium" style={{ color: theme.colors.textPrimary }}>{value}</div>
                      <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {new Date(row.order_date).toLocaleDateString()}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'supplier_id',
                  title: 'Proveedor',
                  render: (value) => {
                    const supplier = suppliers.find(s => s.id === value)
                    return (
                      <div>
                        <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                          {supplier?.name || 'Proveedor no encontrado'}
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          {supplier?.contact_person}
                        </div>
                      </div>
                    )
                  }
                },
                {
                  key: 'status',
                  title: 'Estado',
                  render: (value) => getStatusBadge(value)
                },
                {
                  key: 'total_amount',
                  title: 'Total',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="font-medium" style={{ color: theme.colors.primary }}>
                        {value ? formatCurrency(value, row.currency) : 'N/A'}
                      </div>
                    </div>
                  )
                }
              ]}
              renderExpandedRow={(row) => {
                const supplier = suppliers.find(s => s.id === row.supplier_id)
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.primary }}>Detalles de la Orden</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-gray-400">N° Orden:</span> {row.order_number}</p>
                        <p><span className="text-gray-400">Fecha:</span> {new Date(row.order_date).toLocaleDateString()}</p>
                        <p><span className="text-gray-400">Entrega:</span> {row.delivery_date ? new Date(row.delivery_date).toLocaleDateString() : 'Por definir'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.success }}>Proveedor</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-gray-400">Nombre:</span> {supplier?.name}</p>
                        <p><span className="text-gray-400">Contacto:</span> {supplier?.contact_person}</p>
                        <p><span className="text-gray-400">Email:</span> {supplier?.email}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.warning }}>Acciones</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver Detalles
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              }}
              onEdit={(order) => console.log('Editar orden:', order)}
              onDelete={(order) => console.log('Eliminar orden:', order)}
              onRefresh={() => console.log('Refrescar órdenes')}
            />
          </div>
        </div>
      )
    }
  ]

  return (
    <ProjectPageLayout
      projectData={projectData}
      loading={loading}
      pageTitle="Gestión de Proveedores"
    >
      <Tabs tabs={suppliersTabs} defaultTab="suppliers" />
    </ProjectPageLayout>
  )
}