'use client'

import { useEffect, useState, Suspense, lazy } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject } from '@/types/database'

// Lazy load del componente pesado
const PurchaseOrdersList = lazy(() => import('@/components/purchase-orders/PurchaseOrdersList'))

export default function ProjectPurchaseOrdersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const projectSlug = params.projectId as string

  useEffect(() => {
    loadProjectAndAuth()
  }, [])

  const loadProjectAndAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)

      // Obtener proyectos del usuario
      const { data: userProjects, error } = await supabase
        .rpc('get_user_projects', { user_uuid: session.user.id })

      if (error) {
        console.error('Error obteniendo proyectos:', error)
        router.push('/dashboard')
        return
      }

      // Encontrar el proyecto específico
      const currentProject = userProjects?.find((p: UserProject) => p.project_slug === projectSlug)
      
      if (!currentProject) {
        console.error('Proyecto no encontrado o sin acceso')
        router.push('/dashboard')
        return
      }

      setProject(currentProject)
    } catch (error) {
      console.error('Error cargando proyecto:', error)
      router.push('/dashboard')
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando órdenes de compra...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/projects/${projectSlug}/dashboard`} className="flex items-center text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Órdenes de Compra - {project.project_name}</h1>
                <p className="text-sm text-gray-600">
                  Gestiona las órdenes de compra del proyecto
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Cargando órdenes...</span>
          </div>
        }>
          <PurchaseOrdersList projectId={project.project_id} />
        </Suspense>
      </main>
    </div>
  )
}