'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { ProductLine, UserProject } from '@/types/database'

export default function ProductLinesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [productLines, setProductLines] = useState<ProductLine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const router = useRouter()
  const params = useParams()
  const projectSlug = params.projectId as string

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)

      // Obtener proyecto del usuario
      const { data: userProjects, error } = await supabase.rpc('get_user_projects', {
        user_uuid: session.user.id
      })

      if (error) {
        console.error('Error obteniendo proyectos:', error)
        router.push('/dashboard')
        return
      }

      const currentProject = userProjects?.find((p: UserProject) => p.project_slug === projectSlug)
      
      if (!currentProject) {
        console.error('Proyecto no encontrado o sin acceso')
        router.push('/dashboard')
        return
      }

      setProject(currentProject)

      // Cargar líneas de productos
      await loadProductLines(currentProject.project_id)

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProductLines = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_lines')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error cargando líneas de productos:', error)
        return
      }

      setProductLines(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteProductLine = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta línea de productos?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('product_lines')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error eliminando línea:', error)
        alert('Error al eliminar la línea de productos')
        return
      }

      // Recargar lista
      if (project) {
        await loadProductLines(project.project_id)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la línea de productos')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('product_lines')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) {
        console.error('Error actualizando estado:', error)
        return
      }

      // Recargar lista
      if (project) {
        await loadProductLines(project.project_id)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filteredProductLines = productLines.filter(line =>
    line.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    line.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    line.season?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando líneas de productos...</p>
        </div>
      </div>
    )
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
            <Link href={`/projects/${projectSlug}/products`} className="hover:text-blue-600">
              Productos
            </Link>
            <span>→</span>
            <span className="text-gray-900">Líneas de Productos</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Líneas de Productos</h1>
              <p className="text-gray-600 mt-2">Gestiona las colecciones y líneas de productos de {project?.project_name}</p>
            </div>
            
            <Link href={`/projects/${projectSlug}/product-lines/new`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                + Nueva Línea
              </Button>
            </Link>
          </div>
        </div>

        {/* Búsqueda */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Buscar líneas de productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline">
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de líneas */}
        {filteredProductLines.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="text-gray-500">
                {searchTerm ? 'No se encontraron líneas de productos que coincidan con tu búsqueda.' : 'No hay líneas de productos creadas aún.'}
              </div>
              {!searchTerm && (
                <Link href={`/projects/${projectSlug}/product-lines/new`}>
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                    Crear primera línea
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProductLines.map((line) => (
              <Card key={line.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{line.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          line.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {line.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                        {line.season && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {line.season}
                          </span>
                        )}
                      </div>
                      
                      {line.description && (
                        <p className="text-gray-600 mb-3">{line.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Slug: {line.slug}</span>
                        <span>Orden: {line.sort_order}</span>
                        <span>Creada: {new Date(line.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(line.id, line.is_active)}
                      >
                        {line.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                      
                      <Link href={`/projects/${projectSlug}/products/product-lines/${line.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteProductLine(line.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}