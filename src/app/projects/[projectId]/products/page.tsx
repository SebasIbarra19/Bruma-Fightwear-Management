'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject, ProductLine, Category, Product } from '@/types/database'

interface ProductStats {
  totalProductLines: number
  totalCategories: number
  totalProducts: number
  activeProducts: number
  totalVariants: number
}

export default function ProductsMainPage() {
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [stats, setStats] = useState<ProductStats>({
    totalProductLines: 0,
    totalCategories: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalVariants: 0
  })
  const [loading, setLoading] = useState(true)

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
      await loadStats(currentProject.project_id)

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (projectId: string) => {
    try {
      // Obtener estadísticas de líneas de productos
      const { data: productLines, error: linesError } = await supabase
        .from('product_lines')
        .select('id')
        .eq('project_id', projectId)

      // Obtener estadísticas de categorías
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('project_id', projectId)

      // Obtener estadísticas de productos
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, is_active')
        .eq('project_id', projectId)

      // Obtener estadísticas de variantes
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('id, products!inner(project_id)')
        .eq('products.project_id', projectId)

      if (!linesError && !categoriesError && !productsError && !variantsError) {
        setStats({
          totalProductLines: productLines?.length || 0,
          totalCategories: categories?.length || 0,
          totalProducts: products?.length || 0,
          activeProducts: products?.filter(p => p.is_active).length || 0,
          totalVariants: variants?.length || 0
        })
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const productModules = [
    {
      title: 'Líneas de Productos',
      description: 'Gestionar colecciones y líneas de productos',
      icon: '📋',
      href: `/projects/${projectSlug}/products/product-lines`,
      color: 'bg-blue-500',
      stat: stats.totalProductLines,
      statLabel: 'líneas'
    },
    {
      title: 'Categorías',
      description: 'Rashguards, Pantalonetas Sin Licra, T-shirts',
      icon: '🏷️',
      href: `/projects/${projectSlug}/products/categories`,
      color: 'bg-green-500',
      stat: stats.totalCategories,
      statLabel: 'categorías'
    },
    {
      title: 'Productos',
      description: 'Catálogo completo de productos',
      icon: '📦',
      href: `/projects/${projectSlug}/products/catalog`,
      color: 'bg-purple-500',
      stat: stats.totalProducts,
      statLabel: 'productos'
    },
    {
      title: 'Variantes',
      description: 'Tallas, colores y opciones',
      icon: '🎨',
      href: `/projects/${projectSlug}/products/variants`,
      color: 'bg-orange-500',
      stat: stats.totalVariants,
      statLabel: 'variantes'
    }
  ]

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
            <span className="text-gray-900">Productos</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
              <p className="text-gray-600 mt-2">
                Sistema completo para gestionar el catálogo de BRUMA Fightwear
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Líneas</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalProductLines}</p>
                </div>
                <div className="text-2xl">📋</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categorías</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalCategories}</p>
                </div>
                <div className="text-2xl">🏷️</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Productos</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalProducts}</p>
                </div>
                <div className="text-2xl">📦</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.activeProducts}</p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Módulos de Productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {productModules.map((module, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href={module.href}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center text-2xl text-white`}>
                      {module.icon}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{module.stat}</p>
                      <p className="text-sm text-gray-500">{module.statLabel}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {module.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {module.description}
                  </p>
                  
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      Gestionar →
                    </Button>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>

        {/* Acciones Rápidas */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Tareas comunes para la gestión de productos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={`/projects/${projectSlug}/products/product-lines/new`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  + Nueva Línea de Productos
                </Button>
              </Link>
              
              <Link href={`/projects/${projectSlug}/products/categories/new`}>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  + Nueva Categoría
                </Button>
              </Link>
              
              <Link href={`/projects/${projectSlug}/products/catalog/new`}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  + Nuevo Producto
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Información BRUMA Fightwear */}
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">BRUMA Fightwear - Configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">Categorías Principales</h4>
                <ul className="text-amber-800 space-y-1">
                  <li>• Rashguards</li>
                  <li>• Pantalonetas Sin Licra</li>
                  <li>• T-shirts</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">Características</h4>
                <ul className="text-amber-800 space-y-1">
                  <li>• Sin manejo de imágenes</li>
                  <li>• Productos con variantes</li>
                  <li>• Gestión de colecciones</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">Estado</h4>
                <ul className="text-amber-800 space-y-1">
                  <li>• Fase 1: Configuración inicial</li>
                  <li>• Sistema multi-proyecto</li>
                  <li>• Base de datos PostgreSQL</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}