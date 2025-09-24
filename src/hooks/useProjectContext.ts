import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProjectContext {
  projectId: string | null
  projectName: string | null
  isBrumaProject: boolean
}

export function useProjectContext(): ProjectContext {
  const pathname = usePathname()
  const [context, setContext] = useState<ProjectContext>({
    projectId: null,
    projectName: null,
    isBrumaProject: false
  })

  useEffect(() => {
    // Extraer project ID de la URL
    const projectMatch = pathname.match(/\/projects\/([^\/]+)/)
    const projectId = projectMatch ? projectMatch[1] : null
    
    // Determinar si es un proyecto BRUMA basado en diferentes criterios
    let isBrumaProject = false
    let projectName = null

    if (projectId) {
      // Verificar por ID exacto
      isBrumaProject = projectId === 'bruma-fightwear' || 
                      projectId === 'bruma' ||
                      projectId.toLowerCase().includes('bruma')
      
      if (isBrumaProject) {
        projectName = 'BRUMA Fightwear'
      }
    }

    // También verificar por nombre en la URL
    if (pathname.toLowerCase().includes('bruma')) {
      isBrumaProject = true
      projectName = 'BRUMA Fightwear'
    }

    setContext({
      projectId,
      projectName,
      isBrumaProject
    })
  }, [pathname])

  return context
}