'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject, CategoryFormData } from '@/types/database'

export default function NewCategoryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    is_active: true,
    sort_order: 0
  })

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

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[áäàâã]/g, 'a')
      .replace(/[éëèê]/g, 'e')
      .replace(/[íïìî]/g, 'i')
      .replace(/[óöòôõ]/g, 'o')
      .replace(/[úüùû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-|-$/g, '')
  }

  const handleInputChange = (field: keyof CategoryFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-generar slug al cambiar el nombre
    if (field === 'name' && typeof value === 'string') {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }))
    }
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.name.trim()) {
      errors.push('El nombre es requerido')
    }

    if (!formData.slug.trim()) {
      errors.push('El slug es requerido')
    }

    if (formData.sort_order < 0) {
      errors.push('El orden debe ser un número positivo')
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      alert('Errores:\n' + errors.join('\n'))
      return
    }

    if (!project) return

    setSaving(true)

    try {
      const dataToSave = {
        ...formData,
        project_id: project.project_id
      }

      const { error } = await supabase
        .from('categories')
        .insert([dataToSave])

      if (error) {
        console.error('Error creando:', error)
        alert('Error al crear la categoría')
        return
      }

      // Redirigir a la lista
      router.push(`/projects/${projectSlug}/categories`)

    } catch (error) {
      console.error('Error guardando:', error)
      alert('Error al guardar la categoría')
    } finally {
      setSaving(false)
    }
  }

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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>→</span>
            <Link href={`/projects/${projectSlug}/dashboard`} className="hover:text-blue-600">
              {project?.project_name}
            </Link>
            <span>→</span>
            <Link href={`/projects/${projectSlug}/categories`} className="hover:text-blue-600">
              Categorías
            </Link>
            <span>→</span>
            <span className="text-gray-900">Nueva</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Nueva Categoría
          </h1>
          <p className="text-gray-600 mt-2">
            Crea una nueva categoría de productos
          </p>
        </div>

        {/* Categorías predefinidas */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Categorías BRUMA Fightwear</CardTitle>
            <CardDescription className="text-blue-700">
              Estas son las categorías principales que manejamos:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Rashguards</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFormData({
                      name: 'Rashguards',
                      slug: 'rashguards',
                      description: 'Camisetas de compresión para artes marciales y deportes de contacto',
                      is_active: true,
                      sort_order: 1
                    })
                  }}
                >
                  Usar
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Pantalonetas Sin Licra</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFormData({
                      name: 'Pantalonetas Sin Licra',
                      slug: 'pantalonetas-sin-licra',
                      description: 'Shorts amplios para artes marciales y entrenamiento',
                      is_active: true,
                      sort_order: 2
                    })
                  }}
                >
                  Usar
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">T-shirts</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFormData({
                      name: 'T-shirts',
                      slug: 't-shirts',
                      description: 'Camisetas casuales y de entrenamiento',
                      is_active: true,
                      sort_order: 3
                    })
                  }}
                >
                  Usar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Categoría</CardTitle>
            <CardDescription>
              Completa los datos de la nueva categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Rashguards"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <Input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="rashguards"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL amigable para la categoría (se genera automáticamente)
                </p>
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción de la categoría..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Orden */}
              <div>
                <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-2">
                  Orden de visualización
                </label>
                <Input
                  id="sort_order"
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Orden en que aparecerá en los listados (menor número = primero)
                </p>
              </div>

              {/* Estado */}
              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Categoría activa
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? 'Creando...' : 'Crear'} Categoría
                </Button>
                
                <Link href={`/projects/${projectSlug}/categories`}>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}