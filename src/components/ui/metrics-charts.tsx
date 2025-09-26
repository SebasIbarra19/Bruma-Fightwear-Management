'use client'

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'

interface MetricsChartsProps {
  className?: string
  data?: {
    valueOrder: number
    returnRate: number
    satisfaction: number
    responseTime: number
  }
}

type ChartType = 'bar' | 'line' | 'current'

export function MetricsCharts({ 
  className = '', 
  data = {
    valueOrder: 124.50,
    returnRate: 2.1,
    satisfaction: 4.7,
    responseTime: 1.2
  }
}: MetricsChartsProps) {
  const { theme } = useTheme()
  const [chartType, setChartType] = useState<ChartType>('current')

  const metrics = [
    { 
      key: 'valueOrder', 
      label: 'Valor Promedio Pedido', 
      value: data.valueOrder, 
      unit: '€', 
      percentage: 78, 
      color: theme.colors.success 
    },
    { 
      key: 'returnRate', 
      label: 'Tasa de Retorno', 
      value: data.returnRate, 
      unit: '%', 
      percentage: 21, 
      color: theme.colors.warning 
    },
    { 
      key: 'satisfaction', 
      label: 'Satisfacción Cliente', 
      value: data.satisfaction, 
      unit: '/5.0', 
      percentage: 94, 
      color: theme.colors.primary 
    },
    { 
      key: 'responseTime', 
      label: 'Tiempo Respuesta', 
      value: data.responseTime, 
      unit: 's', 
      percentage: 88, 
      color: theme.colors.secondary 
    }
  ]

  const getHistoricalData = (metric: string) => {
    // Datos simulados para los últimos 6 meses
    const baseValues = {
      valueOrder: [110, 115, 120, 118, 122, 124.50],
      returnRate: [2.8, 2.5, 2.3, 2.2, 2.15, 2.1],
      satisfaction: [4.2, 4.3, 4.4, 4.5, 4.6, 4.7],
      responseTime: [1.8, 1.6, 1.5, 1.4, 1.3, 1.2]
    }
    return baseValues[metric as keyof typeof baseValues] || []
  }

  const renderCurrentView = () => (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <div key={metric.key} className="space-y-2">
          <div className="flex justify-between">
            <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {metric.label}
            </Text>
            <Text className="text-sm font-mono" style={{ color: theme.colors.textPrimary }}>
              {metric.unit === '€' ? `${metric.unit}${metric.value}` : `${metric.value}${metric.unit}`}
            </Text>
          </div>
          <div 
            className="w-full rounded-full h-1.5"
            style={{ backgroundColor: theme.colors.border }}
          >
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ 
                width: `${metric.percentage}%`,
                backgroundColor: metric.color
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )

  const renderBarChart = () => (
    <div className="h-48 flex items-end justify-between gap-4 p-4">
      {metrics.map((metric, index) => (
        <div key={metric.key} className="flex flex-col items-center group flex-1">
          <div
            className="w-full rounded-t transition-all duration-300 cursor-pointer relative min-h-[20px]"
            style={{ 
              height: `${metric.percentage * 1.5}px`,
              background: `linear-gradient(to top, ${metric.color}, ${metric.color}80)`,
              maxHeight: '140px'
            }}
            title={`${metric.label}: ${metric.unit === '€' ? `${metric.unit}${metric.value}` : `${metric.value}${metric.unit}`}`}
          >
            <div 
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-black px-2 py-1 rounded"
              style={{ color: theme.colors.textInverse }}
            >
              {metric.unit === '€' ? `${metric.unit}${metric.value}` : `${metric.value}${metric.unit}`}
            </div>
          </div>
          <Text 
            className="text-xs mt-2 text-center"
            style={{ color: theme.colors.textTertiary }}
          >
            {metric.label.split(' ')[0]}
          </Text>
        </div>
      ))}
    </div>
  )

  const renderLineChart = () => (
    <div className="h-48 p-4 relative">
      <svg width="100%" height="100%" viewBox="0 0 400 160">
        {metrics.map((metric, metricIndex) => {
          const historicalData = getHistoricalData(metric.key)
          const maxValue = Math.max(...historicalData)
          const points = historicalData.map((value, index) => {
            const x = (index * 400) / (historicalData.length - 1)
            const y = 160 - (value / maxValue) * 140
            return `${x},${y}`
          }).join(' ')

          return (
            <g key={metric.key}>
              <polyline
                points={points}
                fill="none"
                stroke={metric.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
              {historicalData.map((value, index) => {
                const x = (index * 400) / (historicalData.length - 1)
                const y = 160 - (value / maxValue) * 140
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="3"
                    fill={metric.color}
                    className="hover:r-5 transition-all cursor-pointer"
                  >
                    <title>{`${metric.label}: ${value}${metric.unit}`}</title>
                  </circle>
                )
              })}
            </g>
          )
        })}
        
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="32" patternUnits="userSpaceOnUse">
            <path 
              d="M 40 0 L 0 0 0 32" 
              fill="none" 
              stroke={theme.colors.border} 
              strokeWidth="0.5" 
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs px-4">
        {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].map((month, index) => (
          <span key={month} style={{ color: theme.colors.textTertiary }}>
            {month}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <Card 
      className={className}
      style={{ 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border 
      }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle style={{ color: theme.colors.textPrimary }}>
              Métricas de Rendimiento
            </CardTitle>
            <CardDescription style={{ color: theme.colors.textSecondary }}>
              Indicadores clave de rendimiento del sistema
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={chartType === 'current' ? 'default' : 'outline'}
              onClick={() => setChartType('current')}
              className="text-xs"
              style={{
                backgroundColor: chartType === 'current' ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.border,
                color: chartType === 'current' ? theme.colors.textInverse : theme.colors.textSecondary
              }}
            >
              Actual
            </Button>
            <Button
              size="sm"
              variant={chartType === 'bar' ? 'default' : 'outline'}
              onClick={() => setChartType('bar')}
              className="text-xs"
              style={{
                backgroundColor: chartType === 'bar' ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.border,
                color: chartType === 'bar' ? theme.colors.textInverse : theme.colors.textSecondary
              }}
            >
              Barras
            </Button>
            <Button
              size="sm"
              variant={chartType === 'line' ? 'default' : 'outline'}
              onClick={() => setChartType('line')}
              className="text-xs"
              style={{
                backgroundColor: chartType === 'line' ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.border,
                color: chartType === 'line' ? theme.colors.textInverse : theme.colors.textSecondary
              }}
            >
              Lineal
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartType === 'current' && renderCurrentView()}
        {chartType === 'bar' && renderBarChart()}
        {chartType === 'line' && renderLineChart()}
        
        <div 
          className="mt-4 pt-4 border-t text-center"
          style={{ borderColor: theme.colors.border }}
        >
          <Text 
            className="text-xs"
            style={{ color: theme.colors.textTertiary }}
          >
            Última actualización: {new Date().toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </div>
      </CardContent>
    </Card>
  )
}