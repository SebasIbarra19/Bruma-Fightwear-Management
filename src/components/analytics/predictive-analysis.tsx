'use client'

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { ChartContainer, ChartDataPoint } from '@/components/ui/chart-container'

interface PredictiveAnalysisProps {
  className?: string
}

export function PredictiveAnalysis({ className = '' }: PredictiveAnalysisProps) {
  const { theme } = useTheme()
  const [selectedModel, setSelectedModel] = useState<'sales' | 'demand' | 'customer' | 'inventory'>('sales')
  const [timeHorizon, setTimeHorizon] = useState<'1M' | '3M' | '6M' | '12M'>('3M')

  // Predicción de ventas
  const salesForecastData: ChartDataPoint[] = [
    { label: 'Ene 2024', value: 145280, category: 'histórico' },
    { label: 'Feb 2024', value: 162350, category: 'histórico' },
    { label: 'Mar 2024', value: 178940, category: 'histórico' },
    { label: 'Abr 2024', value: 156720, category: 'histórico' },
    { label: 'May 2024', value: 189560, category: 'histórico' },
    { label: 'Jun 2024', value: 201380, category: 'histórico' },
    { label: 'Jul 2024', value: 198750, category: 'histórico' },
    { label: 'Ago 2024', value: 187230, category: 'histórico' },
    { label: 'Sep 2024', value: 175680, category: 'actual' },
    { label: 'Oct 2024', value: 185400, category: 'predicción' },
    { label: 'Nov 2024', value: 195800, category: 'predicción' },
    { label: 'Dec 2024', value: 218600, category: 'predicción' }
  ]

  // Demanda por producto
  const demandForecastData: ChartDataPoint[] = [
    { label: 'Guantes MMA', value: 2890, x: 95.2, y: 2890 },
    { label: 'Rashguards', value: 1640, x: 87.3, y: 1640 },
    { label: 'Shorts BJJ', value: 2150, x: 91.8, y: 2150 },
    { label: 'Protectores', value: 890, x: 78.4, y: 890 },
    { label: 'Suplementos', value: 1290, x: 82.7, y: 1290 },
    { label: 'Calzado', value: 650, x: 69.5, y: 650 }
  ]

  // Segmentación predictiva de clientes
  const customerSegmentPredictionData: ChartDataPoint[] = [
    { label: 'Retendrán', value: 68.5 },
    { label: 'En Riesgo', value: 18.3 },
    { label: 'Recuperables', value: 8.7 },
    { label: 'Perderán', value: 4.5 }
  ]

  // Anomalías detectadas
  const anomaliesData: ChartDataPoint[] = [
    { label: 'Lun', value: 125 },
    { label: 'Mar', value: 134 },
    { label: 'Mié', value: 89 }, // anomalía
    { label: 'Jue', value: 156 },
    { label: 'Vie', value: 178 },
    { label: 'Sáb', value: 234 },
    { label: 'Dom', value: 198 }
  ]

  // Tendencias de mercado
  const marketTrendsData: ChartDataPoint[] = [
    { label: 'MMA Equipment', value: 15.8 },
    { label: 'BJJ Gear', value: 12.4 },
    { label: 'Boxing', value: 8.9 },
    { label: 'Fitness', value: 22.1 },
    { label: 'CrossFit', value: 18.7 },
    { label: 'Supplements', value: 31.2 }
  ]

  // Predicción de inventario
  const inventoryPredictionData: ChartDataPoint[] = [
    { label: 'Stock Actual', value: 12450 },
    { label: 'Demanda Pred.', value: 15680 },
    { label: 'Stock Óptimo', value: 18200 },
    { label: 'Punto Reorden', value: 8900 }
  ]

  // Recomendaciones automáticas
  const renderAutomatedRecommendations = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: theme.colors.textPrimary }}>
            🤖 Recomendaciones de IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                type: 'inventory',
                priority: 'Alta',
                title: 'Incrementar Stock Guantes MMA',
                description: 'Modelo predice aumento 34% demanda próximas 4 semanas',
                action: 'Ordenar 450 unidades adicionales',
                confidence: 94.2,
                impact: '€28K revenue potencial'
              },
              {
                type: 'marketing',
                priority: 'Media',
                title: 'Campaña Retención Clientes',
                description: '347 clientes en riesgo de abandono detectados',
                action: 'Lanzar campaña personalizada',
                confidence: 87.8,
                impact: '€15K CLV preservado'
              },
              {
                type: 'pricing',
                priority: 'Alta',
                title: 'Optimizar Precios Suplementos',
                description: 'Elasticidad de precio favorable en categoría',
                action: 'Aumentar precios 8-12%',
                confidence: 91.5,
                impact: '€22K margen adicional'
              },
              {
                type: 'seasonal',
                priority: 'Media',
                title: 'Preparar Temporada Alta',
                description: 'Diciembre mostrará pico ventas +28%',
                action: 'Ajustar staffing y stock',
                confidence: 89.3,
                impact: '€45K oportunidad'
              }
            ].map((rec, index) => (
              <div key={index} className="p-4 rounded-lg border" style={{ 
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border
              }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-sm" style={{ color: theme.colors.textPrimary }}>
                      {rec.title}
                    </h4>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      rec.priority === 'Alta' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-green-600">{rec.impact}</div>
                    <div className="text-xs" style={{ color: theme.colors.textTertiary }}>
                      Confianza: {rec.confidence}%
                    </div>
                  </div>
                </div>
                <p className="text-sm mb-3" style={{ color: theme.colors.textSecondary }}>
                  {rec.description}
                </p>
                <div className="flex items-center justify-between">
                  <Text className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                    {rec.action}
                  </Text>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Descartar</Button>
                    <Button size="sm" style={{ backgroundColor: theme.colors.primary }}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: theme.colors.textPrimary }}>
            🎯 Modelos Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                model: 'Sales Forecasting',
                accuracy: '94.2%',
                lastUpdate: '2 horas',
                status: 'active',
                predictions: '12 meses',
                algorithm: 'LSTM + Seasonal'
              },
              {
                model: 'Customer Churn',
                accuracy: '89.7%',
                lastUpdate: '6 horas',
                status: 'active',
                predictions: 'Semanal',
                algorithm: 'Random Forest'
              },
              {
                model: 'Demand Planning',
                accuracy: '91.8%',
                lastUpdate: '1 hora',
                status: 'active',
                predictions: 'Diario',
                algorithm: 'XGBoost'
              },
              {
                model: 'Price Optimization',
                accuracy: '87.3%',
                lastUpdate: '4 horas',
                status: 'training',
                predictions: 'Mensual',
                algorithm: 'Deep Learning'
              },
              {
                model: 'Anomaly Detection',
                accuracy: '96.1%',
                lastUpdate: '15 min',
                status: 'active',
                predictions: 'Tiempo real',
                algorithm: 'Isolation Forest'
              }
            ].map((model, index) => (
              <div key={index} className="p-3 rounded-lg border" style={{ 
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border
              }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm" style={{ color: theme.colors.textPrimary }}>
                    {model.model}
                  </h4>
                  <div className={`w-3 h-3 rounded-full ${
                    model.status === 'active' ? 'bg-green-500' : 
                    model.status === 'training' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <Text style={{ color: theme.colors.textSecondary }}>Precisión</Text>
                    <Text style={{ color: theme.colors.textPrimary }} className="font-medium">
                      {model.accuracy}
                    </Text>
                  </div>
                  <div>
                    <Text style={{ color: theme.colors.textSecondary }}>Predicciones</Text>
                    <Text style={{ color: theme.colors.textPrimary }} className="font-medium">
                      {model.predictions}
                    </Text>
                  </div>
                  <div>
                    <Text style={{ color: theme.colors.textSecondary }}>Actualizado</Text>
                    <Text style={{ color: theme.colors.textPrimary }} className="font-medium">
                      Hace {model.lastUpdate}
                    </Text>
                  </div>
                  <div>
                    <Text style={{ color: theme.colors.textSecondary }}>Algoritmo</Text>
                    <Text style={{ color: theme.colors.textPrimary }} className="font-medium">
                      {model.algorithm}
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const models = [
    { key: 'sales', label: 'Ventas' },
    { key: 'demand', label: 'Demanda' },
    { key: 'customer', label: 'Clientes' },
    { key: 'inventory', label: 'Inventario' }
  ]

  const horizons = [
    { key: '1M', label: '1 Mes' },
    { key: '3M', label: '3 Meses' },
    { key: '6M', label: '6 Meses' },
    { key: '12M', label: '12 Meses' }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
            🔮 Análisis Predictivo
          </h2>
          <Text style={{ color: theme.colors.textSecondary }}>
            Forecasting inteligente, detección de anomalías y recomendaciones automatizadas
          </Text>
        </div>
        <div className="flex gap-4">
          <div className="flex gap-1">
            {models.map((model) => (
              <Button
                key={model.key}
                variant={selectedModel === model.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedModel(model.key as any)}
                style={{
                  backgroundColor: selectedModel === model.key ? theme.colors.primary : 'transparent',
                  borderColor: theme.colors.border,
                  color: selectedModel === model.key ? theme.colors.textInverse : theme.colors.textSecondary
                }}
              >
                {model.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-1">
            {horizons.map((horizon) => (
              <Button
                key={horizon.key}
                variant={timeHorizon === horizon.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeHorizon(horizon.key as any)}
                style={{
                  backgroundColor: timeHorizon === horizon.key ? theme.colors.primary : 'transparent',
                  borderColor: theme.colors.border,
                  color: timeHorizon === horizon.key ? theme.colors.textInverse : theme.colors.textSecondary
                }}
              >
                {horizon.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs de Predicción */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            kpi: 'Precisión Modelo',
            value: '94.2%',
            change: '+2.1%',
            icon: '🎯',
            status: 'excellent'
          },
          {
            kpi: 'Predicciones/Día',
            value: '1,847',
            change: '+12%',
            icon: '⚡',
            status: 'good'
          },
          {
            kpi: 'Confianza Promedio',
            value: '89.7%',
            change: '+0.8%',
            icon: '📊',
            status: 'good'
          },
          {
            kpi: 'Anomalías Detectadas',
            value: '23',
            change: '-5',
            icon: '🚨',
            status: 'excellent'
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
              <div className="text-xs" style={{ 
                color: kpi.change.startsWith('+') && !kpi.kpi.includes('Anomalías') ? theme.colors.success :
                       kpi.change.startsWith('+') && kpi.kpi.includes('Anomalías') ? theme.colors.warning :
                       kpi.change.startsWith('-') && kpi.kpi.includes('Anomalías') ? theme.colors.success :
                       theme.colors.error
              }}>
                {kpi.change} vs mes anterior
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Predicción de Ventas y Detección de Anomalías */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="📈 Forecasting de Ventas"
          description="Predicción de ingresos basada en modelos LSTM y análisis estacional"
          data={salesForecastData}
          defaultChartType="line"
          availableTypes={['line', 'area', 'bar']}
          height={300}
          showLegend={true}
          animated={true}
        />

        <ChartContainer
          title="🚨 Detección de Anomalías"
          description="Identificación automática de patrones inusuales en ventas diarias"
          data={anomaliesData}
          defaultChartType="line"
          availableTypes={['line', 'bar', 'area']}
          height={300}
          showLegend={false}
          animated={true}
        />
      </div>

      {/* Predicción de Demanda y Segmentación Predictiva */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="📦 Predicción de Demanda"
          description="Demanda esperada vs precisión del modelo por producto"
          data={demandForecastData}
          defaultChartType="scatter"
          availableTypes={['scatter', 'bar', 'radar']}
          height={300}
          showLegend={true}
          animated={true}
        />

        <ChartContainer
          title="👥 Segmentación Predictiva"
          description="Probabilidad de retención de clientes basada en comportamiento"
          data={customerSegmentPredictionData}
          defaultChartType="donut"
          availableTypes={['donut', 'pie', 'bar']}
          height={300}
          showLegend={true}
          animated={true}
        />
      </div>

      {/* Tendencias de Mercado */}
      <ChartContainer
        title="📊 Tendencias de Mercado"
        description="Crecimiento anual esperado por categoría según análisis de mercado"
        data={marketTrendsData}
        defaultChartType="bar"
        availableTypes={['bar', 'radar', 'line']}
        height={350}
        showLegend={false}
        animated={true}
      />

      {/* Recomendaciones Automáticas y Modelos Activos */}
      {renderAutomatedRecommendations()}

      {/* Predicción de Inventario Óptimo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="📋 Optimización de Inventario"
          description="Comparativa stock actual vs niveles óptimos predichos"
          data={inventoryPredictionData}
          defaultChartType="bar"
          availableTypes={['bar', 'radar', 'line']}
          height={300}
          showLegend={false}
          animated={true}
        />

        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle style={{ color: theme.colors.textPrimary }}>
              🔬 Experimentos A/B Predictivos
            </CardTitle>
            <CardDescription style={{ color: theme.colors.textSecondary }}>
              Tests automáticos basados en predicciones de IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  experiment: 'Precio Dinámico Guantes',
                  status: 'running',
                  progress: 65,
                  expectedLift: '+12.4%',
                  confidence: '89%',
                  endDate: '15 Oct',
                  participants: '2,340'
                },
                {
                  experiment: 'Recomendaciones ML',
                  status: 'completed',
                  progress: 100,
                  expectedLift: '+8.7%',
                  actualLift: '+9.2%',
                  confidence: '95%',
                  endDate: '28 Sep',
                  participants: '1,890'
                },
                {
                  experiment: 'Email Predictivo',
                  status: 'draft',
                  progress: 0,
                  expectedLift: '+15.2%',
                  confidence: '87%',
                  startDate: '20 Oct',
                  participants: '3,200'
                }
              ].map((exp, index) => (
                <div key={index} className="p-3 rounded-lg border" style={{ 
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm" style={{ color: theme.colors.textPrimary }}>
                      {exp.experiment}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      exp.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      exp.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {exp.status === 'running' ? 'Ejecutando' :
                       exp.status === 'completed' ? 'Completado' : 'Borrador'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                    <div>
                      <Text style={{ color: theme.colors.textSecondary }}>
                        {exp.status === 'completed' ? 'Lift Real' : 'Lift Esperado'}
                      </Text>
                      <Text style={{ color: theme.colors.success }} className="font-medium">
                        {exp.status === 'completed' ? exp.actualLift : exp.expectedLift}
                      </Text>
                    </div>
                    <div>
                      <Text style={{ color: theme.colors.textSecondary }}>Confianza</Text>
                      <Text style={{ color: theme.colors.textPrimary }} className="font-medium">
                        {exp.confidence}
                      </Text>
                    </div>
                    <div>
                      <Text style={{ color: theme.colors.textSecondary }}>
                        {exp.status === 'draft' ? 'Inicio' : 'Fin'}
                      </Text>
                      <Text style={{ color: theme.colors.textPrimary }} className="font-medium">
                        {exp.endDate || exp.startDate}
                      </Text>
                    </div>
                    <div>
                      <Text style={{ color: theme.colors.textSecondary }}>Participantes</Text>
                      <Text style={{ color: theme.colors.textPrimary }} className="font-medium">
                        {exp.participants}
                      </Text>
                    </div>
                  </div>
                  {exp.status === 'running' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: theme.colors.textSecondary }}>Progreso</span>
                        <span style={{ color: theme.colors.textPrimary }}>{exp.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1">
                        <div
                          className="h-1 rounded-full bg-blue-500"
                          style={{ width: `${exp.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}