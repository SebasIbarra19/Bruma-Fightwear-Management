'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const projectSlug = params.projectId

  useEffect(() => {
    // Redirigir automáticamente al dashboard del proyecto
    router.replace(`/projects/${projectSlug}/dashboard`)
  }, [projectSlug, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  )
}