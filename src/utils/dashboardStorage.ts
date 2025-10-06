import type { GridCell, GridConfig } from '@/types/dashboard'

export interface SavedDashboard {
  id: string
  name: string
  description?: string
  widgets: GridCell[]
  gridConfig: GridConfig
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'bruma-custom-dashboards'

// Obtener dashboards guardados
export function getSavedDashboards(): SavedDashboard[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading saved dashboards:', error)
    return []
  }
}

// Guardar dashboard
export function saveDashboard(
  name: string, 
  widgets: GridCell[], 
  gridConfig: GridConfig,
  description?: string,
  id?: string
): SavedDashboard {
  const dashboards = getSavedDashboards()
  const now = new Date().toISOString()
  
  const dashboard: SavedDashboard = {
    id: id || `dashboard-${Date.now()}`,
    name,
    description,
    widgets: JSON.parse(JSON.stringify(widgets)), // Deep clone
    gridConfig: { ...gridConfig },
    createdAt: id ? dashboards.find(d => d.id === id)?.createdAt || now : now,
    updatedAt: now
  }
  
  const updatedDashboards = id 
    ? dashboards.map(d => d.id === id ? dashboard : d)
    : [...dashboards, dashboard]
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDashboards))
    return dashboard
  } catch (error) {
    console.error('Error saving dashboard:', error)
    throw new Error('No se pudo guardar el dashboard')
  }
}

// Cargar dashboard
export function loadDashboard(id: string): SavedDashboard | null {
  const dashboards = getSavedDashboards()
  return dashboards.find(d => d.id === id) || null
}

// Eliminar dashboard
export function deleteDashboard(id: string): boolean {
  try {
    const dashboards = getSavedDashboards()
    const filtered = dashboards.filter(d => d.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting dashboard:', error)
    return false
  }
}

// Exportar dashboard como JSON
export function exportDashboard(dashboard: SavedDashboard): string {
  return JSON.stringify(dashboard, null, 2)
}

// Importar dashboard desde JSON
export function importDashboard(jsonString: string): SavedDashboard {
  try {
    const dashboard = JSON.parse(jsonString) as SavedDashboard
    
    // Validar estructura básica
    if (!dashboard.id || !dashboard.name || !Array.isArray(dashboard.widgets)) {
      throw new Error('Formato de dashboard inválido')
    }
    
    // Generar nuevo ID para evitar conflictos
    dashboard.id = `imported-${Date.now()}`
    dashboard.updatedAt = new Date().toISOString()
    
    return saveDashboard(
      dashboard.name + ' (Importado)',
      dashboard.widgets,
      dashboard.gridConfig,
      dashboard.description,
      dashboard.id
    )
  } catch (error) {
    console.error('Error importing dashboard:', error)
    throw new Error('No se pudo importar el dashboard')
  }
}

// Templates predefinidos
export const DASHBOARD_TEMPLATES: Omit<SavedDashboard, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Dashboard Ejecutivo',
    description: 'Vista general con KPIs principales y gráficos ejecutivos',
    gridConfig: { columns: 12, rows: 8, cellSize: 80, gap: 8 },
    widgets: [
      {
        id: 'kpi-revenue',
        x: 0, y: 0, width: 3, height: 2,
        widgetType: 'kpi',
        widgetProps: { title: 'Ingresos', value: '$125,430', trend: 8.5 }
      },
      {
        id: 'kpi-orders',
        x: 3, y: 0, width: 3, height: 2,
        widgetType: 'kpi',
        widgetProps: { title: 'Pedidos', value: '1,234', trend: 12.3 }
      },
      {
        id: 'executive-dashboard',
        x: 6, y: 0, width: 6, height: 4,
        widgetType: 'executive',
        widgetProps: {}
      },
      {
        id: 'sales-chart',
        x: 0, y: 2, width: 6, height: 4,
        widgetType: 'sales',
        widgetProps: {}
      }
    ]
  },
  {
    name: 'Análisis de Ventas',
    description: 'Dashboard enfocado en métricas y análisis de ventas',
    gridConfig: { columns: 12, rows: 8, cellSize: 80, gap: 8 },
    widgets: [
      {
        id: 'sales-kpi',
        x: 0, y: 0, width: 4, height: 2,
        widgetType: 'kpi',
        widgetProps: { title: 'Ventas del Mes', value: '$89,432', trend: 15.7 }
      },
      {
        id: 'sales-analysis',
        x: 4, y: 0, width: 8, height: 4,
        widgetType: 'sales',
        widgetProps: {}
      },
      {
        id: 'customer-behavior',
        x: 0, y: 2, width: 4, height: 4,
        widgetType: 'customer',
        widgetProps: {}
      }
    ]
  },
  {
    name: 'Monitoreo Operacional',
    description: 'Dashboard para seguimiento de operaciones y rendimiento',
    gridConfig: { columns: 12, rows: 8, cellSize: 80, gap: 8 },
    widgets: [
      {
        id: 'operational-performance',
        x: 0, y: 0, width: 8, height: 4,
        widgetType: 'operational',
        widgetProps: {}
      },
      {
        id: 'efficiency-kpi',
        x: 8, y: 0, width: 4, height: 2,
        widgetType: 'kpi',
        widgetProps: { title: 'Eficiencia', value: '94.2%', trend: 2.1 }
      },
      {
        id: 'alerts-kpi',
        x: 8, y: 2, width: 4, height: 2,
        widgetType: 'kpi',
        widgetProps: { title: 'Alertas Activas', value: '3', trend: -25 }
      }
    ]
  }
]

// Crear dashboard desde template
export function createFromTemplate(templateIndex: number): SavedDashboard {
  const template = DASHBOARD_TEMPLATES[templateIndex]
  if (!template) {
    throw new Error('Template no encontrado')
  }
  
  return saveDashboard(
    template.name,
    template.widgets,
    template.gridConfig,
    template.description
  )
}