'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject, DashboardStats } from '@/types/database'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userProjects, setUserProjects] = useState<UserProject[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    recentActivity: 0,
    userRole: 'user'
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)
      
      // Obtener proyectos del usuario usando la función de la base de datos
      try {
        const { data: userProjectsData, error } = await supabase
          .rpc('get_user_projects', { user_uuid: session.user.id })

        if (error) {
          console.error('Error obteniendo proyectos:', error)
        } else if (userProjectsData) {
          setUserProjects(userProjectsData)
          
          // Calcular estadísticas
          setStats({
            totalProjects: userProjectsData.length,
            activeProjects: userProjectsData.length, // Asumimos que todos están activos
            recentActivity: userProjectsData.length,
            userRole: userProjectsData.length > 0 ? userProjectsData[0].user_role : 'user'
          })
        }
      } catch (error) {
        console.error('Error:', error)
      }

      setLoading(false)
    }

    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getProjectColor = (projectType: string) => {
    switch (projectType) {
      case 'ecommerce':
        return {
          bg: 'bg-green-100',
          text: 'text-green-600',
          primary: '#10b981'
        }
      case 'saas':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-600',
          primary: '#3b82f6'
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          primary: '#6b7280'
        }
    }
  }

  const getProjectIcon = (projectType: string) => {
    switch (projectType) {
      case 'ecommerce':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        )
      case 'saas':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header Mejorado */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  SmartAdmin
                </h1>
                <p className="text-sm text-gray-600">
                  Bienvenido, {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                {stats.userRole === 'owner' ? 'Propietario' : 
                 stats.userRole === 'admin' ? 'Administrador' : 
                 stats.userRole === 'user' ? 'Usuario' : 'Invitado'}
              </span>
              <Button variant="outline" onClick={handleLogout} className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Resumen Mejorado */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Dashboard Personal
          </h2>
          <p className="text-xl text-gray-600">
            Gestiona todos tus proyectos asignados desde aquí
          </p>
        </div>

        {/* Estadísticas Mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Proyectos Totales</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalProjects}</div>
              <p className="text-xs text-green-600 font-medium">
                ✓ Todos asignados
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Proyectos Activos</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.activeProjects}</div>
              <p className="text-xs text-green-600 font-medium">
                ↗ Disponibles ahora
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Rol Principal</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.userRole === 'owner' ? 'Propietario' : 
                 stats.userRole === 'admin' ? 'Admin' : 
                 stats.userRole === 'user' ? 'Usuario' : 'Invitado'}
              </div>
              <p className="text-xs text-purple-600 font-medium">
                {stats.userRole === 'owner' ? 'Control total' : 
                 stats.userRole === 'admin' ? 'Gestión avanzada' : 
                 'Acceso estándar'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Última Actividad</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">Hoy</div>
              <p className="text-xs text-orange-600 font-medium">
                ⚡ Sesión actual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Proyectos Mejorada */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Mis Proyectos Asignados</h3>
              <p className="text-gray-600 mt-1">Accede directamente a la gestión de cada proyecto</p>
            </div>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Solicitar Nuevo Proyecto
            </Button>
          </div>

          {userProjects && userProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {userProjects.map((userProject) => {
                const colors = getProjectColor(userProject.project_type)
                const projectConfig = userProject.config as any || {}
                
                return (
                  <Card 
                    key={userProject.project_id} 
                    className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50"></div>
                    <CardHeader className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <div className={colors.text}>
                            {getProjectIcon(userProject.project_type)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Activo
                          </span>
                          <span className={`px-3 py-1 ${colors.bg} ${colors.text} text-xs font-medium rounded-full`}>
                            {userProject.user_role === 'owner' ? 'Propietario' : 
                             userProject.user_role === 'admin' ? 'Admin' : 
                             userProject.user_role === 'user' ? 'Usuario' : userProject.user_role}
                          </span>
                        </div>
                      </div>
                      
                      <CardTitle className="text-xl text-gray-900 mb-2">
                        {userProject.project_name}
                      </CardTitle>
                      <CardDescription className="text-gray-600 leading-relaxed">
                        {userProject.project_description || 'Proyecto sin descripción'}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="relative">
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className={`px-3 py-1 ${colors.bg} ${colors.text} text-sm rounded-full`}>
                          {userProject.project_type === 'ecommerce' ? 'E-commerce' : 
                           userProject.project_type === 'saas' ? 'SaaS' : 
                           userProject.project_type}
                        </span>
                        {projectConfig.specialized && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                            Especializado
                          </span>
                        )}
                        {projectConfig.niche && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                            {projectConfig.niche}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <Link href={`/projects/${userProject.project_slug}/dashboard`}>
                          <Button 
                            className="w-full shadow-lg group-hover:shadow-xl transition-all"
                            style={{ 
                              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)` 
                            }}
                          >
                            Acceder al Proyecto
                            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </Button>
                        </Link>
                        
                        {(userProject.user_role === 'owner' || userProject.user_role === 'admin') && (
                          <Link href={`/projects/${userProject.project_slug}/settings`}>
                            <Button variant="outline" size="sm" className="w-full hover:bg-gray-50">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Configuración
                            </Button>
                          </Link>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                        Asignado el {new Date(userProject.assigned_at).toLocaleDateString('es-ES')}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-gray-200 hover:border-indigo-300 transition-colors">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  No tienes proyectos asignados
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Solicita acceso a un proyecto existente o pide que se cree uno nuevo específicamente para ti.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Solicitar Proyecto
                  </Button>
                  <Button variant="outline">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Contactar Soporte
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}