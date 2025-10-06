'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { ChartContainer, ChartDataPoint } from '@/components/ui/chart-container'

interface ExecutiveDashboardProps {
  className?: string
}

export function ExecutiveDashboard({ className = '' }: ExecutiveDashboardProps) {
  const { theme } = useTheme()

  // Datos para KPIs principales
  const kpis = [
    {
      title: 'Ingresos Totales',
      value: '€847,250',
      change: '+18.2%',
      trend: 'up' as const,
      icon: '💰',
      description: 'vs mes anterior'
    },
    {
      title: 'Crecimiento Mensual',
      value: '12.4%',
      change: '+3.1%',
      trend: 'up' as const,
      icon: '📈',
      description: 'tasa mensual'
    },
    {
      title: 'Margen de Beneficio',
      value: '31.7%',
      change: '+2.3%',
      trend: 'up' as const,
      icon: '💎',
      description: 'margen neto'
    },
    {
      title: 'Satisfacción Cliente',
      value: '4.8/5.0',
      change: '+0.2',
      trend: 'up' as const,
      icon: '⭐',
      description: 'puntuación media'
    }
  ]

  // Datos para gráfico de tendencias de ingresos
  const revenueData: ChartDataPoint[] = [
    { label: 'Enero', value: 65420 },
    { label: 'Febrero', value: 72180 },
    { label: 'Marzo', value: 89350 },
    { label: 'Abril', value: 76280 },
    { label: 'Mayo', value: 91740 },
    { label: 'Junio', value: 105260 },
    { label: 'Julio', value: 118450 },
    { label: 'Agosto', value: 129870 },
    { label: 'Septiembre', value: 142350 },
    { label: 'Octubre', value: 156780 },
    { label: 'Noviembre', value: 171240 },
    { label: 'Diciembre', value: 189650 }
  ]

  // Datos para distribución por canales de venta
  const channelsData: ChartDataPoint[] = [
    { label: 'E-commerce', value: 45.8 },
    { label: 'Tienda Física', value: 28.3 },
    { label: 'Distribuidores', value: 18.7 },
    { label: 'Amazon', value: 7.2 }
  ]

  // Datos comparativos con competencia
  const competitiveData: ChartDataPoint[] = [
    { label: 'BRUMA', value: 847250, category: 'nosotros' },
    { label: 'Competidor A', value: 654320, category: 'competencia' },
    { label: 'Competidor B', value: 589750, category: 'competencia' },
    { label: 'Competidor C', value: 423180, category: 'competencia' },
    { label: 'Promedio Sector', value: 578650, category: 'sector' }
  ]

  // Datos de métricas operacionales
  const operationalData: ChartDataPoint[] = [
    { label: 'Eficiencia', value: 87, x: 87, y: 92 },
    { label: 'Calidad', value: 94, x: 94, y: 96 },
    { label: 'Velocidad', value: 78, x: 78, y: 85 },
    { label: 'Satisfacción', value: 91, x: 91, y: 89 },
    { label: 'Innovación', value: 83, x: 83, y: 88 }
  ]

  // Alertas críticas
  const alerts = [
    {
      type: 'success',
      title: 'Meta Superada',
      message: 'Ingresos trimestrales superan objetivo en 18%',
      priority: 'alta',
      action: 'Ver Detalles'
    },
    {
      type: 'warning',
      title: 'Inventario Crítico',
      message: '12 productos con stock inferior a mínimo',
      priority: 'media',
      action: 'Gestionar Stock'
    },
    {
      type: 'info',
      title: 'Nueva Oportunidad',
      message: 'Mercado europeo muestra 25% crecimiento',
      priority: 'media',
      action: 'Analizar'
    },
    {
      type: 'error',
      title: 'Problema de Calidad',
      message: 'Incremento 3% en devoluciones último mes',
      priority: 'alta',
      action: 'Investigar'
    }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
            📊 Dashboard Ejecutivo
          </h2>
          <Text style={{ color: theme.colors.textSecondary }}>
            Visión general del rendimiento empresarial y métricas clave de negocio
          </Text>
        </div>
        <div className="text-right">
          <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>
            Período: Últimos 12 meses
          </Text>
          <Text className="text-xs" style={{ color: theme.colors.textTertiary }}>
            Actualizado: {new Date().toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  {kpi.title}
                </CardTitle>
                <span className="text-2xl">{kpi.icon}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1" style={{ color: theme.colors.textPrimary }}>
                {kpi.value}
              </div>
              <div className="flex items-center justify-between">
                <span 
                  className={`text-xs font-medium ${
                    kpi.trend === 'up' ? 'text-green-500' : 
                    kpi.trend === 'down' ? 'text-red-500' : 'text-yellow-500'
                  }`}
                >
                  {kpi.trend === 'up' ? '↗' : kpi.trend === 'down' ? '↘' : '→'} {kpi.change}
                </span>
                <span className="text-xs" style={{ color: theme.colors.textTertiary }}>
                  {kpi.description}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencias de Ingresos */}
        <ChartContainer
          title="Evolución de Ingresos 2024"
          description="Crecimiento mensual de ingresos totales"
          data={revenueData}
          defaultChartType="area"
          availableTypes={['area', 'line', 'bar']}
          height={300}
          showLegend={false}
          animated={true}
        />

        {/* Canales de Venta */}
        <ChartContainer
          title="Distribución por Canales"
          description="Participación de cada canal en ventas totales"
          data={channelsData}
          defaultChartType="donut"
          availableTypes={['donut', 'pie', 'bar']}
          height={300}
          showLegend={true}
          animated={true}
        />
      </div>

      {/* Análisis Competitivo y Métricas Operacionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posición Competitiva */}
        <ChartContainer
          title="Análisis Competitivo"
          description="Comparación de ingresos con competidores principales"
          data={competitiveData}
          defaultChartType="bar"
          availableTypes={['bar', 'line', 'radar']}
          height={300}
          showLegend={true}
          animated={true}
        />

        {/* Métricas Operacionales */}
        <ChartContainer
          title="Rendimiento Operacional"
          description="Indicadores clave de desempeño organizacional"
          data={operationalData}
          defaultChartType="radar"
          availableTypes={['radar', 'scatter', 'bar']}
          height={300}
          showLegend={false}
          animated={true}
        />
      </div>

      {/* Alertas y Notificaciones Críticas */}
      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardHeader>
          <CardTitle style={{ color: theme.colors.textPrimary }}>
            🚨 Alertas Ejecutivas
          </CardTitle>
          <CardDescription style={{ color: theme.colors.textSecondary }}>
            Notificaciones críticas que requieren atención inmediata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert, index) => (
              <div 
                key={index} 
                className="flex items-start space-x-3 p-4 rounded-lg border"
                style={{ 
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border
                }}
              >
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  alert.type === 'success' ? 'bg-green-500' :
                  alert.type === 'warning' ? 'bg-yellow-500' :
                  alert.type === 'info' ? 'bg-blue-500' :
                  'bg-red-500'
                }`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm" style={{ color: theme.colors.textPrimary }}>
                      {alert.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.priority === 'alta' ? 'bg-red-100 text-red-800' :
                      alert.priority === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm mb-3" style={{ color: theme.colors.textSecondary }}>
                    {alert.message}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    style={{ borderColor: theme.colors.border }}
                  >
                    {alert.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumen Financiero Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: theme.colors.textPrimary }}>
              💰 Resumen Financiero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text style={{ color: theme.colors.textSecondary }}>Ingresos Brutos:</Text>
                <Text className="font-semibold" style={{ color: theme.colors.success }}>€847,250</Text>
              </div>
              <div className="flex justify-between">
                <Text style={{ color: theme.colors.textSecondary }}>Costos Operativos:</Text>
                <Text className="font-semibold" style={{ color: theme.colors.error }}>€578,340</Text>
              </div>
              <div className="flex justify-between border-t pt-2" style={{ borderColor: theme.colors.border }}>
                <Text className="font-medium" style={{ color: theme.colors.textPrimary }}>Beneficio Neto:</Text>
                <Text className="font-bold text-lg" style={{ color: theme.colors.success }}>€268,910</Text>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: theme.colors.textPrimary }}>
              🎯 Objetivos del Trimestre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Ingresos', current: 847250, target: 900000, unit: '€' },
                { name: 'Clientes', current: 1247, target: 1500, unit: '' },
                { name: 'Satisfacción', current: 4.8, target: 4.9, unit: '/5' }
              ].map((goal, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <Text style={{ color: theme.colors.textSecondary }}>{goal.name}:</Text>
                    <Text style={{ color: theme.colors.textPrimary }}>
                      {goal.unit === '€' ? `${goal.unit}${goal.current.toLocaleString()}` : `${goal.current}${goal.unit}`} / {goal.unit === '€' ? `${goal.unit}${goal.target.toLocaleString()}` : `${goal.target}${goal.unit}`}
                    </Text>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                      style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: theme.colors.textPrimary }}>
              🚀 Acciones Recomendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: 'Expandir inventario productos estrella', priority: 'Alta' },
                { action: 'Optimizar costos de distribución', priority: 'Media' },
                { action: 'Lanzar campaña marketing digital', priority: 'Alta' },
                { action: 'Revisar precios productos premium', priority: 'Media' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: theme.colors.background }}>
                  <Text className="text-sm flex-1" style={{ color: theme.colors.textPrimary }}>
                    {item.action}
                  </Text>
                  <span className={`px-2 py-1 rounded text-xs font-medium ml-2 ${
                    item.priority === 'Alta' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}