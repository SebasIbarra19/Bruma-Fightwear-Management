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
      label: 'Dashboard de Clientes',
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
                  Total de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>2,847</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>+12% vs mes anterior</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Clientes Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>1,932</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>+8% vs mes anterior</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Valor Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>$4,230</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.warning }}>-2% vs mes anterior</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Tasa de Retención
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>87.5%</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>+5% vs mes anterior</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Clientes y Actividad Reciente */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>Top 5 Clientes</CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Clientes con mayor valor de compras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Carlos Mendoza", orders: 45, value: "$12,450", status: "VIP" },
                    { name: "Ana García", orders: 38, value: "$9,830", status: "Premium" },
                    { name: "Diego Silva", orders: 32, value: "$8,720", status: "Premium" },
                    { name: "María López", orders: 28, value: "$7,560", status: "Regular" },
                    { name: "Roberto Chen", orders: 25, value: "$6,890", status: "Regular" }
                  ].map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" 
                             style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: theme.colors.textPrimary }}>{customer.name}</p>
                          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{customer.orders} pedidos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>{customer.value}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          customer.status === 'VIP' ? 'bg-purple-100 text-purple-800' :
                          customer.status === 'Premium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>Actividad Reciente</CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Últimas interacciones con clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "Nuevo cliente registrado", customer: "Luis Morales", time: "Hace 2 min", type: "new" },
                    { action: "Pedido completado", customer: "Ana García", time: "Hace 15 min", type: "order" },
                    { action: "Actualización de perfil", customer: "Carlos Mendoza", time: "Hace 1 hora", type: "update" },
                    { action: "Consulta de soporte", customer: "María López", time: "Hace 2 horas", type: "support" },
                    { action: "Reseña dejada", customer: "Diego Silva", time: "Hace 3 horas", type: "review" }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'new' ? 'bg-green-500' :
                        activity.type === 'order' ? 'bg-blue-500' :
                        activity.type === 'update' ? 'bg-yellow-500' :
                        activity.type === 'support' ? 'bg-red-500' :
                        'bg-purple-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: theme.colors.textPrimary }}>
                          <span className="font-medium">{activity.customer}</span> - {activity.action}
                        </p>
                        <p className="text-xs" style={{ color: theme.colors.textSecondary }}>{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'database',
      label: 'Base de Clientes',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* Herramientas de Búsqueda y Filtrado */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle style={{ color: theme.colors.textPrimary }}>Base de Clientes</CardTitle>
                  <CardDescription style={{ color: theme.colors.textSecondary }}>
                    Gestiona y administra todos tus clientes
                  </CardDescription>
                </div>
                <Button 
                  style={{ backgroundColor: theme.colors.primary }}
                  onClick={() => console.log('Crear nuevo cliente')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Tabla de Clientes usando ModernTable */}
              <ModernTable
                data={[
                  {
                    id: 1,
                    name: "Carlos Mendoza",
                    email: "carlos.mendoza@email.com",
                    phone: "+52 55 1234-5678",
                    orders: 45,
                    totalSpent: 12450,
                    status: "VIP",
                    lastOrder: "2024-10-01",
                    avatar: "CM"
                  },
                  {
                    id: 2,
                    name: "Ana García",
                    email: "ana.garcia@email.com", 
                    phone: "+52 55 2345-6789",
                    orders: 38,
                    totalSpent: 9830,
                    status: "Premium",
                    lastOrder: "2024-09-28",
                    avatar: "AG"
                  },
                  {
                    id: 3,
                    name: "Diego Silva",
                    email: "diego.silva@email.com",
                    phone: "+52 55 3456-7890", 
                    orders: 32,
                    totalSpent: 8720,
                    status: "Premium",
                    lastOrder: "2024-09-30",
                    avatar: "DS"
                  },
                  {
                    id: 4,
                    name: "María López",
                    email: "maria.lopez@email.com",
                    phone: "+52 55 4567-8901",
                    orders: 28,
                    totalSpent: 7560, 
                    status: "Regular",
                    lastOrder: "2024-09-25",
                    avatar: "ML"
                  },
                  {
                    id: 5,
                    name: "Roberto Chen",
                    email: "roberto.chen@email.com",
                    phone: "+52 55 5678-9012",
                    orders: 25,
                    totalSpent: 6890,
                    status: "Regular", 
                    lastOrder: "2024-09-29",
                    avatar: "RC"
                  }
                ]}
                columns={[
                  { 
                    key: 'name', 
                    title: 'Cliente', 
                    sortable: true,
                    render: (value, row) => (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                             style={{ backgroundColor: theme.colors.primary, color: 'white' }}>
                          {row.avatar}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: theme.colors.textPrimary }}>{value}</p>
                          <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Último: {row.lastOrder}</p>
                        </div>
                      </div>
                    )
                  },
                  { key: 'email', title: 'Email', sortable: true },
                  { key: 'phone', title: 'Teléfono', sortable: false },
                  { key: 'orders', title: 'Pedidos', sortable: true },
                  { 
                    key: 'totalSpent', 
                    title: 'Total Gastado',
                    sortable: true,
                    render: (value) => `$${value.toLocaleString()}`
                  },
                  {
                    key: 'status',
                    title: 'Estado',
                    render: (value) => (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        value === 'VIP' ? 'bg-purple-100 text-purple-800' :
                        value === 'Premium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {value}
                      </span>
                    )
                  }
                ]}
                renderExpandedRow={(row) => (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.primary }}>Información Personal</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-gray-400">Email:</span> {row.email}</p>
                        <p><span className="text-gray-400">Teléfono:</span> {row.phone}</p>
                        <p><span className="text-gray-400">Cliente desde:</span> Enero 2023</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.success }}>Historial de Compras</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-gray-400">Total pedidos:</span> {row.orders}</p>
                        <p><span className="text-gray-400">Total gastado:</span> ${row.totalSpent.toLocaleString()}</p>
                        <p><span className="text-gray-400">Último pedido:</span> {row.lastOrder}</p>
                        <p><span className="text-gray-400">Promedio por pedido:</span> ${Math.round(row.totalSpent / row.orders).toLocaleString()}</p>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Ver Historial
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Enviar Email
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                onEdit={(customer) => console.log('Editar:', customer)}
                onDelete={(customer) => console.log('Eliminar:', customer)}
                onRefresh={() => console.log('Refrescar clientes')}
              />
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'segments',
      label: 'Segmentación',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>Segmentación de Clientes</CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Analiza y segmenta tu base de clientes por diferentes criterios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Por Valor */}
                <div className="space-y-4">
                  <h3 className="font-semibold" style={{ color: theme.colors.textPrimary }}>Por Valor de Compras</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="font-medium" style={{ color: theme.colors.textPrimary }}>VIP ($10K+)</span>
                      </div>
                      <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>125</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="font-medium" style={{ color: theme.colors.textPrimary }}>Premium ($5K-10K)</span>
                      </div>
                      <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>487</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="font-medium" style={{ color: theme.colors.textPrimary }}>Regular ($1K-5K)</span>
                      </div>
                      <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>1,456</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        <span className="font-medium" style={{ color: theme.colors.textPrimary }}>Nuevo (&lt;$1K)</span>
                      </div>
                      <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>779</span>
                    </div>
                  </div>
                </div>

                {/* Por Ubicación */}
                <div className="space-y-4">
                  <h3 className="font-semibold" style={{ color: theme.colors.textPrimary }}>Por Ubicación</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <span className="font-medium" style={{ color: theme.colors.textPrimary }}>Ciudad de México</span>
                      <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>1,247</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <span className="font-medium" style={{ color: theme.colors.textPrimary }}>Guadalajara</span>
                      <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>456</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <span className="font-medium" style={{ color: theme.colors.textPrimary }}>Monterrey</span>
                      <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>332</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <span className="font-medium" style={{ color: theme.colors.textPrimary }}>Otros</span>
                      <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>812</span>
                    </div>
                  </div>
                </div>

                {/* Por Frecuencia */}
                <div className="space-y-4">
                  <h3 className="font-semibold" style={{ color: theme.colors.textPrimary }}>Por Frecuencia</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <span className="font-medium" style={{ color: theme.colors.textPrimary }}>Muy Frecuente (&gt;10/mes)</span>
                      <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>156</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <span className="font-medium" style={{ color: theme.colors.textPrimary }}>Frecuente (5-10/mes)</span>
                      <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>543</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <span className="font-medium" style={{ color: theme.colors.textPrimary }}>Ocasional (1-4/mes)</span>
                      <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>1,398</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <span className="font-medium" style={{ color: theme.colors.textPrimary }}>Esporádico (&lt;1/mes)</span>
                      <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>750</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'analytics',
      label: 'Análisis y Reportes',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tendencias de Adquisición */}
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>Tendencias de Adquisición</CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Evolución de nuevos clientes en los últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { month: "Octubre 2024", new: 234, conversion: "12.3%" },
                    { month: "Septiembre 2024", new: 189, conversion: "10.8%" },
                    { month: "Agosto 2024", new: 156, conversion: "9.2%" },
                    { month: "Julio 2024", new: 143, conversion: "8.7%" },
                    { month: "Junio 2024", new: 167, conversion: "11.1%" },
                    { month: "Mayo 2024", new: 198, conversion: "13.2%" }
                  ].map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <div>
                        <p className="font-medium" style={{ color: theme.colors.textPrimary }}>{data.month}</p>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Conversión: {data.conversion}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>{data.new}</p>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>nuevos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Análisis de Retención */}
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>Análisis de Retención</CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Comportamiento de retención por cohorte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2 text-xs font-medium" style={{ color: theme.colors.textSecondary }}>
                    <div>Cohorte</div>
                    <div>Mes 1</div>
                    <div>Mes 3</div>
                    <div>Mes 6</div>
                  </div>
                  {[
                    { cohort: "Oct 2024", m1: "89%", m3: "67%", m6: "45%" },
                    { cohort: "Sep 2024", m1: "91%", m3: "72%", m6: "48%" },
                    { cohort: "Ago 2024", m1: "87%", m3: "65%", m6: "42%" },
                    { cohort: "Jul 2024", m1: "93%", m3: "74%", m6: "51%" },
                    { cohort: "Jun 2024", m1: "85%", m3: "69%", m6: "47%" }
                  ].map((data, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 p-2 rounded" style={{ backgroundColor: theme.colors.background }}>
                      <div className="font-medium" style={{ color: theme.colors.textPrimary }}>{data.cohort}</div>
                      <div style={{ color: theme.colors.textPrimary }}>{data.m1}</div>
                      <div style={{ color: theme.colors.textPrimary }}>{data.m3}</div>
                      <div style={{ color: theme.colors.textPrimary }}>{data.m6}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reportes Automatizados */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>Reportes Automatizados</CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Genera reportes personalizados para análisis profundo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20" style={{ borderColor: theme.colors.border }}>
                  <div className="text-center">
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-medium">Reporte de Ventas</p>
                    <p className="text-xs text-gray-500">Por cliente</p>
                  </div>
                </Button>
                <Button variant="outline" className="h-20" style={{ borderColor: theme.colors.border }}>
                  <div className="text-center">
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <p className="font-medium">Análisis Geográfico</p>
                    <p className="text-xs text-gray-500">Por región</p>
                  </div>
                </Button>
                <Button variant="outline" className="h-20" style={{ borderColor: theme.colors.border }}>
                  <div className="text-center">
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">Comportamiento</p>
                    <p className="text-xs text-gray-500">Temporal</p>
                  </div>
                </Button> 
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'communication',
      label: 'Comunicación',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campañas de Email */}
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>Campañas de Email</CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Gestiona comunicaciones masivas con tus clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full" style={{ backgroundColor: theme.colors.primary }}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Campaña
                  </Button>
                  
                  <div className="space-y-3">
                    {[
                      {
                        name: "Ofertas de Octubre",
                        status: "Enviada",
                        sent: "2,847",
                        opened: "1,423",
                        clicked: "289",
                        date: "01/10/2024"
                      },
                      {
                        name: "Nuevos Productos MMA",
                        status: "Programada", 
                        sent: "0",
                        opened: "0",
                        clicked: "0",
                        date: "05/10/2024"
                      },
                      {
                        name: "Encuesta de Satisfacción",
                        status: "Borrador",
                        sent: "0", 
                        opened: "0",
                        clicked: "0",
                        date: "-"
                      }
                    ].map((campaign, index) => (
                      <div key={index} className="p-3 rounded-lg border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium" style={{ color: theme.colors.textPrimary }}>{campaign.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            campaign.status === 'Enviada' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'Programada' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs" style={{ color: theme.colors.textSecondary }}>
                          <div>Enviados: {campaign.sent}</div>
                          <div>Abiertos: {campaign.opened}</div>
                          <div>Clicks: {campaign.clicked}</div>
                          <div>Fecha: {campaign.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notificaciones y Alertas */}
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.textPrimary }}>Notificaciones Automáticas</CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  Configura alertas y notificaciones inteligentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: "Cliente Inactivo",
                      description: "Enviar email después de 30 días sin compras",
                      active: true,
                      triggered: "12 esta semana"
                    },
                    {
                      title: "Cumpleaños del Cliente", 
                      description: "Enviar descuento especial en fecha de cumpleaños",
                      active: true,
                      triggered: "8 esta semana"
                    },
                    {
                      title: "Carrito Abandonado",
                      description: "Recordatorio después de 24 horas",
                      active: false,
                      triggered: "0 esta semana"
                    },
                    {
                      title: "Cliente VIP Upgrade",
                      description: "Notificar cuando cliente alcanza status VIP",
                      active: true,
                      triggered: "3 esta semana"
                    }
                  ].map((notification, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium" style={{ color: theme.colors.textPrimary }}>{notification.title}</h4>
                          <div className={`w-2 h-2 rounded-full ${notification.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        </div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{notification.description}</p>
                        <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>{notification.triggered}</p>
                      </div>
                      <Button variant="outline" size="sm" style={{ borderColor: theme.colors.border }}>
                        {notification.active ? 'Configurar' : 'Activar'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plantillas de Comunicación */}
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>Plantillas de Comunicación</CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Plantillas predefinidas para diferentes tipos de comunicación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: "Bienvenida", type: "Email", uses: 234 },
                  { name: "Confirmación Pedido", type: "SMS", uses: 1456 },
                  { name: "Seguimiento Postventa", type: "Email", uses: 892 },
                  { name: "Recuperar Cliente", type: "Email", uses: 67 }
                ].map((template, index) => (
                  <div key={index} className="p-4 rounded-lg border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                    <h4 className="font-medium mb-2" style={{ color: theme.colors.textPrimary }}>{template.name}</h4>
                    <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>{template.type}</p>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>Usado {template.uses} veces</p>
                    <Button variant="outline" size="sm" className="w-full mt-3" style={{ borderColor: theme.colors.border }}>
                      Editar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
      <Tabs tabs={customersTabs} defaultTab="overview" />
    </ProjectPageLayout>
  )
}