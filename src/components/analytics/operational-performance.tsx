'use client'

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { ChartContainer, ChartDataPoint } from '@/components/ui/chart-container'

interface OperationalPerformanceProps {
  className?: string
}

export function OperationalPerformance({ className = '' }: OperationalPerformanceProps) {
  const { theme } = useTheme()
  const [selectedView, setSelectedView] = useState<'overview' | 'inventory' | 'quality' | 'efficiency'>('overview')

  // Datos de rotación de inventario
  const inventoryTurnoverData: ChartDataPoint[] = [
    { label: 'Guantes', value: 8.2, category: 'protección' },
    { label: 'Rashguards', value: 6.7, category: 'ropa' },
    { label: 'Shorts', value: 7.4, category: 'ropa' },
    { label: 'Protectores', value: 4.8, category: 'protección' },
    { label: 'Accesorios', value: 12.3, category: 'accesorios' },
    { label: 'Calzado', value: 3.9, category: 'calzado' }
  ]

  // Eficiencia de procesos
  const processEfficiencyData: ChartDataPoint[] = [
    { label: 'Recepción', value: 94.2 },
    { label: 'Almacenaje', value: 87.8 },
    { label: 'Picking', value: 91.5 },
    { label: 'Empaque', value: 96.3 },
    { label: 'Envío', value: 89.7 },
    { label: 'Entrega', value: 85.4 }
  ]

  // Análisis de márgenes por categoría
  const marginAnalysisData: ChartDataPoint[] = [
    { label: 'Protección Premium', value: 45.8, x: 324580, y: 45.8 },
    { label: 'Ropa Técnica', value: 38.2, x: 289340, y: 38.2 },
    { label: 'Accesorios', value: 52.1, x: 156920, y: 52.1 },
    { label: 'Calzado', value: 28.7, x: 198450, y: 28.7 },
    { label: 'Suplementos', value: 62.3, x: 89760, y: 62.3 }
  ]

  // Indicadores de calidad
  const qualityIndicatorsData: ChartDataPoint[] = [
    { label: 'Defectos', value: 2.1 },
    { label: 'Devoluciones', value: 3.4 },
    { label: 'Reclamaciones', value: 1.8 },
    { label: 'Satisfacción', value: 4.7 },
    { label: 'Recompras', value: 68.3 }
  ]

  // Tiempo de ciclo de pedidos
  const orderCycleData: ChartDataPoint[] = [
    { label: 'Procesamiento', value: 0.8 },
    { label: 'Preparación', value: 1.2 },
    { label: 'Empaque', value: 0.5 },
    { label: 'Envío', value: 2.3 },
    { label: 'Entrega', value: 24.0 }
  ]

  // Utilización de recursos
  const resourceUtilizationData: ChartDataPoint[] = [
    { label: 'Personal', value: 78.5 },
    { label: 'Almacén', value: 82.3 },
    { label: 'Equipos', value: 91.7 },
    { label: 'Transporte', value: 74.2 }
  ]

  // Costos operativos
  const operationalCostsData: ChartDataPoint[] = [
    { label: 'Personal', value: 342580 },
    { label: 'Almacén', value: 198340 },
    { label: 'Transporte', value: 156720 },
    { label: 'Tecnología', value: 89450 },
    { label: 'Servicios', value: 67890 },
    { label: 'Otros', value: 45320 }
  ]

  const views = [
    { key: 'overview', label: 'Resumen' },
    { key: 'inventory', label: 'Inventario' },
    { key: 'quality', label: 'Calidad' },
    { key: 'efficiency', label: 'Eficiencia' }
  ]

  // KPIs operacionales
  const renderOperationalKPIs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        {
          kpi: 'Rotación Inventario',
          value: '7.2x',
          change: '+0.8x',
          target: '8.0x',
          icon: '📦',
          status: 'good'
        },
        {
          kpi: 'Tiempo Ciclo',
          value: '28.8h',
          change: '-3.2h',
          target: '24h',
          icon: '⏱️',
          status: 'warning'
        },
        {
          kpi: 'Eficiencia Global',
          value: '91.2%',
          change: '+2.3%',
          target: '95%',
          icon: '⚡',
          status: 'good'
        },
        {
          kpi: 'Tasa Defectos',
          value: '2.1%',
          change: '-0.4%',
          target: '<2%',
          icon: '✅',
          status: 'warning'
        }
      ].map((kpi, index) => (
        <Card key={index} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {kpi.kpi}
              </CardTitle>
              <span className="text-xl">{kpi.icon}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold mb-1" style={{ color: theme.colors.textPrimary }}>
              {kpi.value}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ 
                color: kpi.change.startsWith('+') ? theme.colors.success : 
                       kpi.change.startsWith('-') && kpi.kpi.includes('Defectos') ? theme.colors.success :
                       kpi.change.startsWith('-') ? theme.colors.error : theme.colors.warning
              }}>
                {kpi.change}
              </span>
              <span style={{ color: theme.colors.textTertiary }}>
                Meta: {kpi.target}
              </span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${
                    kpi.status === 'good' ? 'bg-green-500' :
                    kpi.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: kpi.status === 'good' ? '85%' : kpi.status === 'warning' ? '65%' : '45%' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con filtros de vista */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
            ⚙️ Rendimiento Operacional
          </h2>
          <Text style={{ color: theme.colors.textSecondary }}>
            Control de rotación de inventario, eficiencia de procesos, márgenes y calidad
          </Text>
        </div>
        <div className="flex gap-2">
          {views.map((view) => (
            <Button
              key={view.key}
              variant={selectedView === view.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView(view.key as any)}
              style={{
                backgroundColor: selectedView === view.key ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.border,
                color: selectedView === view.key ? theme.colors.textInverse : theme.colors.textSecondary
              }}
            >
              {view.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPIs Operacionales */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
          Indicadores Clave de Rendimiento
        </h3>
        {renderOperationalKPIs()}
      </div>

      {/* Rotación de Inventario y Eficiencia de Procesos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rotación de Inventario */}
        <ChartContainer
          title="📦 Rotación de Inventario"
          description="Veces que rota el inventario por categoría anualmente"
          data={inventoryTurnoverData}
          defaultChartType="bar"
          availableTypes={['bar', 'radar', 'line']}
          height={300}
          showLegend={true}
          animated={true}
        />

        {/* Eficiencia de Procesos */}
        <ChartContainer
          title="⚡ Eficiencia de Procesos"
          description="Porcentaje de eficiencia en cada etapa operativa"
          data={processEfficiencyData}
          defaultChartType="radar"
          availableTypes={['radar', 'bar', 'line']}
          height={300}
          showLegend={false}
          animated={true}
        />
      </div>

      {/* Análisis de Márgenes y Calidad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Márgenes por Categoría */}
        <ChartContainer
          title="💰 Análisis de Márgenes"
          description="Ingresos vs margen de beneficio por categoría"
          data={marginAnalysisData}
          defaultChartType="scatter"
          availableTypes={['scatter', 'bar', 'pie']}
          height={300}
          showLegend={true}
          animated={true}
        />

        {/* Indicadores de Calidad */}
        <ChartContainer
          title="✅ Indicadores de Calidad"
          description="Métricas clave de calidad y satisfacción"
          data={qualityIndicatorsData}
          defaultChartType="radar"
          availableTypes={['radar', 'bar', 'line']}
          height={300}
          showLegend={false}
          animated={true}
        />
      </div>

      {/* Tiempo de Ciclo y Utilización */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tiempo de Ciclo de Pedidos */}
        <ChartContainer
          title="⏱️ Tiempo de Ciclo"
          description="Tiempo promedio en horas por etapa del pedido"
          data={orderCycleData}
          defaultChartType="bar"
          availableTypes={['bar', 'pie', 'area']}
          height={300}
          showLegend={false}
          animated={true}
        />

        {/* Utilización de Recursos */}
        <ChartContainer
          title="📊 Utilización de Recursos"
          description="Porcentaje de utilización de recursos disponibles"
          data={resourceUtilizationData}
          defaultChartType="donut"
          availableTypes={['donut', 'pie', 'bar']}
          height={300}
          showLegend={true}
          animated={true}
        />
      </div>

      {/* Análisis de Costos Operativos */}
      <ChartContainer
        title="💸 Costos Operativos"
        description="Distribución de costos operativos por categoría (€)"
        data={operationalCostsData}
        defaultChartType="pie"
        availableTypes={['pie', 'donut', 'bar']}
        height={350}
        showLegend={true}
        animated={true}
      />

      {/* Detalle por Almacén */}
      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardHeader>
          <CardTitle style={{ color: theme.colors.textPrimary }}>
            🏭 Rendimiento por Almacén
          </CardTitle>
          <CardDescription style={{ color: theme.colors.textSecondary }}>
            Comparativa de eficiencia entre diferentes instalaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                warehouse: 'Almacén Madrid',
                efficiency: 94.2,
                throughput: '1,247 pedidos/día',
                accuracy: '99.1%',
                cost: '€2.34/pedido',
                utilization: '87.5%',
                status: 'excellent'
              },
              {
                warehouse: 'Almacén Barcelona',
                efficiency: 89.7,
                throughput: '892 pedidos/día',
                accuracy: '98.6%',
                cost: '€2.67/pedido',
                utilization: '82.3%',
                status: 'good'
              },
              {
                warehouse: 'Almacén Valencia',
                efficiency: 76.3,
                throughput: '456 pedidos/día',
                accuracy: '97.2%',
                cost: '€3.12/pedido',
                utilization: '68.9%',
                status: 'needs-improvement'
              }
            ].map((warehouse, index) => (
              <div key={index} className="p-4 rounded-lg border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-4 h-4 rounded-full ${
                    warehouse.status === 'excellent' ? 'bg-green-500' :
                    warehouse.status === 'good' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}></div>
                  <h4 className="font-semibold" style={{ color: theme.colors.textPrimary }}>{warehouse.warehouse}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <Text style={{ color: theme.colors.textSecondary }}>Eficiencia:</Text>
                    <Text style={{ color: theme.colors.textPrimary }}>{warehouse.efficiency}%</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text style={{ color: theme.colors.textSecondary }}>Throughput:</Text>
                    <Text style={{ color: theme.colors.textPrimary }}>{warehouse.throughput}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text style={{ color: theme.colors.textSecondary }}>Precisión:</Text>
                    <Text style={{ color: theme.colors.success }}>{warehouse.accuracy}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text style={{ color: theme.colors.textSecondary }}>Costo/pedido:</Text>
                    <Text style={{ color: theme.colors.textPrimary }}>{warehouse.cost}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text style={{ color: theme.colors.textSecondary }}>Utilización:</Text>
                    <Text style={{ color: theme.colors.textPrimary }}>{warehouse.utilization}</Text>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t" style={{ borderColor: theme.colors.border }}>
                  <div className="flex justify-between items-center">
                    <Text className="text-xs" style={{ color: theme.colors.textTertiary }}>
                      Estado general
                    </Text>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      warehouse.status === 'excellent' ? 'bg-green-100 text-green-800' :
                      warehouse.status === 'good' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {warehouse.status === 'excellent' ? 'Excelente' :
                       warehouse.status === 'good' ? 'Bueno' : 'Mejorar'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimizaciones y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle style={{ color: theme.colors.textPrimary }}>
              🎯 Oportunidades de Optimización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  icon: '📦',
                  title: 'Optimizar Stock Calzado',
                  description: 'Rotación baja (3.9x). Ajustar niveles de inventario.',
                  impact: 'Alto',
                  effort: 'Medio',
                  savings: '€23K/año'
                },
                {
                  icon: '⏱️',
                  title: 'Reducir Tiempo Entrega',
                  description: 'Entrega promedio 24h. Meta: 18h mediante optimización rutas.',
                  impact: 'Alto',
                  effort: 'Alto',
                  savings: '€15K/año'
                },
                {
                  icon: '🏭',
                  title: 'Mejorar Almacén Valencia',
                  description: 'Eficiencia 76.3% vs 94.2% Madrid. Capacitación y proceso.',
                  impact: 'Medio',
                  effort: 'Alto',
                  savings: '€18K/año'
                },
                {
                  icon: '📊',
                  title: 'Automatizar Picking',
                  description: 'Implementar WMS avanzado para aumentar precisión.',
                  impact: 'Alto',
                  effort: 'Alto',
                  savings: '€45K/año'
                }
              ].map((opp, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <span className="text-2xl">{opp.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm" style={{ color: theme.colors.textPrimary }}>
                        {opp.title}
                      </h4>
                      <span className="text-xs font-medium text-green-600">
                        {opp.savings}
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>
                      {opp.description}
                    </p>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opp.impact === 'Alto' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        Impacto: {opp.impact}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opp.effort === 'Alto' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        Esfuerzo: {opp.effort}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle style={{ color: theme.colors.textPrimary }}>
              🚨 Alertas Operacionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  type: 'error',
                  title: 'Stock Crítico Detectado',
                  description: '8 productos por debajo del punto de reorden.',
                  time: 'Hace 15 min',
                  action: 'Generar OC'
                },
                {
                  type: 'warning',
                  title: 'Demora en Proceso',
                  description: 'Almacén Valencia: 23% de pedidos con retraso.',
                  time: 'Hace 1 hora',
                  action: 'Investigar'
                },
                {
                  type: 'info',
                  title: 'Pico de Demanda',
                  description: 'Aumento 34% en pedidos de guantes hoy.',
                  time: 'Hace 2 horas',
                  action: 'Ajustar Stock'
                },
                {
                  type: 'success',
                  title: 'Meta Alcanzada',
                  description: 'Eficiencia global superó 90% este mes.',
                  time: 'Hace 4 horas',
                  action: 'Revisar'
                }
              ].map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border" style={{ 
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border
                }}>
                  <div className={`w-3 h-3 rounded-full mt-1 ${
                    alert.type === 'error' ? 'bg-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-500' :
                    alert.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm" style={{ color: theme.colors.textPrimary }}>
                        {alert.title}
                      </h4>
                      <Text className="text-xs" style={{ color: theme.colors.textTertiary }}>
                        {alert.time}
                      </Text>
                    </div>
                    <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>
                      {alert.description}
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
      </div>
    </div>
  )
}