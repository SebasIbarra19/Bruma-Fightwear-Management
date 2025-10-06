'use client'

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { ChartContainer, ChartDataPoint } from '@/components/ui/chart-container'

interface SalesAnalysisProps {
  className?: string
}

export function SalesAnalysis({ className = '' }: SalesAnalysisProps) {
  const { theme } = useTheme()
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  // Datos del embudo de conversión
  const funnelData: ChartDataPoint[] = [
    { label: 'Visitantes', value: 10000 },
    { label: 'Interesados', value: 3500 },
    { label: 'Carrito', value: 1200 },
    { label: 'Checkout', value: 890 },
    { label: 'Compra', value: 720 }
  ]

  // Productos más rentables
  const topProductsData: ChartDataPoint[] = [
    { label: 'Guantes Boxeo Pro', value: 45680, category: 'protección' },
    { label: 'Rashguard Elite', value: 38420, category: 'ropa' },
    { label: 'Shorts MMA Competition', value: 32150, category: 'ropa' },
    { label: 'Vendas Profesionales', value: 28940, category: 'accesorios' },
    { label: 'Protector Bucal', value: 24780, category: 'protección' },
    { label: 'Casco Sparring', value: 22560, category: 'protección' }
  ]

  // Análisis estacional
  const seasonalData: ChartDataPoint[] = [
    { label: 'Q1 2024', value: 189250 },
    { label: 'Q2 2024', value: 245780 },
    { label: 'Q3 2024', value: 312450 },
    { label: 'Q4 2024 (Proj)', value: 425600 }
  ]

  // Distribución geográfica
  const geoData: ChartDataPoint[] = [
    { label: 'Madrid', value: 28.5 },
    { label: 'Barcelona', value: 22.3 },
    { label: 'Valencia', value: 15.7 },
    { label: 'Sevilla', value: 12.8 },
    { label: 'Bilbao', value: 9.2 },
    { label: 'Otros', value: 11.5 }
  ]

  // Análisis por canal de venta
  const channelPerformance: ChartDataPoint[] = [
    { label: 'E-commerce', value: 456780, x: 456780, y: 7.2 },
    { label: 'Tienda Física', value: 324560, x: 324560, y: 4.8 },
    { label: 'Amazon', value: 198450, x: 198450, y: 6.1 },
    { label: 'Distribuidores', value: 287340, x: 287340, y: 3.9 }
  ]

  // Métricas de conversión por fuente de tráfico
  const trafficSourceData: ChartDataPoint[] = [
    { label: 'Google Ads', value: 8.4 },
    { label: 'Facebook Ads', value: 6.7 },
    { label: 'Email Marketing', value: 12.3 },
    { label: 'SEO Orgánico', value: 4.2 },
    { label: 'Referencias', value: 9.8 },
    { label: 'Directo', value: 5.5 }
  ]

  // Análisis de tendencias por categoría
  const categoryTrendsData: ChartDataPoint[] = [
    { label: 'Ene', value: 45000, category: 'protección' },
    { label: 'Feb', value: 48500, category: 'protección' },
    { label: 'Mar', value: 52300, category: 'protección' },
    { label: 'Abr', value: 49800, category: 'protección' },
    { label: 'May', value: 55600, category: 'protección' },
    { label: 'Jun', value: 61200, category: 'protección' }
  ]

  const periods = [
    { key: '7d', label: '7 días' },
    { key: '30d', label: '30 días' }, 
    { key: '90d', label: '90 días' },
    { key: '1y', label: '1 año' }
  ]

  // Métricas de rendimiento por canal
  const renderChannelMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { channel: 'E-commerce', revenue: '€456,780', conversion: '7.2%', orders: 1247, growth: '+18%' },
        { channel: 'Tienda Física', revenue: '€324,560', conversion: '4.8%', orders: 892, growth: '+12%' },
        { channel: 'Amazon', revenue: '€198,450', conversion: '6.1%', orders: 567, growth: '+25%' },
        { channel: 'Distribuidores', revenue: '€287,340', conversion: '3.9%', orders: 743, growth: '+8%' }
      ].map((channel, index) => (
        <Card key={index} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {channel.channel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-lg font-bold" style={{ color: theme.colors.textPrimary }}>
                {channel.revenue}
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.colors.textSecondary }}>Conversión:</span>
                <span style={{ color: theme.colors.success }}>{channel.conversion}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.colors.textSecondary }}>Pedidos:</span>
                <span style={{ color: theme.colors.textPrimary }}>{channel.orders}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.colors.textSecondary }}>Crecimiento:</span>
                <span style={{ color: theme.colors.success }}>{channel.growth}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con filtros de período */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
            📈 Análisis de Ventas
          </h2>
          <Text style={{ color: theme.colors.textSecondary }}>
            Análisis detallado del embudo de conversión, productos rentables y tendencias de mercado
          </Text>
        </div>
        <div className="flex gap-2">
          {periods.map((period) => (
            <Button
              key={period.key}
              variant={selectedPeriod === period.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period.key as any)}
              style={{
                backgroundColor: selectedPeriod === period.key ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.border,
                color: selectedPeriod === period.key ? theme.colors.textInverse : theme.colors.textSecondary
              }}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Métricas por Canal */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
          Rendimiento por Canal de Venta
        </h3>
        {renderChannelMetrics()}
      </div>

      {/* Embudo de Conversión y Productos Top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Embudo de Conversión */}
        <ChartContainer
          title="🎯 Embudo de Conversión"
          description="Proceso completo desde visitante hasta compra"
          data={funnelData}
          defaultChartType="bar"
          availableTypes={['bar', 'area', 'line']}
          height={350}
          showLegend={false}
          animated={true}
        />

        {/* Productos Más Rentables */}
        <ChartContainer
          title="💎 Productos Más Rentables"
          description="Top 6 productos por ingresos generados"
          data={topProductsData}
          defaultChartType="bar"
          availableTypes={['bar', 'donut', 'pie']}
          height={350}
          showLegend={true}
          animated={true}
        />
      </div>

      {/* Análisis Estacional y Geográfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencias Estacionales */}
        <ChartContainer
          title="📅 Análisis Estacional"
          description="Evolución de ventas por trimestre 2024"
          data={seasonalData}
          defaultChartType="area"
          availableTypes={['area', 'line', 'bar']}
          height={300}
          showLegend={false}
          animated={true}
        />

        {/* Distribución Geográfica */}
        <ChartContainer
          title="🌍 Ventas por Región"
          description="Distribución geográfica de ventas en España"
          data={geoData}
          defaultChartType="donut"
          availableTypes={['donut', 'pie', 'bar']}
          height={300}
          showLegend={true}
          animated={true}
        />
      </div>

      {/* Análisis de Canales y Tráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rendimiento por Canal */}
        <ChartContainer
          title="📊 Canal vs Margen"
          description="Ingresos vs margen de beneficio por canal"
          data={channelPerformance}
          defaultChartType="scatter"
          availableTypes={['scatter', 'bar', 'line']}
          height={300}
          showLegend={true}
          animated={true}
        />

        {/* Conversión por Fuente de Tráfico */}
        <ChartContainer
          title="🎯 Conversión por Fuente"
          description="Tasa de conversión según origen del tráfico"
          data={trafficSourceData}
          defaultChartType="radar"
          availableTypes={['radar', 'bar', 'donut']}
          height={300}
          showLegend={false}
          animated={true}
        />
      </div>

      {/* Análisis Detallado por Categorías */}
      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardHeader>
          <CardTitle style={{ color: theme.colors.textPrimary }}>
            📦 Análisis por Categorías de Producto
          </CardTitle>
          <CardDescription style={{ color: theme.colors.textSecondary }}>
            Rendimiento detallado de cada categoría de productos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                category: 'Protección',
                revenue: '€324,580',
                units: 2847,
                margin: '34.2%',
                growth: '+22%',
                color: theme.colors.primary
              },
              {
                category: 'Ropa Deportiva', 
                revenue: '€289,340',
                units: 4156,
                margin: '28.7%',
                growth: '+18%',
                color: theme.colors.success
              },
              {
                category: 'Accesorios',
                revenue: '€156,920',
                units: 5628,
                margin: '42.1%',
                growth: '+31%',
                color: theme.colors.warning
              }
            ].map((cat, index) => (
              <div key={index} className="p-4 rounded-lg border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <h4 className="font-semibold" style={{ color: theme.colors.textPrimary }}>{cat.category}</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>Ingresos:</Text>
                    <Text className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>{cat.revenue}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>Unidades:</Text>
                    <Text className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>{cat.units.toLocaleString()}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>Margen:</Text>
                    <Text className="text-sm font-medium" style={{ color: theme.colors.success }}>{cat.margin}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>Crecimiento:</Text>
                    <Text className="text-sm font-medium" style={{ color: theme.colors.success }}>{cat.growth}</Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights y Recomendaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle style={{ color: theme.colors.textPrimary }}>
              💡 Insights Clave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  icon: '🎯',
                  title: 'Oportunidad de Conversión',
                  description: 'El 65% de visitantes abandonan en el paso de interés. Optimizar landing pages.',
                  impact: 'Alta'
                },
                {
                  icon: '📦',
                  title: 'Categoría Estrella',
                  description: 'Los accesorios tienen el mayor margen (42.1%) y crecimiento (+31%).',
                  impact: 'Media'
                },
                {
                  icon: '🌍',
                  title: 'Expansión Geográfica',
                  description: 'Madrid y Barcelona representan el 50.8% de las ventas totales.',
                  impact: 'Media'
                },
                {
                  icon: '📱',
                  title: 'Canal Digital',
                  description: 'E-commerce genera 45% más ingresos que tienda física.',
                  impact: 'Alta'
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
                        insight.impact === 'Alta' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
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
              🚀 Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  priority: 'Urgente',
                  action: 'Implementar abandono de carrito automatizado',
                  expected: '+15% conversión',
                  effort: 'Media'
                },
                {
                  priority: 'Alta',
                  action: 'Expandir línea de accesorios premium',
                  expected: '+€45K mensual',
                  effort: 'Alta'
                },
                {
                  priority: 'Media',
                  action: 'Campaña específica para Andalucía',
                  expected: '+12% regional',
                  effort: 'Baja'
                },
                {
                  priority: 'Media',
                  action: 'Optimizar SEO para productos estrella',
                  expected: '+8% orgánico',
                  effort: 'Media'
                }
              ].map((rec, index) => (
                <div key={index} className="p-3 rounded-lg border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'Urgente' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'Alta' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {rec.priority}
                    </span>
                    <Text className="text-xs" style={{ color: theme.colors.success }}>
                      {rec.expected}
                    </Text>
                  </div>
                  <Text className="text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                    {rec.action}
                  </Text>
                  <Text className="text-xs" style={{ color: theme.colors.textSecondary }}>
                    Esfuerzo: {rec.effort}
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