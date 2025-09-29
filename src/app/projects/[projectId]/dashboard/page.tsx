'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { SmartLogoNavbar } from '@/components/common/SmartLogo'
import { ThemeSelector } from '@/components/ui/theme-selector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModernSidebar } from '@/components/ui/modern-sidebar'
import { Tabs } from '@/components/ui/tabs'

interface UserProject {
  project_id: string
  project_name: string
  project_slug: string
  project_type: string
}

interface ProjectDashboardData {
  project: UserProject
}

export default function ProjectDashboard({ params }: { params: { projectId: string } }) {
  const { user, isLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const projectSlug = params.projectId
  
  const [projectData, setProjectData] = useState<ProjectDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    // Esperar a que se complete la carga inicial de autenticación
    if (isLoading) return
    
    // Si no hay usuario después de cargar, redirigir a login
    if (!user) {
      router.push('/auth/login')
      return
    }

    const loadProjectData = async () => {
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
      } finally {
        setLoading(false)
      }
    }

    loadProjectData()
  }, [router, projectSlug, user, isLoading])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const sidebarItems = [
    {
      id: 'analytics',
      label: 'Estadísticas y Métricas',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: `/projects/${projectSlug}/dashboard`,
      isActive: true
    },
    {
      id: 'inventory',
      label: 'Gestión de Inventario',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      href: `/projects/${projectSlug}/inventory`
    },
    {
      id: 'products',
      label: 'Productos y Categorías',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      subItems: [
        { id: 'products-list', label: 'Lista de Productos', href: `/projects/${projectSlug}/products` },
        { id: 'categories', label: 'Categorías', href: `/projects/${projectSlug}/categories` }
      ]
    },
    {
      id: 'orders',
      label: 'Gestión de Pedidos',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: `/projects/${projectSlug}/orders`
    },
    {
      id: 'customers',
      label: 'Gestión de Clientes',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
        </svg>
      ),
      href: `/projects/${projectSlug}/customers`
    },
    {
      id: 'suppliers',
      label: 'Gestión de Proveedores',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4" />
        </svg>
      ),
      href: `/projects/${projectSlug}/suppliers`
    },
    {
      id: 'shipping',
      label: 'Gestión de Envíos',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: `/projects/${projectSlug}/shipping`
    },
    {
      id: 'movements',
      label: 'Movimientos de Stock',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
      href: `/projects/${projectSlug}/movements`
    }
  ]

  const analyticsTabs = [
    {
      id: 'overview',
      label: 'Resumen General',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Ventas Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>$24,567</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>+12.5% vs mes anterior</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Pedidos Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>156</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.warning }}>+3 pendientes</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Productos en Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>1,234</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.error }}>23 bajo stock mínimo</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Clientes Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>789</div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>+45 nuevos este mes</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'sales',
      label: 'Ventas e Ingresos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2" />
        </svg>
      ),
      content: (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
            Análisis de Ventas e Ingresos
          </h3>
          <p style={{ color: theme.colors.textSecondary }}>
            Reportes detallados de ventas, ingresos y tendencias financieras
          </p>
        </div>
      )
    },
    {
      id: 'inventory-analytics',
      label: 'Analytics de Inventario',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4" />
        </svg>
      ),
      content: (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
            Análisis de Inventario
          </h3>
          <p style={{ color: theme.colors.textSecondary }}>
            Seguimiento de stock, rotación de productos y alertas de reabastecimiento
          </p>
        </div>
      )
    },
    {
      id: 'customer-analytics',
      label: 'Analytics de Clientes',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z" />
        </svg>
      ),
      content: (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
            Análisis de Clientes
          </h3>
          <p style={{ color: theme.colors.textSecondary }}>
            Comportamiento de clientes, segmentación y análisis de fidelidad
          </p>
        </div>
      )
    }
  ]

  // Mostrar loading mientras se carga la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  // Si no hay usuario después de cargar, ya se está redirigiendo
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-4" style={{ border: `2px solid ${theme.colors.border}`, borderTop: `2px solid ${theme.colors.primary}` }}></div>
          <p style={{ color: theme.colors.textPrimary }}>Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <p style={{ color: theme.colors.error }}>Error cargando el proyecto</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.background }}>
      <ModernSidebar 
        items={sidebarItems}
        projectName={projectData.project.project_name}
        onCollapseChange={setSidebarCollapsed}
      />

      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ backgroundColor: theme.colors.surface + '90', borderColor: theme.colors.border }}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center space-x-2 p-2 rounded-lg transition-colors hover:bg-opacity-10"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm">Dashboard Personal</span>
                </button>
                <div className="h-6 w-px" style={{ backgroundColor: theme.colors.border }}></div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
                    {projectData.project.project_name}
                  </h1>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    Dashboard Principal
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <ThemeSelector />
                
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-3 p-2 rounded-xl transition-all duration-200"
                    style={{ 
                      backgroundColor: theme.colors.surface + '80',
                      border: `1px solid ${theme.colors.border}`
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm"
                      style={{ 
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                        color: 'white'
                      }}
                    >
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                      {user?.email?.split('@')[0]}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <>
                      <div 
                        className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl border z-50"
                        style={{ 
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border
                        }}
                      >
                        <div className="p-2">
                          <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors"
                            style={{ color: theme.colors.textPrimary }}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3" />
                            </svg>
                            <span>Dashboard Principal</span>
                          </button>
                          
                          <button 
                            onClick={() => {
                              handleLogout()
                              setUserDropdownOpen(false)
                            }}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-red-600"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                            </svg>
                            <span>Cerrar Sesión</span>
                          </button>
                        </div>
                      </div>
                      
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setUserDropdownOpen(false)}
                      ></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Tabs tabs={analyticsTabs} defaultTab="overview" />
        </main>
      </div>
    </div>
  )
}