'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { Tabs } from '@/components/ui/tabs'
import { ProjectPageLayout } from '@/components/layout/ProjectPageLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ModernTable } from '@/components/ui/modern-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Category {
  id: string
  name: string
  description?: string
  parent_id?: string
  is_active: boolean
  products_count: number
  subcategories_count: number
  color: string
  created_at: string
}

interface CategoryStats {
  total_categories: number
  active_categories: number
  total_products: number
  total_subcategories: number
}

interface ProjectData {
  project: {
    project_id: string
    project_name: string
    project_slug: string
    project_type: string
  }
}

export default function CategoriesPage({ params }: { params: { projectId: string } }) {
  const { user, isLoading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<CategoryStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Cargar datos del proyecto
  useEffect(() => {
    if ((user || !authLoading) && params.projectId) {
      loadProjectData()
    }
  }, [user, authLoading, params.projectId])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      
      // Mock data para demostración
      setProjectData({ 
        project: { 
          project_id: params.projectId, 
          project_name: "BRUMA Fightwear", 
          project_slug: "bruma-fightwear",
          project_type: "ecommerce"
        } 
      })
      
      // Mock categories
      setCategories([
        {
          id: "1",
          name: "Guantes",
          description: "Guantes de combate y entrenamiento",
          parent_id: undefined,
          is_active: true,
          products_count: 15,
          subcategories_count: 3,
          color: "#3B82F6",
          created_at: "2024-01-15"
        },
        {
          id: "2", 
          name: "Shorts",
          description: "Shorts para MMA y entrenamiento",
          parent_id: undefined,
          is_active: true,
          products_count: 8,
          subcategories_count: 2,
          color: "#10B981",
          created_at: "2024-01-20"
        },
        {
          id: "3",
          name: "Protección",
          description: "Equipamiento de protección",
          parent_id: undefined,
          is_active: true,
          products_count: 12,
          subcategories_count: 4,
          color: "#F59E0B",
          created_at: "2024-01-25"
        }
      ])
      
      // Mock stats
      setStats({
        total_categories: 3,
        active_categories: 3,
        total_products: 35,
        total_subcategories: 9
      })
      
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = () => {
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  const categoriesTabs = [
    {
      id: 'management',
      label: 'Gestión de Categorías',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Total Categorías</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  {stats?.total_categories || 0}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>Activas: {stats?.active_categories || 0}</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Subcategorías</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" style={{ color: theme.colors.warning }}>
                  {stats?.total_subcategories || 0}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>En todas las categorías</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Productos Totales</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" style={{ color: theme.colors.success }}>
                  {stats?.total_products || 0}
                </div>
                <p className="text-xs mt-1" style={{ color: theme.colors.success }}>En todas las categorías</p>
              </CardContent>
            </Card>
          </div>

          {/* ESTRUCTURA PERFECTA - Como Control de Stock */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                  Categorías del Proyecto
                </h3>
                <p style={{ color: theme.colors.textSecondary }}>
                  Gestión completa de categorías y subcategorías
                </p>
              </div>
              <Button 
                className="shadow-lg"
                onClick={() => console.log('Crear nueva categoría')}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                  border: 'none'
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Categoría
              </Button>
            </div>

            {/* Tabla de categorías usando ModernTable */}
            <ModernTable
              data={filteredCategories()}
              columns={[
                {
                  key: 'name',
                  title: 'Categoría',
                  sortable: true,
                  render: (value, row) => (
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-lg mr-4 flex items-center justify-center text-white font-bold" 
                           style={{ backgroundColor: row.color }}>
                        {value.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: theme.colors.textPrimary }}>{value}</div>
                        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          {row.description || 'Sin descripción'}
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'products_count',
                  title: 'Productos',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="font-medium" style={{ color: theme.colors.primary }}>{value}</div>
                      <div className="text-sm" style={{ color: theme.colors.textSecondary }}>productos</div>
                    </div>
                  )
                },
                {
                  key: 'subcategories_count',
                  title: 'Subcategorías',
                  sortable: true,
                  render: (value) => (
                    <div>
                      <div className="font-medium" style={{ color: theme.colors.warning }}>{value}</div>
                      <div className="text-sm" style={{ color: theme.colors.textSecondary }}>subcategorías</div>
                    </div>
                  )
                },
                {
                  key: 'is_active',
                  title: 'Estado',
                  render: (value) => (
                    <span 
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        value ? 'text-green-700' : 'text-red-700'
                      }`}
                      style={{ 
                        backgroundColor: value ? theme.colors.success + '20' : theme.colors.error + '20',
                        border: `1px solid ${value ? theme.colors.success : theme.colors.error}30`
                      }}
                    >
                      {value ? 'Activa' : 'Inactiva'}
                    </span>
                  )
                },
                {
                  key: 'created_at',
                  title: 'Creada',
                  sortable: true,
                  render: (value) => (
                    <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      {new Date(value).toLocaleDateString()}
                    </div>
                  )
                }
              ]}
              renderExpandedRow={(row) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.primary }}>Información de Categoría</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Tipo:</span> {row.parent_id ? 'Subcategoría' : 'Categoría principal'}</p>
                      <p><span className="text-gray-400">Color:</span> 
                        <span className="inline-block w-4 h-4 rounded ml-2" style={{ backgroundColor: row.color }}></span>
                      </p>
                      <p><span className="text-gray-400">Creada:</span> {row.created_at}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.success }}>Estadísticas</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-400">Productos:</span> {row.products_count}</p>
                      <p><span className="text-gray-400">Subcategorías:</span> {row.subcategories_count}</p>
                      <p><span className="text-gray-400">Estado:</span> {row.is_active ? 'Activa' : 'Inactiva'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: theme.colors.warning }}>Acciones</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar Categoría
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver Productos
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Agregar Subcategoría
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              onEdit={(category) => console.log('Editar:', category)}
              onDelete={(category) => console.log('Eliminar:', category)}
              onRefresh={() => console.log('Refrescar categorías')}
            />
          </div>
        </div>
      )
    },
    {
      id: 'hierarchy',
      label: 'Jerarquía',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🌳</div>
            <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
              Vista de Jerarquía
            </h3>
            <p style={{ color: theme.colors.textSecondary }}>
              Funcionalidad de vista jerárquica en desarrollo
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      content: (
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
              Reportes de Categorías
            </h3>
            <p style={{ color: theme.colors.textSecondary }}>
              Informes detallados sobre el rendimiento de categorías en desarrollo
            </p>
          </div>
        </div>
      )
    }
  ]

  return (
    <ProjectPageLayout
      projectData={projectData}
      loading={loading}
      pageTitle="Categorías de Productos"
    >
      <Tabs tabs={categoriesTabs} defaultTab="management" />
    </ProjectPageLayout>
  )
}