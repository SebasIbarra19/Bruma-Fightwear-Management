'use client'

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { ChartContainer, ChartDataPoint } from '@/components/ui/chart-container'

interface CustomerBehaviorProps {
  className?: string
}

export function CustomerBehavior({ className = '' }: CustomerBehaviorProps) {
  const { theme } = useTheme()
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'vip' | 'regular' | 'new'>('all')

  // Datos de Customer Lifetime Value (CLV)
  const clvData: ChartDataPoint[] = [
    { label: 'VIP', value: 2450, category: 'vip' },
    { label: 'Premium', value: 1680, category: 'premium' },
    { label: 'Regular', value: 890, category: 'regular' },
    { label: 'Nuevo', value: 320, category: 'new' }
  ]

  // Análisis de cohortes (retención por mes)
  const cohortData: ChartDataPoint[] = [
    { label: 'Mes 1', value: 100 },
    { label: 'Mes 2', value: 85 },
    { label: 'Mes 3', value: 72 },
    { label: 'Mes 4', value: 64 },
    { label: 'Mes 5', value: 58 },
    { label: 'Mes 6', value: 53 },
    { label: 'Mes 12', value: 41 }
  ]

  // Frecuencia de compra
  const purchaseFrequencyData: ChartDataPoint[] = [
    { label: '1 vez', value: 45.2 },
    { label: '2-3 veces', value: 28.7 },
    { label: '4-6 veces', value: 16.3 },
    { label: '7-10 veces', value: 7.1 },
    { label: '10+ veces', value: 2.7 }
  ]

  // Análisis RFM (Recency, Frequency, Monetary)
  const rfmData: ChartDataPoint[] = [
    { label: 'Champions', value: 156, x: 95, y: 92 },
    { label: 'Loyal Customers', value: 342, x: 87, y: 78 },
    { label: 'Potential Loyalists', value: 198, x: 76, y: 65 },
    { label: 'Recent Customers', value: 267, x: 92, y: 45 },
    { label: 'At Risk', value: 89, x: 34, y: 72 },
    { label: 'Cannot Lose Them', value: 45, x: 28, y: 89 }
  ]

  // Patrones de actividad por hora
  const activityData: ChartDataPoint[] = Array.from({ length: 24 }, (_, hour) => ({
    label: `${hour}:00`,
    value: Math.sin((hour - 6) * 0.3) * 40 + 50 + Math.random() * 20
  }))

  // Preferencias de canal por segmento
  const channelPreferenceData: ChartDataPoint[] = [
    { label: 'E-commerce', value: 52.3, category: 'online' },
    { label: 'Tienda Física', value: 31.7, category: 'offline' },
    { label: 'Mobile App', value: 16.0, category: 'mobile' }
  ]

  // Evolución del valor promedio de pedido
  const avgOrderValueData: ChartDataPoint[] = [
    { label: 'Ene', value: 78.50 },
    { label: 'Feb', value: 82.30 },
    { label: 'Mar', value: 87.90 },
    { label: 'Abr', value: 84.20 },
    { label: 'May', value: 91.60 },
    { label: 'Jun', value: 95.80 }
  ]

  // Satisfacción por touchpoint
  const satisfactionData: ChartDataPoint[] = [
    { label: 'Producto', value: 4.7 },
    { label: 'Servicio', value: 4.3 },
    { label: 'Entrega', value: 4.5 },
    { label: 'Web/App', value: 4.1 },
    { label: 'Soporte', value: 4.6 }
  ]

  const segments = [
    { key: 'all', label: 'Todos' },
    { key: 'vip', label: 'VIP' },
    { key: 'regular', label: 'Regulares' },
    { key: 'new', label: 'Nuevos' }
  ]

  // Métricas de retención
  const renderRetentionMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[
        { 
          metric: 'Tasa de Retención',
          value: '68.3%',
          change: '+5.2%',
          period: 'vs mes anterior',
          icon: '🔄'
        },
        {
          metric: 'Tiempo de Vida',
          value: '18.4 meses',
          change: '+2.1 meses',
          period: 'promedio',
          icon: '⏰'
        },
        {
          metric: 'Frecuencia Compra',
          value: '3.7 veces',
          change: '+0.4',
          period: 'por cliente/año',
          icon: '🛒'
        },
        {
          metric: 'CLV Promedio',
          value: '€1,247',
          change: '+€156',
          period: 'valor vida',
          icon: '💎'
        }
      ].map((metric, index) => (
        <Card key={index} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {metric.metric}
              </CardTitle>
              <span className="text-xl">{metric.icon}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold mb-1" style={{ color: theme.colors.textPrimary }}>
              {metric.value}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: theme.colors.success }}>{metric.change}</span>
              <span style={{ color: theme.colors.textTertiary }}>{metric.period}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con filtros de segmento */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
            👥 Comportamiento de Clientes
          </h2>
          <Text style={{ color: theme.colors.textSecondary }}>
            Análisis profundo de CLV, cohortes, frecuencia de compra y patrones RFM
          </Text>
        </div>
        <div className="flex gap-2">
          {segments.map((segment) => (
            <Button
              key={segment.key}
              variant={selectedSegment === segment.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSegment(segment.key as any)}
              style={{
                backgroundColor: selectedSegment === segment.key ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.border,
                color: selectedSegment === segment.key ? theme.colors.textInverse : theme.colors.textSecondary
              }}
            >
              {segment.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Métricas de Retención */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
          Métricas de Retención y Fidelización
        </h3>
        {renderRetentionMetrics()}
      </div>

      {/* CLV y Análisis de Cohortes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Lifetime Value */}
        <ChartContainer
          title="💰 Customer Lifetime Value"
          description="Valor de vida promedio por segmento de cliente"
          data={clvData}
          defaultChartType="bar"
          availableTypes={['bar', 'donut', 'radar']}
          height={300}
          showLegend={true}
          animated={true}
        />

        {/* Análisis de Cohortes */}
        <ChartContainer
          title="📊 Retención por Cohortes"
          description="Porcentaje de clientes que regresan mes a mes"
          data={cohortData}
          defaultChartType="line"
          availableTypes={['line', 'area', 'bar']}
          height={300}
          showLegend={false}
          animated={true}
        />
      </div>

      {/* Frecuencia de Compra y RFM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frecuencia de Compra */}
        <ChartContainer
          title="🔄 Frecuencia de Compra"
          description="Distribución de clientes por número de compras"
          data={purchaseFrequencyData}
          defaultChartType="donut"
          availableTypes={['donut', 'pie', 'bar']}
          height={300}
          showLegend={true}
          animated={true}
        />

        {/* Análisis RFM */}
        <ChartContainer
          title="🎯 Análisis RFM"
          description="Segmentación por Recencia, Frecuencia y Valor Monetario"
          data={rfmData}
          defaultChartType="scatter"
          availableTypes={['scatter', 'radar', 'bar']}
          height={300}
          showLegend={true}
          animated={true}
        />
      </div>

      {/* Patrones de Actividad y Canales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad por Horas */}
        <ChartContainer
          title="⏰ Actividad por Horas"
          description="Patrón de actividad de clientes durante el día"
          data={activityData}
          defaultChartType="area"
          availableTypes={['area', 'line', 'bar']}
          height={300}
          showLegend={false}
          animated={true}
        />

        {/* Preferencias de Canal */}
        <ChartContainer
          title="📱 Preferencias de Canal"
          description="Distribución de interacciones por canal"
          data={channelPreferenceData}
          defaultChartType="pie"
          availableTypes={['pie', 'donut', 'bar']}
          height={300}
          showLegend={true}
          animated={true}
        />
      </div>

      {/* AOV y Satisfacción */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Valor Promedio de Pedido */}
        <ChartContainer
          title="💳 Valor Promedio de Pedido"
          description="Evolución del ticket promedio mensual"
          data={avgOrderValueData}
          defaultChartType="line"
          availableTypes={['line', 'area', 'bar']}
          height={300}
          showLegend={false}
          animated={true}
        />

        {/* Satisfacción por Touchpoint */}
        <ChartContainer
          title="⭐ Satisfacción por Touchpoint"
          description="Puntuación de satisfacción en diferentes puntos de contacto"
          data={satisfactionData}
          defaultChartType="radar"
          availableTypes={['radar', 'bar', 'line']}
          height={300}
          showLegend={false}
          animated={true}
        />
      </div>

      {/* Matriz de Segmentación RFM Detallada */}
      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardHeader>
          <CardTitle style={{ color: theme.colors.textPrimary }}>
            🏆 Matriz de Segmentación RFM
          </CardTitle>
          <CardDescription style={{ color: theme.colors.textSecondary }}>
            Análisis detallado de segmentos de clientes basado en comportamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                segment: 'Champions',
                count: 156,
                percentage: 12.5,
                clv: '€2,450',
                frequency: '8.2 veces/año',
                recency: '5 días',
                strategy: 'Programa VIP exclusivo',
                color: theme.colors.success
              },
              {
                segment: 'Loyal Customers',
                count: 342,
                percentage: 27.4,
                clv: '€1,680',
                frequency: '5.4 veces/año',
                recency: '12 días',
                strategy: 'Cross-selling premium',
                color: theme.colors.primary
              },
              {
                segment: 'Potential Loyalists',
                count: 198,
                percentage: 15.9,
                clv: '€890',
                frequency: '3.1 veces/año',
                recency: '25 días',
                strategy: 'Programa fidelización',
                color: theme.colors.warning
              },
              {
                segment: 'Recent Customers',
                count: 267,
                percentage: 21.4,
                clv: '€320',
                frequency: '1.2 veces/año',
                recency: '8 días',
                strategy: 'Onboarding personalizado',
                color: '#8B5CF6'
              },
              {
                segment: 'At Risk',
                count: 89,
                percentage: 7.1,
                clv: '€1,240',
                frequency: '4.8 veces/año',
                recency: '67 días',
                strategy: 'Campaña reactivación',
                color: theme.colors.error
              },
              {
                segment: 'Cannot Lose Them',
                count: 45,
                percentage: 3.6,
                clv: '€3,180',
                frequency: '7.9 veces/año',
                recency: '89 días',
                strategy: 'Atención personalizada',
                color: '#DC2626'
              }
            ].map((seg, index) => (
              <div key={index} className="p-4 rounded-lg border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: seg.color }}></div>
                  <h4 className="font-semibold" style={{ color: theme.colors.textPrimary }}>{seg.segment}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <Text style={{ color: theme.colors.textSecondary }}>Clientes:</Text>
                    <Text style={{ color: theme.colors.textPrimary }}>{seg.count} ({seg.percentage}%)</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text style={{ color: theme.colors.textSecondary }}>CLV:</Text>
                    <Text style={{ color: theme.colors.textPrimary }}>{seg.clv}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text style={{ color: theme.colors.textSecondary }}>Frecuencia:</Text>
                    <Text style={{ color: theme.colors.textPrimary }}>{seg.frequency}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text style={{ color: theme.colors.textSecondary }}>Recencia:</Text>
                    <Text style={{ color: theme.colors.textPrimary }}>{seg.recency}</Text>
                  </div>
                  <div className="mt-3 pt-2 border-t" style={{ borderColor: theme.colors.border }}>
                    <Text className="font-medium" style={{ color: seg.color }}>
                      {seg.strategy}
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights y Acciones Recomendadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle style={{ color: theme.colors.textPrimary }}>
              💡 Insights del Comportamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  icon: '🏆',
                  title: 'Champions Creciendo',
                  description: 'Los Champions aumentaron 23% este trimestre. Expandir beneficios VIP.',
                  impact: 'Alta'
                },
                {
                  icon: '⚠️',
                  title: 'Riesgo de Abandono',
                  description: '89 clientes valiosos en riesgo. Intervención inmediata necesaria.',
                  impact: 'Crítica'
                },
                {
                  icon: '📱',
                  title: 'Comportamiento Mobile',
                  description: 'El 67% de clientes jóvenes prefieren la app móvil.',
                  impact: 'Media'
                },
                {
                  icon: '⏰',
                  title: 'Pico de Actividad',
                  description: 'Mayor actividad entre 18:00-21:00. Optimizar campañas.',
                  impact: 'Media'
                }
              ].map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
                  <span className="text-2xl">{insight.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm" style={{ color: theme.colors.textPrimary }}>
                        {insight.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        insight.impact === 'Crítica' ? 'bg-red-100 text-red-800' :
                        insight.impact === 'Alta' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {insight.impact}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      {insight.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle style={{ color: theme.colors.textPrimary }}>
              🎯 Plan de Acción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  priority: 'Urgente',
                  action: 'Campaña reactivación clientes en riesgo',
                  kpi: 'Recuperar 65% At Risk',
                  deadline: '2 semanas'
                },
                {
                  priority: 'Alta',
                  action: 'Programa lealtad para Potential Loyalists',
                  kpi: 'Convertir 40% a Loyal',
                  deadline: '1 mes'
                },
                {
                  priority: 'Media',
                  action: 'Personalizar experiencia mobile',
                  kpi: '+15% engagement app',
                  deadline: '6 semanas'
                },
                {
                  priority: 'Media',
                  action: 'Optimizar horarios campañas email',
                  kpi: '+12% open rate',
                  deadline: '3 semanas'
                }
              ].map((action, index) => (
                <div key={index} className="p-3 rounded-lg border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      action.priority === 'Urgente' ? 'bg-red-100 text-red-800' :
                      action.priority === 'Alta' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {action.priority}
                    </span>
                    <Text className="text-xs" style={{ color: theme.colors.textTertiary }}>
                      {action.deadline}
                    </Text>
                  </div>
                  <Text className="text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                    {action.action}
                  </Text>
                  <Text className="text-xs" style={{ color: theme.colors.success }}>
                    Objetivo: {action.kpi}
                  </Text>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}