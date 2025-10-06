'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useNavigation } from '@/contexts/NavigationContext'
import { GlobalSidebar } from '@/components/navigation/GlobalSidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { ThemeSelector } from '@/components/ui/theme-selector'
import { UserProfilePopup } from '@/components/ui/user-profile-popup'
import BrumaLogo from '@/components/bruma/BrumaLogo'

interface AppLayoutProps {
  children: React.ReactNode
  currentProject?: {
    id: string
    name: string
    slug: string
    type: string
  } | null
}

export function AppLayout({ children, currentProject }: AppLayoutProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const { state, setCurrentProject, setActiveSection, setActivePage } = useNavigation()
  const pathname = usePathname()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  
  // Calcular si el sidebar está efectivamente expandido
  const isHoverMode = state.sidebarMode === 'hover'
  const sidebarWidth = state.sidebarMode === 'expanded' ? 'ml-64' : 'ml-20'

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  // Actualizar proyecto actual cuando cambie
  useEffect(() => {
    const projectToSet = currentProject || undefined
    if (projectToSet !== state.currentProject) {
      setCurrentProject(projectToSet)
    }
  }, [currentProject, state.currentProject, setCurrentProject])

  // Detectar sección y página activa basada en la URL
  useEffect(() => {
    const pathSegments = pathname.split('/').filter(Boolean)
    
    // Detectar sección principal
    if (pathname === '/dashboard') {
      setActiveSection('dashboard')
      setActivePage('overview')
    } else if (pathname === '/statistics') {
      setActiveSection('statistics')
      setActivePage('overview')
    } else if (pathname === '/dashboard-custom') {
      setActiveSection('dashboard-custom')
      setActivePage('overview')
    } else if (pathname.startsWith('/projects/') && pathSegments.length >= 3) {
      // URL: /projects/[slug]/[section]/...
      const section = pathSegments[2]
      setActiveSection(`project-${section}`)
      
      if (pathSegments.length >= 4) {
        setActivePage(pathSegments[3])
      }
    } else if (pathname === '/showcase') {
      setActiveSection('showcase')
      setActivePage('overview')
    } else if (pathname === '/insert-data') {
      setActiveSection('insert-data')
      setActivePage('overview')
    }
  }, [pathname, setActiveSection, setActivePage])

  return (
    <div 
      className="min-h-screen flex" 
      style={{ backgroundColor: theme.colors.background }}
    >
      <GlobalSidebar />
      
      <main 
        className={`
          flex-1 transition-all duration-300
          ${sidebarWidth}
        `}
      >
        {/* Header fijo translúcido */}
        <div 
          className="sticky top-0 z-30 backdrop-blur-sm border-b"
          style={{ 
            backgroundColor: `${theme.colors.surface}95`,
            borderColor: theme.colors.border
          }}
        >
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Logo y nombre BRUMA */}
              <div className="flex items-center space-x-3">
                <BrumaLogo className="w-25 h-10" />
                <div>
                  <h1 className="text-lg font-bold" style={{ color: theme.colors.textPrimary }}>
                    BRUMA Fightwear
                  </h1>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                    ecommerce
                  </p>
                </div>
              </div>

              {/* Breadcrumbs y controles de usuario */}
              <div className="flex items-center space-x-6">
                {/* Breadcrumb funcional */}
                <nav className="flex items-center space-x-2 text-sm">
                  {renderFunctionalBreadcrumbs(pathname, currentProject, router, theme)}
                </nav>

                {/* Controles de usuario */}
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
                          className="fixed inset-0 z-40" 
                          onClick={() => setUserDropdownOpen(false)}
                        />
                        <div
                          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50"
                          style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                        >
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setShowProfilePopup(true)
                                setUserDropdownOpen(false)
                              }}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-opacity-10 transition-colors"
                              style={{ color: theme.colors.textPrimary }}
                            >
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Ver perfil</span>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                router.push('/dashboard')
                                setUserDropdownOpen(false)
                              }}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-opacity-10 transition-colors"
                              style={{ color: theme.colors.textPrimary }}
                            >
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3" />
                                </svg>
                                <span>Dashboard Personal</span>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                handleLogout()
                                setUserDropdownOpen(false)
                              }}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-opacity-10 transition-colors"
                              style={{ color: theme.colors.error }}
                            >
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                                </svg>
                                <span>Cerrar sesión</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Popup de perfil de usuario */}
      <UserProfilePopup 
        isOpen={showProfilePopup}
        onClose={() => setShowProfilePopup(false)}
      />
    </div>
  )
}

