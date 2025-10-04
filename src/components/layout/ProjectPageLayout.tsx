'use client'

import { useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { useProjectSidebar } from '@/hooks/useProjectSidebar'
import { ThemeSelector } from '@/components/ui/theme-selector'
import { ModernSidebar } from '@/components/ui/modern-sidebar'

interface UserProject {
  project_id: string
  project_name: string
  project_slug: string
  project_type: string
}

interface ProjectPageLayoutProps {
  projectData: { project: UserProject } | null
  loading: boolean
  pageTitle: string
  children: ReactNode
}

export function ProjectPageLayout({ 
  projectData, 
  loading, 
  pageTitle, 
  children 
}: ProjectPageLayoutProps) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  
  const projectSlug = projectData?.project.project_slug || ''
  const sidebarItems = useProjectSidebar({ projectSlug })

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.background }}>
        <ModernSidebar 
          items={[]}
          projectName="Cargando..."
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" 
                 style={{ borderColor: theme.colors.primary }}></div>
            <p className="mt-4" style={{ color: theme.colors.textSecondary }}>
              Cargando...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.background }}>
        <ModernSidebar 
          items={[]}
          projectName="Error"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p style={{ color: theme.colors.error }}>Proyecto no encontrado</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.background }}>
      <ModernSidebar 
        items={sidebarItems}
        projectName={projectData.project.project_name}
      />
      
      <div className="flex-1 ml-64">
        <header className="border-b" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: theme.colors.textSecondary
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-sm">Dashboard Personal</span>
                </button>
                <div className="h-6 w-px" style={{ backgroundColor: theme.colors.border }}></div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
                    {projectData.project.project_name}
                  </h1>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    {pageTitle}
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
          {children}
        </main>
      </div>
    </div>
  )
}