'use client'

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'

// Importar todos los componentes de análisis
import { ExecutiveDashboard } from '@/components/analytics/executive-dashboard'
import { SalesAnalysis } from '@/components/analytics/sales-analysis'
import { CustomerBehavior } from '@/components/analytics/customer-behavior'
import { OperationalPerformance } from '@/components/analytics/operational-performance'
import { PredictiveAnalysis } from '@/components/analytics/predictive-analysis'
import { CustomReports } from '@/components/analytics/custom-reports'

type AnalyticsTab = 'overview' | 'executive' | 'sales' | 'customers' | 'operations' | 'predictive' | 'reports'

export default function StatisticsPage() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')

  // Lista de tabs con información
  const tabs = [
    { 
      key: 'overview', 
      label: 'Resumen General', 
      icon: '📊', 
      description: 'Vista general del negocio'
    },
    { 
      key: 'executive', 
      label: 'Dashboard Ejecutivo', 
      icon: '🎯', 
      description: 'Métricas clave para directivos'
    },
    {
      key: 'sales',
      label: 'Análisis de Ventas',
      icon: '💰',
      description: 'Análisis comercial'
    },
    {
      key: 'customers',
      label: 'Clientes',
      icon: '👥',
      description: 'Comportamiento y segmentación'
    },
    {
      key: 'operations',
      label: 'Operaciones',
      icon: '⚙️',
      description: 'Rendimiento operacional'
    },
    {
      key: 'predictive',
      label: 'Análisis Predictivo',
      icon: '🔮',
      description: 'Pronósticos y tendencias'
    },
    {
      key: 'reports',
      label: 'Reportes Personalizados',
      icon: '📋',
      description: 'Generación de informes'
    }
  ]

  // Vista resumen con métricas generales
  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Ingresos Totales',
            value: '€847,230',
            change: '+12.4%',
            icon: '💰',
            trend: 'up'
          },
          {
            title: 'Pedidos Activos',
            value: '2,847',
            change: '+8.2%',
            icon: '📦',
            trend: 'up'
          },
          {
            title: 'Clientes Únicos',
            value: '12,845',
            change: '+15.7%',
            icon: '👥',
            trend: 'up'
          },
          {
            title: 'Tasa de Conversión',
            value: '3.4%',
            change: '-0.3%',
            icon: '⚡',
            trend: 'down'
          }
        ].map((kpi, index) => (
          <Card key={index} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{kpi.icon}</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  kpi.trend === 'up' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {kpi.change}
                </span>
              </div>
              <h3 className="font-semibold text-2xl mb-1" style={{ color: theme.colors.textPrimary }}>
                {kpi.value}
              </h3>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {kpi.title}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico de tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Tendencias de Crecimiento
            </CardTitle>
            <CardDescription>
              Evolución de métricas clave en los últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <Text style={{ color: theme.colors.textSecondary }}>
                Gráfico de tendencias (Integración con ChartContainer)
              </Text>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Objetivos vs Realidad
            </CardTitle>
            <CardDescription>
              Comparación de metas establecidas vs resultados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { goal: 'Ingresos Mensuales', target: '€900K', current: '€847K', progress: 94 },
                { goal: 'Nuevos Clientes', target: '1,500', current: '1,284', progress: 86 },
                { goal: 'Satisfacción Cliente', target: '95%', current: '92%', progress: 97 }
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: theme.colors.textPrimary }}>{item.goal}</span>
                    <span style={{ color: theme.colors.textSecondary }}>
                      {item.current} / {item.target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${item.progress}%`,
                        backgroundColor: item.progress >= 90 ? theme.colors.success : 
                                       item.progress >= 70 ? theme.colors.warning : theme.colors.error
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights y recomendaciones */}
      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 Insights Inteligentes
          </CardTitle>
          <CardDescription>
            Recomendaciones basadas en análisis de datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Optimización de Inventario',
                description: 'Se detectó sobrestock en categoría "Guantes". Reducir pedidos en 25%.',
                impact: 'Alto',
                confidence: '89%',
                action: 'Revisar'
              },
              {
                title: 'Oportunidad de Mercado',
                description: 'Incremento del 34% en búsquedas de "MMA". Considerar expansión.',
                impact: 'Medio',
                confidence: '76%',
                action: 'Analizar'
              },
              {
                title: 'Retención de Clientes',
                description: 'Clientes premium muestran 15% menos actividad. Implementar programa de fidelización.',
                impact: 'Alto',
                confidence: '92%',
                action: 'Implementar'
              }
            ].map((rec, index) => (
              <div key={index} className="p-4 border rounded-lg" style={{ borderColor: theme.colors.border }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium" style={{ color: theme.colors.textPrimary }}>
                    {rec.title}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    rec.impact === 'Alto' ? 'bg-red-100 text-red-800' :
                    rec.impact === 'Medio' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.impact}
                  </span>
                </div>
                <p className="text-sm mb-3" style={{ color: theme.colors.textSecondary }}>
                  {rec.description}
                </p>
                <div className="flex items-center justify-between">
                  <Text className="text-xs" style={{ color: theme.colors.textTertiary }}>
                    Confianza: {rec.confidence}
                  </Text>
                  <Button variant="outline" size="sm">
                    {rec.action} →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <AppLayout>
      <div className="min-h-screen p-6" style={{ backgroundColor: theme.colors.background }}>
        <div className="max-w-7xl mx-auto">
          {/* Header principal */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
              📊 Centro de Análisis Avanzado
            </h1>
            <Text className="text-lg" style={{ color: theme.colors.textSecondary }}>
              Análisis integral del negocio con componentes reusables y visualizaciones interactivas
            </Text>
          </div>

          {/* Navegación por tabs */}
          <div className="flex overflow-x-auto gap-2 mb-8 pb-2">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab.key as AnalyticsTab)}
                className="whitespace-nowrap flex items-center gap-2"
                style={{
                  backgroundColor: activeTab === tab.key ? theme.colors.primary : 'transparent',
                  borderColor: theme.colors.border,
                  color: activeTab === tab.key ? theme.colors.textInverse : theme.colors.textSecondary
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Contenido por tab */}
          <div className="min-h-[600px]">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'executive' && <ExecutiveDashboard />}
            {activeTab === 'sales' && <SalesAnalysis />}
            {activeTab === 'customers' && <CustomerBehavior />}
            {activeTab === 'operations' && <OperationalPerformance />}
            {activeTab === 'predictive' && <PredictiveAnalysis />}
            {activeTab === 'reports' && <CustomReports />}
          </div>

          {/* Footer con información del sistema */}
          <div className="mt-12 pt-6 border-t" style={{ borderColor: theme.colors.border }}>
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-sm" style={{ color: theme.colors.textTertiary }}>
                  Sistema de Análisis BRUMA v2.0 • Última actualización: {new Date().toLocaleDateString('es-ES')}
                </Text>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    Datos sincronizados
                  </Text>
                </div>
                <Button variant="outline" size="sm">
                  ⚙️ Configuración
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}