import type { WidgetDefinition } from '@/types/dashboard'
import { WIDGET_COMPONENTS } from './WidgetComponents'

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  // KPIs
  {
    id: 'kpi-revenue',
    name: 'Ingresos Totales',
    icon: '💰',
    description: 'KPI de ingresos con tendencia',
    category: 'kpis',
    minWidth: 2,
    minHeight: 1,
    maxWidth: 4,
    maxHeight: 2,
    component: WIDGET_COMPONENTS.kpi,
    defaultProps: {
      title: 'Ingresos Totales',
      value: '€847,230',
      change: '+12.4%',
      icon: '💰',
      trend: 'up'
    }
  },
  {
    id: 'kpi-customers',
    name: 'Clientes Activos',
    icon: '👥',
    description: 'Total de clientes activos',
    category: 'kpis',
    minWidth: 2,
    minHeight: 1,
    maxWidth: 4,
    maxHeight: 2,
    component: WIDGET_COMPONENTS.kpi,
    defaultProps: {
      title: 'Clientes Activos',
      value: '8,947',
      change: '+8.7%',
      icon: '👥',
      trend: 'up'
    }
  },
  {
    id: 'kpi-orders',
    name: 'Pedidos Mensuales',
    icon: '📦',
    description: 'Número de pedidos del mes',
    category: 'kpis',
    minWidth: 2,
    minHeight: 1,
    maxWidth: 4,
    maxHeight: 2,
    component: WIDGET_COMPONENTS.kpi,
    defaultProps: {
      title: 'Pedidos Mensuales',
      value: '2,134',
      change: '+15.2%',
      icon: '📦',
      trend: 'up'
    }
  },
  {
    id: 'kpi-satisfaction',
    name: 'Satisfacción Cliente',
    icon: '⭐',
    description: 'Rating promedio de satisfacción',
    category: 'kpis',
    minWidth: 2,
    minHeight: 1,
    maxWidth: 4,
    maxHeight: 2,
    component: WIDGET_COMPONENTS.kpi,
    defaultProps: {
      title: 'Satisfacción',
      value: '4.8/5',
      change: '+0.2',
      icon: '⭐',
      trend: 'up'
    }
  },

  // Gráficos
  {
    id: 'chart-sales-trend',
    name: 'Tendencia Ventas',
    icon: '📈',
    description: 'Gráfico de evolución de ventas',
    category: 'charts',
    minWidth: 3,
    minHeight: 2,
    maxWidth: 8,
    maxHeight: 6,
    component: WIDGET_COMPONENTS.chart
  },
  {
    id: 'chart-top-products',
    name: 'Top Productos',
    icon: '🥧',
    description: 'Productos más vendidos',
    category: 'charts',
    minWidth: 3,
    minHeight: 3,
    maxWidth: 6,
    maxHeight: 6,
    component: WIDGET_COMPONENTS.sales
  },
  {
    id: 'chart-efficiency',
    name: 'Eficiencia Procesos',
    icon: '🕸️',
    description: 'Radar de eficiencia operacional',
    category: 'charts',
    minWidth: 3,
    minHeight: 3,
    maxWidth: 6,
    maxHeight: 6,
    component: WIDGET_COMPONENTS.operational
  },

  // Dashboards
  {
    id: 'dashboard-executive',
    name: 'Dashboard Ejecutivo',
    icon: '👔',
    description: 'Vista ejecutiva con KPIs principales',
    category: 'dashboards',
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 8,
    component: WIDGET_COMPONENTS.executive
  },
  {
    id: 'dashboard-customer',
    name: 'Análisis Cliente',
    icon: '👥',
    description: 'Métricas de comportamiento de cliente',
    category: 'dashboards',
    minWidth: 3,
    minHeight: 2,
    maxWidth: 8,
    maxHeight: 6,
    component: WIDGET_COMPONENTS.customer
  },
  {
    id: 'dashboard-predictive',
    name: 'Predicciones IA',
    icon: '🔮',
    description: 'Recomendaciones y predicciones',
    category: 'dashboards',
    minWidth: 3,
    minHeight: 3,
    maxWidth: 8,
    maxHeight: 6,
    component: WIDGET_COMPONENTS.predictive
  },

  // Utilidades
  {
    id: 'text-notes',
    name: 'Notas',
    icon: '📝',
    description: 'Widget de texto personalizable',
    category: 'utils',
    minWidth: 2,
    minHeight: 2,
    maxWidth: 8,
    maxHeight: 6,
    component: WIDGET_COMPONENTS.text,
    defaultProps: {
      title: 'Notas',
      content: 'Escribe tus notas aquí...'
    }
  }
]

// Agrupar widgets por categoría
export const WIDGET_CATEGORIES = {
  kpis: {
    name: 'KPIs',
    icon: '📊',
    widgets: WIDGET_DEFINITIONS.filter(w => w.category === 'kpis')
  },
  charts: {
    name: 'Gráficos',
    icon: '📈',
    widgets: WIDGET_DEFINITIONS.filter(w => w.category === 'charts')
  },
  dashboards: {
    name: 'Dashboards',
    icon: '🎛️',
    widgets: WIDGET_DEFINITIONS.filter(w => w.category === 'dashboards')
  },
  utils: {
    name: 'Utilidades',
    icon: '🔧',
    widgets: WIDGET_DEFINITIONS.filter(w => w.category === 'utils')
  }
}

// Función para obtener definición de widget por ID
export function getWidgetDefinition(widgetId: string): WidgetDefinition | undefined {
  return WIDGET_DEFINITIONS.find(w => w.id === widgetId)
}

// Función para crear widget con tamaño por defecto
export function createDefaultWidget(widgetId: string) {
  const definition = getWidgetDefinition(widgetId)
  if (!definition) return null

  return {
    id: `${widgetId}-${Date.now()}`,
    x: 0,
    y: 0,
    width: definition.minWidth,
    height: definition.minHeight,
    widgetType: widgetId,
    widgetProps: definition.defaultProps || {}
  }
}