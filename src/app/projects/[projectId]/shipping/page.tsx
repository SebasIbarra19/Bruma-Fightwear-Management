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
import { SteppedProgress } from '@/components/ui/progress'
import Link from 'next/link'

interface UserProject {
  project_id: string
  project_name: string
  project_slug: string
  project_type: string
}

interface ProjectShippingData {
  project: UserProject
}

interface Shipment {
  id: string
  project_id: string
  order_number: string
  customer_name: string
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
  tracking_code: string
  shipping_method: string
  estimated_delivery: string
  actual_delivery?: string | null
  shipping_cost: number
  destination: {
    address: string
    city: string
    province: string
    postal_code: string
    phone?: string
  }
  notes?: string
  created_at: string
  updated_at: string
}

interface ShippingMethod {
  id: string
  name: string
  carrier: string
  type: 'standard' | 'express' | 'overnight'
  min_days: number
  max_days: number
  base_cost: number
  is_active: boolean
  created_at: string
}

export default function ShippingPage({ params }: { params: { projectId: string } }) {
  const { user, isLoading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [projectData, setProjectData] = useState<ProjectShippingData | null>(null)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])

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
      
      // Mock shipments
      setShipments([
        {
          id: "1",
          project_id: params.projectId,
          order_number: "ORD-2024-001",
          customer_name: "Juan Pérez",
          status: "in_transit",
          tracking_code: "1Z999AA1234567890",
          shipping_method: "UPS Ground",
          estimated_delivery: "2024-02-10T10:00:00Z",
          actual_delivery: null,
          shipping_cost: 15.99,
          destination: {
            address: "123 Main Street",
            city: "San José",
            province: "San José",
            postal_code: "10101",
            phone: "+506 8888-9999"
          },
          notes: "Entregar en recepción",
          created_at: "2024-02-05T10:00:00Z",
          updated_at: "2024-02-06T10:00:00Z"
        },
        {
          id: "2",
          project_id: params.projectId,
          order_number: "ORD-2024-002",
          customer_name: "María González",
          status: "delivered",
          tracking_code: "1Z999AA1234567891",
          shipping_method: "FedEx Express",
          estimated_delivery: "2024-02-03T10:00:00Z",
          actual_delivery: "2024-02-03T14:30:00Z",
          shipping_cost: 25.50,
          destination: {
            address: "456 Oak Avenue",
            city: "Cartago",
            province: "Cartago",
            postal_code: "30101",
            phone: "+506 7777-8888"
          },
          created_at: "2024-02-01T10:00:00Z",
          updated_at: "2024-02-03T14:30:00Z"
        },
        {
          id: "3",
          project_id: params.projectId,
          order_number: "ORD-2024-003",
          customer_name: "Carlos Rodríguez",
          status: "pending",
          tracking_code: "1Z999AA1234567892",
          shipping_method: "DHL Standard",
          estimated_delivery: "2024-02-12T10:00:00Z",
          actual_delivery: null,
          shipping_cost: 18.75,
          destination: {
            address: "789 Pine Street",
            city: "Alajuela",
            province: "Alajuela",
            postal_code: "20101",
            phone: "+506 6666-7777"
          },
          notes: "Llamar antes de entregar",
          created_at: "2024-02-07T10:00:00Z",
          updated_at: "2024-02-07T10:00:00Z"
        }
      ])
      
      // Mock shipping methods
      setShippingMethods([
        {
          id: "1",
          name: "Envío Estándar",
          carrier: "Correos de Costa Rica",
          type: "standard",
          min_days: 3,
          max_days: 7,
          base_cost: 5.00,
          is_active: true,
          created_at: "2024-01-01T10:00:00Z"
        },
        {
          id: "2",
          name: "Envío Express",
          carrier: "UPS",
          type: "express",
          min_days: 1,
          max_days: 3,
          base_cost: 15.00,
          is_active: true,
          created_at: "2024-01-01T10:00:00Z"
        },
        {
          id: "3",
          name: "Envío Nocturno",
          carrier: "FedEx",
          type: "overnight",
          min_days: 1,
          max_days: 1,
          base_cost: 25.00,
          is_active: true,
          created_at: "2024-01-01T10:00:00Z"
        }
      ])
      
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      'in_transit': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En Tránsito' },
      'delivered': { bg: 'bg-green-100', text: 'text-green-800', label: 'Entregado' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getMethodTypeBadge = (type: string) => {
    const typeConfig = {
      'standard': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Estándar' },
      'express': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Express' },
      'overnight': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Nocturno' }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.standard
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const shippingTabs = [
    {
      id: 'shipments',
      label: 'Gestión de Envíos',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Total Envíos</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  {shipments.length}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>Este mes</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>En Tránsito</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" style={{ color: theme.colors.warning }}>
                  {shipments.filter(s => s.status === 'in_transit').length}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>Activos</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Entregados</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" style={{ color: theme.colors.success }}>
                  {shipments.filter(s => s.status === 'delivered').length}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>Completados</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Costo Total</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  {formatCurrency(shipments.reduce((sum, s) => sum + s.shipping_cost, 0))}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>En envíos</p>
              </CardContent>
            </Card>
          </div>

          {/* ESTRUCTURA PERFECTA - Como Control de Stock */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                  Gestión de Envíos
                </h3>
                <p style={{ color: theme.colors.textSecondary }}>
                  Administra todos los envíos y su seguimiento
                </p>
              </div>
              <Button 
                className="shadow-lg"
                onClick={() => console.log('Crear nuevo envío')}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                  border: 'none'
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Envío
              </Button>
            </div>

            {/* Tabla de envíos usando ModernTable */}
            <ModernTable
              data={shipments}
              columns={[
                {
                  key: 'order_number',
                  title: 'N° Orden',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="font-medium" style={{ color: theme.colors.textPrimary }}>{value}</div>
                      <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {row.customer_name}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'tracking_code',
                  title: 'Código Rastreo',
                  render: (value, row) => (
                    <div>
                      <div className="font-mono text-sm" style={{ color: theme.colors.textPrimary }}>{value}</div>
                      <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                        {row.shipping_method}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'status',
                  title: 'Estado',
                  render: (value) => getStatusBadge(value)
                },
                {
                  key: 'estimated_delivery',
                  title: 'Entrega Estimada',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="text-sm" style={{ color: theme.colors.textPrimary }}>
                        {new Date(value).toLocaleDateString()}
                      </div>
                      {row.actual_delivery && (
                        <div className="text-xs text-green-600">
                          Entregado: {new Date(row.actual_delivery).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'shipping_cost',
                  title: 'Costo',
                  sortable: true,
                  render: (value) => (
                    <div className="font-medium" style={{ color: theme.colors.primary }}>
                      {formatCurrency(value)}
                    </div>
                  )
                }
              ]}
              renderExpandedRow={(row) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.primary }}>Detalles del Envío</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Orden:</span> {row.order_number}</p>
                      <p><span className="text-gray-400">Cliente:</span> {row.customer_name}</p>
                      <p><span className="text-gray-400">Método:</span> {row.shipping_method}</p>
                      <p><span className="text-gray-400">Rastreo:</span> {row.tracking_code}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.success }}>Destino</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Dirección:</span> {row.destination.address}</p>
                      <p><span className="text-gray-400">Ciudad:</span> {row.destination.city}, {row.destination.province}</p>
                      <p><span className="text-gray-400">Código Postal:</span> {row.destination.postal_code}</p>
                      {row.destination.phone && (
                        <p><span className="text-gray-400">Teléfono:</span> {row.destination.phone}</p>
                      )}
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
                        Rastrear Envío
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar Envío
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H9.414a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 005.586 6H4a2 2 0 00-2 2v11a2 2 0 002 2h4a2 2 0 002-2v-1" />
                        </svg>
                        Imprimir Etiqueta
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              onEdit={(shipment) => console.log('Editar envío:', shipment)}
              onDelete={(shipment) => console.log('Eliminar envío:', shipment)}
              onRefresh={() => console.log('Refrescar envíos')}
            />
          </div>
        </div>
      )
    },
    {
      id: 'methods',
      label: 'Métodos de Envío',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* ESTRUCTURA PERFECTA - Como Control de Stock */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                  Métodos de Envío
                </h3>
                <p style={{ color: theme.colors.textSecondary }}>
                  Configura los métodos de envío disponibles
                </p>
              </div>
              <Button 
                className="shadow-lg"
                onClick={() => console.log('Agregar método')}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                  border: 'none'
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Método
              </Button>
            </div>

            {/* Tabla de métodos de envío usando ModernTable */}
            <ModernTable
              data={shippingMethods}
              columns={[
                {
                  key: 'name',
                  title: 'Método',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="font-medium" style={{ color: theme.colors.textPrimary }}>{value}</div>
                      <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {row.carrier}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'type',
                  title: 'Tipo',
                  render: (value) => getMethodTypeBadge(value)
                },
                {
                  key: 'min_days',
                  title: 'Tiempo de Entrega',
                  render: (value, row) => (
                    <div>
                      <div className="text-sm" style={{ color: theme.colors.textPrimary }}>
                        {value === row.max_days ? `${value} día${value > 1 ? 's' : ''}` : `${value}-${row.max_days} días`}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'base_cost',
                  title: 'Costo Base',
                  sortable: true,
                  render: (value) => (
                    <div className="font-medium" style={{ color: theme.colors.primary }}>
                      {formatCurrency(value)}
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
                }
              ]}
              renderExpandedRow={(row) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.primary }}>Información del Método</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Nombre:</span> {row.name}</p>
                      <p><span className="text-gray-400">Transportista:</span> {row.carrier}</p>
                      <p><span className="text-gray-400">Tipo:</span> {getMethodTypeBadge(row.type)}</p>
                      <p><span className="text-gray-400">Creado:</span> {new Date(row.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.success }}>Configuración</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Tiempo mínimo:</span> {row.min_days} día{row.min_days > 1 ? 's' : ''}</p>
                      <p><span className="text-gray-400">Tiempo máximo:</span> {row.max_days} día{row.max_days > 1 ? 's' : ''}</p>
                      <p><span className="text-gray-400">Costo base:</span> {formatCurrency(row.base_cost)}</p>
                      <p><span className="text-gray-400">Estado:</span> {row.is_active ? 'Activo' : 'Inactivo'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.warning }}>Acciones</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar Método
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Ver Estadísticas
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => console.log('Toggle status:', row.id)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {row.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              onEdit={(method) => console.log('Editar método:', method)}
              onDelete={(method) => console.log('Eliminar método:', method)}
              onRefresh={() => console.log('Refrescar métodos')}
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
      pageTitle="Gestión de Envíos"
    >
      <Tabs tabs={shippingTabs} defaultTab="shipments" />
    </ProjectPageLayout>
  )
}