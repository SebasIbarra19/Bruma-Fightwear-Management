'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { ModernTable } from '@/components/ui/modern-table'
import { ProjectPageLayout } from '@/components/layout/ProjectPageLayout'

interface UserProject {
  project_id: string
  project_name: string
  project_slug: string
  project_type: string
}

interface ProjectCustomersData {
  project: UserProject
}

export default function CustomersPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const projectSlug = params.projectId
  
  const [projectData, setProjectData] = useState<ProjectCustomersData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProjectData = async () => {
      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        const { data: userProjects, error } = await supabase
          .rpc('get_user_projects', { user_uuid: user.id })

        if (error) throw error

        const project = userProjects?.find((p: UserProject) => p.project_slug === projectSlug)
        
        if (!project) {
          console.error('Proyecto no encontrado')
          router.push('/dashboard')
          return
        }

        setProjectData({ project })
      } catch (error) {
        console.error('Error cargando proyecto:', error)
        router.push('/dashboard')
      }

      setLoading(false)
    }

    loadProjectData()
  }, [router, projectSlug, user])

  const customersTabs = [
    {
      id: 'overview',
      label: 'Resumen de Clientes',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* KPIs de Clientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Total Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>1,247</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>+18 este mes</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Clientes Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>892</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>71% del total</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Valor Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>$156</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.warning }}>Por pedido</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Nuevos Este Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>18</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>+14% vs anterior</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Clientes */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>Top 10 Clientes</CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Clientes con mayor volumen de compras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Deportes El Campeón", orders: 18, total: 4280, growth: "+15%" },
                  { name: "Gimnasio Fuerza Total", orders: 14, total: 3890, growth: "+8%" },
                  { name: "Academia Guerreros", orders: 12, total: 3550, growth: "+22%" },
                  { name: "Fight Club CR", orders: 10, total: 2980, growth: "+5%" },
                  { name: "MMA Warriors", orders: 8, total: 2650, growth: "-3%" }
                ].map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" 
                           style={{ backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, border: `1px solid ${theme.colors.border}` }}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: theme.colors.textPrimary }}>{customer.name}</p>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{customer.orders} pedidos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>${customer.total.toLocaleString()}</p>
                      <span className={`text-xs ${
                        customer.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {customer.growth}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'database',
      label: 'Base de Datos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* ESTRUCTURA PERFECTA - Como Control de Stock */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                  Base de Datos de Clientes
                </h3>
                <p style={{ color: theme.colors.textSecondary }}>
                  Gestión completa de información de clientes
                </p>
              </div>
              <Button 
                className="shadow-lg"
                onClick={() => console.log('Crear nuevo cliente')}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                  border: 'none'
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Cliente
              </Button>
            </div>

            {/* Tabla de Clientes usando ModernTable */}
            <ModernTable
              data={[
                {
                  id: 1,
                  name: "Deportes El Campeón",
                  email: "admin@deporteselcampeon.com",
                  phone: "+506 2222-3333",
                  type: "Tienda Deportiva",
                  location: "San José, CR",
                  orders: 18,
                  total: 4280,
                  lastOrder: "2024-09-28",
                  status: "active"
                },
                {
                  id: 2,
                  name: "Gimnasio Fuerza Total",
                  email: "info@fuerzatotal.com", 
                  phone: "+506 2444-5555",
                  type: "Gimnasio",
                  location: "Cartago, CR",
                  orders: 14,
                  total: 3890,
                  lastOrder: "2024-09-25",
                  status: "active"
                },
                {
                  id: 3,
                  name: "Academia Guerreros",
                  email: "contacto@academiaguerreros.com",
                  phone: "+506 2666-7777",
                  type: "Academia MMA",
                  location: "Heredia, CR",
                  orders: 12,
                  total: 3550,
                  lastOrder: "2024-09-22",
                  status: "active"
                },
                {
                  id: 4,
                  name: "Fight Club CR",
                  email: "info@fightclubcr.com",
                  phone: "+506 2888-9999",
                  type: "Club de Combate",
                  location: "Alajuela, CR",
                  orders: 10,
                  total: 2980,
                  lastOrder: "2024-09-20",
                  status: "active"
                },
                {
                  id: 5,
                  name: "MMA Warriors",
                  email: "admin@mmawarriors.com",
                  phone: "+506 2333-4444",
                  type: "Entrenamiento MMA",
                  location: "Puntarenas, CR",
                  orders: 8,
                  total: 2650,
                  lastOrder: "2024-09-18",
                  status: "inactive"
                },
                {
                  id: 6,
                  name: "Boxeo Elite",
                  email: "contacto@boxeoelite.com",
                  phone: "+506 2555-6666",
                  type: "Escuela de Boxeo",
                  location: "Limón, CR",
                  orders: 6,
                  total: 1890,
                  lastOrder: "2024-09-15",
                  status: "active"
                }
              ]}
              columns={[
                {
                  key: 'name',
                  title: 'Cliente',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="font-medium" style={{ color: theme.colors.textPrimary }}>{value}</div>
                      <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {row.type} • {row.location}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'email',
                  title: 'Contacto',
                  render: (value, row) => (
                    <div>
                      <div className="text-sm" style={{ color: theme.colors.textPrimary }}>{value}</div>
                      <div className="text-sm" style={{ color: theme.colors.textSecondary }}>{row.phone}</div>
                    </div>
                  )
                },
                {
                  key: 'orders',
                  title: 'Pedidos',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="font-medium" style={{ color: theme.colors.primary }}>{value}</div>
                      <div className="text-sm" style={{ color: theme.colors.textSecondary }}>pedidos</div>
                    </div>
                  )
                },
                {
                  key: 'total',
                  title: 'Total Gastado',
                  sortable: true,
                  render: (value) => (
                    <div className="font-medium" style={{ color: theme.colors.success }}>
                      ${value.toLocaleString()}
                    </div>
                  )
                },
                {
                  key: 'lastOrder',
                  title: 'Último Pedido',
                  sortable: true,
                  render: (value) => (
                    <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      {new Date(value).toLocaleDateString()}
                    </div>
                  )
                },
                {
                  key: 'status',
                  title: 'Estado',
                  render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {value === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  )
                }
              ]}
              renderExpandedRow={(row) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.primary }}>Información de Contacto</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Email:</span> {row.email}</p>
                      <p><span className="text-gray-400">Teléfono:</span> {row.phone}</p>
                      <p><span className="text-gray-400">Ubicación:</span> {row.location}</p>
                      <p><span className="text-gray-400">Tipo:</span> {row.type}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.success }}>Historial de Compras</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Total pedidos:</span> {row.orders}</p>
                      <p><span className="text-gray-400">Total gastado:</span> ${row.total.toLocaleString()}</p>
                      <p><span className="text-gray-400">Último pedido:</span> {row.lastOrder}</p>
                      <p><span className="text-gray-400">Promedio por pedido:</span> ${Math.round(row.total / row.orders).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.warning }}>Acciones</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar Cliente
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2z" />
                        </svg>
                        Ver Pedidos
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              onEdit={(customer) => console.log('Editar:', customer)}
              onDelete={(customer) => console.log('Eliminar:', customer)}
              onRefresh={() => console.log('Refrescar clientes')}
            />
          </div>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
          <p style={{ color: theme.colors.textSecondary }}>Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <p style={{ color: theme.colors.textSecondary }} className="mb-4">Error al cargar el proyecto</p>
          <Button onClick={() => router.push('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ProjectPageLayout
      projectData={projectData}
      loading={loading}
      pageTitle="Gestión de Clientes"
    >
      <div className="p-6">
        <Tabs tabs={customersTabs} />
      </div>
    </ProjectPageLayout>
  )
}