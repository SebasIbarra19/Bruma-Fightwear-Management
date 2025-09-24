'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { Category, UserProject } from '@/types/database'

export default function CategoriesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

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
      await loadCategories(currentProject.project_id)

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error cargando categorías:', error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const toggleCategoryStatus = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)

      if (error) {
        console.error('Error actualizando estado:', error)
        alert('Error al actualizar el estado de la categoría')
        return
      }

      // Actualizar la lista local
      setCategories(prev => 
        prev.map(cat => 
          cat.id === category.id 
            ? { ...cat, is_active: !cat.is_active }
            : cat
        )
      )
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteCategory = async (category: Category) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)

      if (error) {
        console.error('Error eliminando categoría:', error)
        alert('Error al eliminar la categoría')
        return
      }

      // Actualizar la lista local
      setCategories(prev => prev.filter(cat => cat.id !== category.id))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.slug.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && category.is_active) ||
                         (statusFilter === 'inactive' && !category.is_active)

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
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
            <span className="text-gray-900">Categorías</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
              <p className="text-gray-600 mt-2">
                Gestiona las categorías de productos: Rashguards, Pantalonetas Sin Licra, T-shirts
              </p>
            </div>
            
            <Link href={`/projects/${projectSlug}/categories/new`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                + Nueva Categoría
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Solo activas</option>
                <option value="inactive">Solo inactivas</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Categorías */}
        <div className="grid gap-4">
          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No se encontraron categorías con los filtros aplicados' 
                      : 'No hay categorías creadas aún'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Link href={`/projects/${projectSlug}/categories/new`}>
                      <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                        Crear primera categoría
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {category.name}
                        </h3>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          category.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Slug:</span> {category.slug}
                      </p>
                      
                      {category.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {category.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Orden: {category.sort_order}</span>
                        <span>Creada: {new Date(category.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => toggleCategoryStatus(category)}
                        variant="outline"
                        size="sm"
                        className={category.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {category.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                      
                      <Link href={`/projects/${projectSlug}/categories/${category.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      
                      <Button
                        onClick={() => deleteCategory(category)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Resumen */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                Total: {categories.length} categorías
              </span>
              <span>
                Activas: {categories.filter(c => c.is_active).length} | 
                Inactivas: {categories.filter(c => !c.is_active).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}