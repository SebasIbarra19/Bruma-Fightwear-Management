'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject, DashboardStats } from '@/types/database'
import { SmartLogoNavbar } from '@/components/common/SmartLogo'
import { ThemeSelector } from '@/components/ui/theme-selector'
import { useTheme } from '@/contexts/ThemeContext'

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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const router = useRouter()
  const { theme } = useTheme()
  const supabase = createClient()

  useEffect(() => {
    console.log('🚀 Dashboard: Component mounted')
    
    const initializeDashboard = async () => {
      try {
        console.log('� Dashboard: Checking session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Dashboard: Session error:', error)
          setLoading(false)
          router.push('/auth/login')
          return
        }
        
        if (!session) {
          console.log('❌ Dashboard: No session found, redirecting...')
          setLoading(false)
          router.push('/auth/login')
          return
        }
        
        console.log('✅ Dashboard: Session found for:', session.user.email)
        setUser(session.user)
        
        // Cargar proyectos
        await loadUserProjects(session.user.id)
        
      } catch (error) {
        console.error('❌ Dashboard: Initialization error:', error)
        setLoading(false)
      }
    }
    
    initializeDashboard()
    
    // Listener simple para cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      console.log('📡 Dashboard: Auth change:', event)
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 Dashboard: User signed out, redirecting...')
        setUser(null)
        setUserProjects([])
        router.push('/auth/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const loadUserProjects = async (userId: string) => {
    try {
      console.log('📊 Dashboard: Fetching user projects for:', userId)
      setLoading(true)
      
      const { data: userProjectsData, error } = await supabase
        .rpc('get_user_projects', { user_uuid: userId })

      if (error) {
        console.error('❌ Dashboard: Error obteniendo proyectos:', error)
        // En caso de error, establecer datos vacíos
        setUserProjects([])
        setStats({
          totalProjects: 0,
          activeProjects: 0,
          recentActivity: 0,
          userRole: 'user'
        })
      } else {
        const projects = userProjectsData || []
        console.log('✅ Dashboard: Projects loaded:', projects.length, 'projects')
        setUserProjects(projects)
        
        // Calcular estadísticas
        setStats({
          totalProjects: projects.length,
          activeProjects: projects.length,
          recentActivity: projects.length,
          userRole: projects.length > 0 ? projects[0].user_role : 'user'
        })
      }
    } catch (error) {
      console.error('❌ Dashboard: Error loading projects:', error)
      // En caso de error, establecer datos vacíos
      setUserProjects([])
      setStats({
        totalProjects: 0,
        activeProjects: 0,
        recentActivity: 0,
        userRole: 'user'
      })
    } finally {
      console.log('✅ Dashboard: Loading completed')
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const createBrumaProject = async () => {
    if (!user) return

    try {
      console.log('🚀 Creando proyecto BRUMA Fightwear...')
      
      // IDs de usuarios
      const brumaUserId = 'e435d7eb-a033-4bb0-b34c-2a040c5d2f36'
      const sebastianUserId = '969e5a99-0448-44a4-b0d2-135c6ed32ae4'
      
      // Crear proyecto BRUMA Fightwear
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: 'BRUMA Fightwear',
          slug: 'bruma-fightwear',
          description: 'Tienda especializada en ropa deportiva y equipamiento de combate',
          project_type: 'ecommerce',
          logo_url: '/images/bruma-logo.png',
          color_scheme: {
            primary: '#dc2626',
            secondary: '#b91c1c',
            accent: '#fbbf24'
          },
          config: {
            features: [
              'inventory_management',
              'order_processing',
              'customer_management',
              'analytics'
            ],
            specialized: true,
            combat_sports: true
          },
          is_active: true
        })
        .select()
        .single()

      if (projectError) {
        console.error('❌ Error creando proyecto:', projectError)
        alert('Error creando proyecto: ' + projectError.message)
        return
      }

      console.log('✅ Proyecto creado:', projectData.name)

      // Asignar BrumaFightwear como owner
      const { error: ownerError } = await supabase
        .from('user_projects')
        .insert({
          user_id: brumaUserId,
          project_id: projectData.id,
          role: 'owner',
          is_active: true
        })

      if (ownerError) {
        console.error('❌ Error asignando owner:', ownerError)
      } else {
        console.log('✅ BrumaFightwear asignado como owner')
      }

      // Asignar Sebastian como admin  
      const { error: adminError } = await supabase
        .from('user_projects')
        .insert({
          user_id: sebastianUserId,
          project_id: projectData.id,
          role: 'admin',
          is_active: true
        })

      if (adminError) {
        console.error('❌ Error asignando admin:', adminError)
      } else {
        console.log('✅ Sebastian asignado como admin')
      }

      // Recargar proyectos
      const { data: userProjectsData, error: refreshError } = await supabase
        .rpc('get_user_projects', { user_uuid: user.id })

      if (!refreshError && userProjectsData) {
        setUserProjects(userProjectsData)
        setStats({
          totalProjects: userProjectsData.length,
          activeProjects: userProjectsData.length,
          recentActivity: userProjectsData.length,
          userRole: 'owner'
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
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
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 50%, ${theme.colors.surfaceHover} 100%)` }}>
      {/* Modern Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ backgroundColor: theme.colors.surface + '90', borderColor: theme.colors.border }}>
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <SmartLogoNavbar showText={true} />
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/" className="transition-colors hover:opacity-80" style={{ color: theme.colors.textSecondary }}>
                  Inicio
                </Link>
                <Link href="/projects" className="transition-colors hover:opacity-80" style={{ color: theme.colors.textSecondary }}>
                  Proyectos
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Selector */}
              <ThemeSelector />

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-xl transition-all duration-200 backdrop-blur-sm hover:opacity-90"
                  style={{ 
                    backgroundColor: theme.colors.surface + '80',
                    border: `1px solid ${theme.colors.border}`
                  }}
                >
                  {/* User Avatar */}
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                      color: 'white'
                    }}
                  >
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* User Info - Hidden on mobile */}
                  <div className="hidden sm:flex flex-col items-start">
                    <p className="text-sm font-medium leading-tight" style={{ color: theme.colors.textPrimary }}>
                      {user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                      {stats.userRole === 'owner' ? 'Propietario' : 
                       stats.userRole === 'admin' ? 'Admin' : 
                       stats.userRole === 'user' ? 'Usuario' : 'Invitado'}
                    </p>
                  </div>

                  {/* Dropdown Arrow */}
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl backdrop-blur-md border z-50"
                    style={{ 
                      backgroundColor: theme.colors.surface + 'F0',
                      borderColor: theme.colors.border
                    }}
                  >
                    {/* User Info Header */}
                    <div className="p-4 border-b" style={{ borderColor: theme.colors.border }}>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center font-semibold"
                          style={{ 
                            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                            color: 'white'
                          }}
                        >
                          {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: theme.colors.textPrimary }}>
                            {user?.email?.split('@')[0]}
                          </p>
                          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            {user?.email}
                          </p>
                          <span 
                            className="inline-block px-2 py-1 text-xs rounded-full mt-1"
                            style={{ 
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.textPrimary,
                              border: `1px solid ${theme.colors.border}`
                            }}
                          >
                            {stats.userRole === 'owner' ? 'Propietario' : 
                             stats.userRole === 'admin' ? 'Administrador' : 
                             stats.userRole === 'user' ? 'Usuario' : 'Invitado'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Options */}
                    <div className="p-2">
                      <Link href="/profile">
                        <button 
                          className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-opacity-10"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: theme.colors.textSecondary }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span style={{ color: theme.colors.textPrimary }}>Configurar Perfil</span>
                        </button>
                      </Link>
                      
                      <button 
                        onClick={() => {
                          handleLogout()
                          setUserDropdownOpen(false)
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors hover:opacity-80 text-red-600"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Overlay to close dropdown */}
                {userDropdownOpen && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserDropdownOpen(false)}
                  ></div>
                )}
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Dashboard Title - Themed */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
            Dashboard Personal
          </h2>
          <p className="text-xl" style={{ color: theme.colors.textSecondary }}>
            Gestiona todos tus proyectos asignados desde aquí
          </p>
        </div>

        {/* Modern Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Total Projects Card */}
          <Card 
            className="group hover:scale-105 transition-all duration-300 border-0 shadow-lg backdrop-blur-sm" 
            style={{ 
              backgroundColor: theme.colors.surface + 'CC',
              borderColor: theme.colors.border
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                Proyectos Totales
              </CardTitle>
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})` }}
              >
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                {stats.totalProjects}
              </div>
              <p className="text-xs font-medium" style={{ color: theme.colors.success }}>
                ✓ Todos asignados
              </p>
            </CardContent>
          </Card>

          {/* Active Projects Card */}
          <Card 
            className="group hover:scale-105 transition-all duration-300 border-0 shadow-lg backdrop-blur-sm" 
            style={{ 
              backgroundColor: theme.colors.surface + 'CC',
              borderColor: theme.colors.border
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                Proyectos Activos
              </CardTitle>
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `linear-gradient(135deg, ${theme.colors.success}, ${theme.colors.successHover})` }}
              >
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                {stats.activeProjects}
              </div>
              <p className="text-xs font-medium" style={{ color: theme.colors.success }}>
                ↗ Disponibles ahora
              </p>
            </CardContent>
          </Card>

          {/* User Role Card */}
          <Card 
            className="group hover:scale-105 transition-all duration-300 border-0 shadow-lg backdrop-blur-sm" 
            style={{ 
              backgroundColor: theme.colors.surface + 'CC',
              borderColor: theme.colors.border
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                Rol Principal
              </CardTitle>
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.secondaryHover})` }}
              >
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                {stats.userRole === 'owner' ? 'Propietario' : 
                 stats.userRole === 'admin' ? 'Admin' : 
                 stats.userRole === 'user' ? 'Usuario' : 'Invitado'}
              </div>
              <p className="text-xs font-medium" style={{ color: theme.colors.secondary }}>
                {stats.userRole === 'owner' ? 'Control total' : 
                 stats.userRole === 'admin' ? 'Gestión avanzada' : 
                 'Acceso estándar'}
              </p>
            </CardContent>
          </Card>

          {/* Last Activity Card */}
          <Card 
            className="group hover:scale-105 transition-all duration-300 border-0 shadow-lg backdrop-blur-sm" 
            style={{ 
              backgroundColor: theme.colors.surface + 'CC',
              borderColor: theme.colors.border
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                Última Actividad
              </CardTitle>
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `linear-gradient(135deg, ${theme.colors.warning}, ${theme.colors.warningHover})` }}
              >
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                Hoy
              </div>
              <p className="text-xs font-medium" style={{ color: theme.colors.warning }}>
                ⚡ Sesión actual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section Header - Themed */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-1" style={{ color: theme.colors.textPrimary }}>
                Mis Proyectos Asignados
              </h3>
              <p className="mt-1" style={{ color: theme.colors.textSecondary }}>
                Accede directamente a la gestión de cada proyecto
              </p>
            </div>
            <Button 
              className="shadow-lg backdrop-blur-sm"
              style={{ 
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                border: 'none'
              }}
            >
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
                    className="group hover:scale-105 hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden backdrop-blur-sm"
                    style={{ 
                      backgroundColor: theme.colors.surface + 'DD',
                      borderColor: theme.colors.border
                    }}
                  >
                    {/* Gradient Overlay */}
                    <div 
                      className="absolute inset-0 opacity-5"
                      style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
                    ></div>
                    
                    <CardHeader className="relative">
                      <div className="flex items-center justify-between mb-4">
                        {/* Project Icon */}
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                          style={{ background: `linear-gradient(135deg, ${colors.primary || theme.colors.primary}, ${colors.primary || theme.colors.primaryHover}DD)` }}
                        >
                          <div className="text-white">
                            {getProjectIcon(userProject.project_type)}
                          </div>
                        </div>
                        
                        {/* Status Badges */}
                        <div className="flex flex-col items-end space-y-2">
                          <span 
                            className="px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm"
                            style={{ 
                              backgroundColor: theme.colors.success + '20',
                              color: theme.colors.success,
                              border: `1px solid ${theme.colors.success}30`
                            }}
                          >
                            Activo
                          </span>
                          <span 
                            className="px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm"
                            style={{ 
                              backgroundColor: theme.colors.secondary + '20',
                              color: theme.colors.secondary,
                              border: `1px solid ${theme.colors.secondary}30`
                            }}
                          >
                            {userProject.user_role === 'owner' ? 'Propietario' : 
                             userProject.user_role === 'admin' ? 'Admin' : 
                             userProject.user_role === 'user' ? 'Usuario' : userProject.user_role}
                          </span>
                        </div>
                      </div>
                      
                      <CardTitle className="text-xl mb-2" style={{ color: theme.colors.textPrimary }}>
                        {userProject.project_name}
                      </CardTitle>
                      <CardDescription className="leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                        {userProject.project_description || 'Proyecto sin descripción'}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="relative">
                      {/* Project Tags */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span 
                          className="px-3 py-1 text-sm rounded-full backdrop-blur-sm font-medium"
                          style={{ 
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.textPrimary,
                            border: `1px solid ${theme.colors.border}`
                          }}
                        >
                          {userProject.project_type === 'ecommerce' ? 'E-commerce' : 
                           userProject.project_type === 'saas' ? 'SaaS' : 
                           userProject.project_type}
                        </span>
                        {projectConfig.specialized && (
                          <span 
                            className="px-3 py-1 text-sm rounded-full backdrop-blur-sm font-medium"
                            style={{ 
                              backgroundColor: theme.colors.warning + '20',
                              color: theme.colors.warning,
                              border: `1px solid ${theme.colors.warning}30`
                            }}
                          >
                            Especializado
                          </span>
                        )}
                        {projectConfig.niche && (
                          <span 
                            className="px-3 py-1 text-sm rounded-full backdrop-blur-sm font-medium"
                            style={{ 
                              backgroundColor: theme.colors.secondary + '20',
                              color: theme.colors.secondary,
                              border: `1px solid ${theme.colors.secondary}30`
                            }}
                          >
                            {projectConfig.niche}
                          </span>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <Link href={`/projects/${userProject.project_slug}/dashboard`}>
                          <Button 
                            className="w-full shadow-lg group-hover:shadow-xl transition-all backdrop-blur-sm"
                            style={{ 
                              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                              border: 'none'
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
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full backdrop-blur-sm"
                              style={{ 
                                borderColor: theme.colors.border,
                                color: theme.colors.textSecondary
                              }}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Configuración
                            </Button>
                          </Link>
                        )}
                      </div>
                      
                      {/* Assignment Date */}
                      <div 
                        className="mt-4 pt-4 border-t text-xs" 
                        style={{ 
                          borderColor: theme.colors.border,
                          color: theme.colors.textTertiary 
                        }}
                      >
                        Asignado el {new Date(userProject.assigned_at).toLocaleDateString('es-ES')}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card 
              className="border-2 border-dashed transition-colors backdrop-blur-sm"
              style={{ 
                backgroundColor: theme.colors.surface + '80',
                borderColor: theme.colors.border,
              }}
            >
              <CardContent className="text-center py-12">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.secondary}20)` 
                  }}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.colors.primary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: theme.colors.textPrimary }}>
                  No tienes proyectos asignados
                </h3>
                <p className="mb-6 max-w-md mx-auto" style={{ color: theme.colors.textSecondary }}>
                  Crea un proyecto de ejemplo o solicita acceso a uno existente.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={createBrumaProject}
                    className="shadow-lg backdrop-blur-sm"
                    style={{ 
                      background: `linear-gradient(135deg, #dc2626, #000000)`,
                      border: 'none'
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Crear Proyecto BRUMA
                  </Button>
                  <Button 
                    className="shadow-lg backdrop-blur-sm"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                      border: 'none'
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Crear Proyecto General
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