function getCurrentBreadcrumb(pathname: string, currentProject?: { name: string } | null): string {
  const segments = pathname.split('/').filter(Boolean)
  
  if (pathname === '/dashboard') return 'Dashboard Personal'
  if (pathname === '/statistics') return 'Estadísticas Generales'
  if (pathname === '/dashboard-custom') return 'Dashboard Personalizado'
  if (pathname === '/showcase') return 'Showcase de Componentes'
  if (pathname === '/insert-data') return 'Insertar Datos'
  
  if (segments[0] === 'projects' && currentProject) {
    const section = segments[2]
    const sectionNames: Record<string, string> = {
      'dashboard': 'Dashboard del Proyecto',
      'customers': 'Gestión de Clientes',
      'products': 'Gestión de Productos',
      'categories': 'Categorías',
      'inventory': 'Inventario',
      'orders': 'Pedidos',
      'purchase-orders': 'Órdenes de Compra',
      'suppliers': 'Proveedores',
      'shipping': 'Envíos'
    }
    
    const sectionName = sectionNames[section] || section
    return `${currentProject.name} › ${sectionName}`
  }
  
  return 'Navegación'
}

function renderFunctionalBreadcrumbs(pathname: string, currentProject: any, router: any, theme: any) {
  const segments = pathname.split('/').filter(Boolean)
  
  // Para páginas principales (no de proyecto)
  if (pathname === '/dashboard') {
    return <span style={{ color: theme.colors.textPrimary }}>Dashboard Personal</span>
  }
  
  if (pathname === '/statistics') {
    return (
      <>
        <button 
          onClick={() => router.push('/dashboard')}
          className="hover:underline transition-colors"
          style={{ color: theme.colors.primary }}
        >
          Dashboard Personal
        </button>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: theme.colors.textTertiary }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span style={{ color: theme.colors.textPrimary }}>Estadísticas Generales</span>
      </>
    )
  }
  
  // Para páginas de proyectos
  if (segments[0] === 'projects' && currentProject) {
    const projectSlug = segments[1]
    const section = segments[2]
    
    const sectionNames: Record<string, string> = {
      'dashboard': 'Dashboard del Proyecto',
      'customers': 'Gestión de Clientes',
      'products': 'Gestión de Productos',
      'categories': 'Categorías',
      'inventory': 'Inventario',
      'orders': 'Pedidos',
      'purchase-orders': 'Órdenes de Compra',
      'suppliers': 'Proveedores',
      'shipping': 'Envíos'
    }
    
    const sectionName = sectionNames[section] || section
    
    return (
      <>
        <button 
          onClick={() => router.push('/dashboard')}
          className="hover:underline transition-colors"
          style={{ color: theme.colors.primary }}
        >
          Dashboard Personal
        </button>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: theme.colors.textTertiary }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <button 
          onClick={() => router.push(`/projects/${projectSlug}/dashboard`)}
          className="hover:underline transition-colors"
          style={{ color: theme.colors.primary }}
        >
          {currentProject.name}
        </button>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: theme.colors.textTertiary }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span style={{ color: theme.colors.textPrimary }}>{sectionName}</span>
      </>
    )
  }
  
  return <span style={{ color: theme.colors.textPrimary }}>Navegación</span>
}