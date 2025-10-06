'use client'

import { ReactNode } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useProjectSidebar } from '@/hooks/useProjectSidebar'
import { ModernSidebar } from '@/components/ui/modern-sidebar'
import { AppLayout } from '@/components/layout/AppLayout'

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
  const { theme } = useTheme()
  
  const projectSlug = projectData?.project.project_slug || ''
  const sidebarItems = useProjectSidebar({ projectSlug })

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
    <AppLayout currentProject={{
      id: projectData.project.project_id,
      name: projectData.project.project_name,
      slug: projectData.project.project_slug,
      type: projectData.project.project_type
    }}>
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
        <main className="p-6">
          {children}
        </main>
      </div>
    </AppLayout>
  )
}