'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { ProjectPageLayout } from '@/components/layout/ProjectPageLayout'

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
    <ProjectPageLayout
      projectData={projectData}
      loading={loading}
      pageTitle="Dashboard Principal"
    >
      <Tabs tabs={analyticsTabs} defaultTab="overview" />
    </ProjectPageLayout>
  )
}