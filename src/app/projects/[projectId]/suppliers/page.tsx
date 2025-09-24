'use client'

import { useEffect, useState, Suspense, lazy } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject } from '@/types/database'

// Lazy load del componente pesado
const SuppliersList = lazy(() => import('@/components/suppliers/SuppliersList'))

export default function ProjectSuppliersPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proveedores...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>→</span>
            <Link href={`/projects/${projectSlug}/dashboard`} className="hover:text-blue-600">
              {project?.project_name}
            </Link>
            <span>→</span>
            <span className="text-gray-900">Proveedores</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/images/bruma/logo-circle.svg" 
                alt="BRUMA Fightwear" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Proveedores</h1>
                <p className="text-gray-600 mt-2">
                  Administra la red de proveedores de {project.project_name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando proveedores...</span>
          </div>
        }>
          <SuppliersList projectId={project.project_id} />
        </Suspense>
      </div>
    </div>
  )
}