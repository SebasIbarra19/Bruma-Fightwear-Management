'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject, EcommerceSettings } from '@/types/database'
import { SmartLogoCard } from '@/components/common/SmartLogo'

interface ProjectDashboardData {
  project: UserProject
  ecommerceConfig?: EcommerceSettings
}

export default function ProjectDashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [projectData, setProjectData] = useState<ProjectDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const projectSlug = params.projectId as string

  useEffect(() => {
    const loadProjectData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)

      try {
        // Obtener proyectos del usuario usando la función de la base de datos
        const { data: userProjects, error } = await supabase
          .rpc('get_user_projects', { user_uuid: session.user.id })

        if (error) {
          console.error('Error obteniendo proyectos:', error)
          router.push('/dashboard')
          return
        }

        // Encontrar el proyecto específico por slug
        const project = userProjects?.find((p: UserProject) => p.project_slug === projectSlug)
        
        if (!project) {
          console.error('Proyecto no encontrado o sin acceso')
          router.push('/dashboard')
          return
        }

        const projectInfo: ProjectDashboardData = { project }

        // Si es un proyecto de e-commerce, obtener configuración adicional
        if (project.project_type === 'ecommerce') {
          const { data: ecommerceConfig } = await supabase
            .from('ecommerce_config')
            .select('*')
            .eq('project_id', project.project_id)
            .single()

          if (ecommerceConfig) {
            projectInfo.ecommerceConfig = ecommerceConfig
          }
        }

        setProjectData(projectInfo)
      } catch (error) {
        console.error('Error cargando datos del proyecto:', error)
        router.push('/dashboard')
      }

      setLoading(false)
    }

    loadProjectData()
  }, [router, projectSlug])

  const getProjectStats = () => {
    if (!projectData) return null

    const { project } = projectData
    
    // Stats específicos según el tipo de proyecto
    if (project.project_type === 'ecommerce') {
      return {
        totalProducts: 0, // TODO: Implementar conteo real
        totalOrders: 0,
        totalRevenue: 0,
        activeCustomers: 0
      }
    }

    return {
      totalItems: 0,
      activeItems: 0,
      recentActivity: 0,
      userCount: 1
    }
  }

  const getDashboardModules = () => {
    if (!projectData) return []

    const { project } = projectData
    const isOwner = project.user_role === 'owner'
    const isAdmin = project.user_role === 'admin'
    const canManage = isOwner || isAdmin

    if (project.project_type === 'ecommerce') {
      // Módulos específicos para e-commerce
      const modules = [
        {
          title: 'Productos',
          description: 'Gestionar catálogo de productos',
          icon: '📦',
          href: `/projects/${projectSlug}/products`,
          color: 'bg-blue-500',
          available: true
        },
        {
          title: 'Pedidos',
          description: 'Gestionar pedidos y ventas',
          icon: '🛒',
          href: `/projects/${projectSlug}/orders`,
          color: 'bg-green-500',
          available: true
        },
        {
          title: 'Clientes',
          description: 'Gestionar base de clientes',
          icon: '👥',
          href: `/projects/${projectSlug}/customers`,
          color: 'bg-purple-500',
          available: true
        },
        {
          title: 'Inventario',
          description: 'Control de stock y almacén',
          icon: '📊',
          href: `/projects/${projectSlug}/inventory`,
          color: 'bg-orange-500',
          available: true
        },
        {
          title: 'Analytics',
          description: 'Métricas y reportes',
          icon: '📈',
          href: `/projects/${projectSlug}/analytics`,
          color: 'bg-indigo-500',
          available: true
        },
        {
          title: 'Configuración',
          description: 'Ajustes del proyecto',
          icon: '⚙️',
          href: `/projects/${projectSlug}/settings`,
          color: 'bg-gray-500',
          available: canManage
        }
      ]

      return modules.filter(module => module.available)
    }

    // Módulos genéricos para otros tipos de proyecto
    return [
      {
        title: 'Dashboard General',
        description: 'Vista general del proyecto',
        icon: '📊',
        href: `/projects/${projectSlug}/overview`,
        color: 'bg-blue-500',
        available: true
      },
      {
        title: 'Configuración',
        description: 'Ajustes del proyecto',
        icon: '⚙️',
        href: `/projects/${projectSlug}/settings`,
        color: 'bg-gray-500',
        available: canManage
      }
    ]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proyecto no encontrado</h1>
          <p className="text-gray-600 mb-4">No tienes acceso a este proyecto</p>
          <Link href="/dashboard">
            <Button>Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { project, ecommerceConfig } = projectData
  const stats = getProjectStats()
  const modules = getDashboardModules()
  const projectColors = project.color_scheme as any || { primary: '#3b82f6', secondary: '#1d4ed8' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      {/* Header del Proyecto */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              
              {/* Logo contextual - BRUMA cuando es proyecto BRUMA, SmartAdmin en otros casos */}
              <div className="flex items-center space-x-3">
                <SmartLogoCard size="md" showText={false} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.project_name}</h1>
                  <p className="text-sm text-gray-600">
                    {project.project_description} • Rol: {project.user_role === 'owner' ? 'Propietario' : 
                     project.user_role === 'admin' ? 'Administrador' : 'Usuario'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span 
                className="px-3 py-1 text-white text-sm font-medium rounded-full"
                style={{ backgroundColor: projectColors.primary }}
              >
                {project.project_type === 'ecommerce' ? 'E-commerce' : project.project_type}
              </span>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Salir del Proyecto
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Bienvenida */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de {project.project_name}
          </h2>
          <p className="text-gray-600">
            {project.project_type === 'ecommerce' 
              ? 'Gestiona tu tienda online desde aquí'
              : 'Gestiona tu proyecto desde este panel de control'
            }
          </p>
        </div>

        {/* Estadísticas del Proyecto */}
        {project.project_type === 'ecommerce' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Productos</CardTitle>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📦</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
                <p className="text-xs text-blue-600 font-medium">En catálogo</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pedidos</CardTitle>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">🛒</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
                <p className="text-xs text-green-600 font-medium">Este mes</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Ingresos</CardTitle>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg">💰</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  ${stats.totalRevenue?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-purple-600 font-medium">Este mes</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Clientes</CardTitle>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 text-lg">👥</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.activeCustomers}</div>
                <p className="text-xs text-orange-600 font-medium">Activos</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Módulos del Proyecto */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Módulos Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <Link key={index} href={module.href}>
                <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg overflow-hidden relative cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50"></div>
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-14 h-14 ${module.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <span className="text-white text-2xl">{module.icon}</span>
                      </div>
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    <CardTitle className="text-xl text-gray-900">{module.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative">
                    <Button 
                      className="w-full shadow-lg group-hover:shadow-xl transition-all"
                      style={{ backgroundColor: module.color.replace('bg-', '').replace('-500', '') }}
                    >
                      Acceder
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Información específica de BRUMA */}
        {project.project_slug === 'bruma-fightwear' && ecommerceConfig && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Configuración de la Tienda</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Información de la Tienda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Nombre:</span>
                    <p className="text-gray-900">{ecommerceConfig.store_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Descripción:</span>
                    <p className="text-gray-900">{ecommerceConfig.store_description}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Moneda:</span>
                    <p className="text-gray-900">{ecommerceConfig.currency}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tasa de Impuesto:</span>
                    <p className="text-gray-900">{(ecommerceConfig.tax_rate * 100).toFixed(2)}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Configuración</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Gestión de Inventario:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${ecommerceConfig.manage_inventory ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {ecommerceConfig.manage_inventory ? 'Activado' : 'Desactivado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Envíos:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${ecommerceConfig.shipping_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {ecommerceConfig.shipping_enabled ? 'Activado' : 'Desactivado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Pedidos Pendientes:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${ecommerceConfig.allow_backorders ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {ecommerceConfig.allow_backorders ? 'Permitido' : 'No Permitido'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Seguimiento de Stock:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${ecommerceConfig.track_quantity ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {ecommerceConfig.track_quantity ? 'Activado' : 'Desactivado'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}