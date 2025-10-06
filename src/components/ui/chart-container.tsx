'use client'

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'

// Tipos de gráficos disponibles
export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'radar'

// Interface para los datos del gráfico
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
  category?: string
  x?: number
  y?: number
}

export interface ChartContainerProps {
  title: string
  description?: string
  data: ChartDataPoint[]
  defaultChartType?: ChartType
  availableTypes?: ChartType[]
  className?: string
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  animated?: boolean
  onDataPointClick?: (dataPoint: ChartDataPoint) => void
}

// Sistema de colores consistente adaptado al tema
export const useChartColors = () => {
  const { theme } = useTheme()
  
  return {
    primary: [
      theme.colors.primary,
      theme.colors.success,
      theme.colors.warning,
      theme.colors.error,
      theme.colors.secondary,
      '#8B5CF6', // purple
      '#06B6D4', // cyan
      '#84CC16', // lime
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5A2B', // brown
      '#6366F1'  // indigo
    ],
    gradients: {
      primary: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primary}80)`,
      success: `linear-gradient(135deg, ${theme.colors.success}, ${theme.colors.success}80)`,
      warning: `linear-gradient(135deg, ${theme.colors.warning}, ${theme.colors.warning}80)`,
      error: `linear-gradient(135deg, ${theme.colors.error}, ${theme.colors.error}80)`,
    },
    background: theme.colors.surface,
    border: theme.colors.border,
    text: {
      primary: theme.colors.textPrimary,
      secondary: theme.colors.textSecondary,
      tertiary: theme.colors.textTertiary
    },
    grid: theme.colors.border + '40',
    hover: theme.colors.primary + '20'
  }
}

// Iconos para cada tipo de gráfico
const ChartTypeIcon = ({ type }: { type: ChartType }) => {
  const iconClass = "w-4 h-4"
  
  switch (type) {
    case 'bar':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2z" />
        </svg>
      )
    case 'line':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />
        </svg>
      )
    case 'area':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    case 'pie':
    case 'donut':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      )
    case 'scatter':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="2" />
          <circle cx="6" cy="8" r="1.5" />
          <circle cx="18" cy="16" r="1.5" />
          <circle cx="8" cy="18" r="1.5" />
          <circle cx="16" cy="6" r="1.5" />
        </svg>
      )
    case 'radar':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <polygon points="12,2 22,20 2,20" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l10 18H2L12 2z" />
        </svg>
      )
    default:
      return null
  }
}

// Componente de selector de tipo de gráfico
const ChartTypeSelector = ({ 
  currentType, 
  availableTypes, 
  onTypeChange 
}: { 
  currentType: ChartType
  availableTypes: ChartType[]
  onTypeChange: (type: ChartType) => void 
}) => {
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  
  const typeLabels: Record<ChartType, string> = {
    bar: 'Barras',
    line: 'Líneas', 
    area: 'Área',
    pie: 'Circular',
    donut: 'Anillo',
    scatter: 'Dispersión',
    radar: 'Radar'
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        style={{ 
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          color: theme.colors.textSecondary
        }}
      >
        <ChartTypeIcon type={currentType} />
        <span className="text-xs">{typeLabels[currentType]}</span>
        <svg 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 py-1 rounded-md shadow-lg border z-50 min-w-[120px]"
          style={{ 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }}
        >
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                onTypeChange(type)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-opacity-10 hover:bg-white transition-colors ${
                type === currentType ? 'font-medium' : ''
              }`}
              style={{ 
                color: type === currentType ? theme.colors.primary : theme.colors.textSecondary 
              }}
            >
              <ChartTypeIcon type={type} />
              {typeLabels[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente principal del contenedor de gráficos
export function ChartContainer({
  title,
  description,
  data,
  defaultChartType = 'bar',
  availableTypes = ['bar', 'line', 'area', 'pie', 'donut', 'scatter'],
  className = '',
  height = 300,
  showLegend = true,
  showGrid = true,
  animated = true,
  onDataPointClick
}: ChartContainerProps) {
  const { theme } = useTheme()
  const colors = useChartColors()
  const [currentChartType, setCurrentChartType] = useState<ChartType>(defaultChartType)

  // Asignar colores automáticamente si no están definidos
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || colors.primary[index % colors.primary.length]
  }))

  // Renderizador de gráfico de barras
  const renderBarChart = () => {
    const maxValue = Math.max(...dataWithColors.map(d => d.value))
    
    return (
      <div className="flex items-end justify-between gap-2 p-4" style={{ height }}>
        {dataWithColors.map((item, index) => (
          <div key={index} className="flex flex-col items-center group flex-1 cursor-pointer" onClick={() => onDataPointClick?.(item)}>
            <div
              className={`w-full rounded-t transition-all duration-500 relative min-w-[20px] ${animated ? 'hover:scale-105' : ''}`}
              style={{ 
                height: `${(item.value / maxValue) * (height - 80)}px`,
                background: `linear-gradient(to top, ${item.color}, ${item.color}80)`,
                boxShadow: `0 2px 8px ${item.color}40`
              }}
              title={`${item.label}: ${item.value.toLocaleString()}`}
            >
              <div 
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                {item.value.toLocaleString()}
              </div>
            </div>
            <Text 
              className="text-xs mt-2 text-center truncate w-full"
              style={{ color: colors.text.tertiary }}
            >
              {item.label}
            </Text>
          </div>
        ))}
      </div>
    )
  }

  // Renderizador de gráfico de líneas
  const renderLineChart = () => {
    const maxValue = Math.max(...dataWithColors.map(d => d.value))
    const minValue = Math.min(...dataWithColors.map(d => d.value))
    const range = maxValue - minValue
    
    return (
      <div className="relative p-4" style={{ height }}>
        <svg width="100%" height="100%" viewBox={`0 0 400 ${height - 80}`}>
          {/* Grid lines */}
          {showGrid && (
            <defs>
              <pattern id="grid" width="40" height="32" patternUnits="userSpaceOnUse">
                <path 
                  d="M 40 0 L 0 0 0 32" 
                  fill="none" 
                  stroke={colors.grid} 
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
          )}
          {showGrid && <rect width="100%" height="100%" fill="url(#grid)" />}
          
          {/* Line path */}
          <g>
            {dataWithColors.length > 1 && (
              <polyline
                points={dataWithColors.map((item, index) => {
                  const x = (index * 380) / (dataWithColors.length - 1) + 10
                  const y = (height - 100) - ((item.value - minValue) / range) * (height - 120)
                  return `${x},${y}`
                }).join(' ')}
                fill="none"
                stroke={colors.primary[0]}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={animated ? 'animate-pulse' : ''}
              />
            )}
            
            {/* Data points */}
            {dataWithColors.map((item, index) => {
              const x = (index * 380) / (Math.max(dataWithColors.length - 1, 1)) + 10
              const y = (height - 100) - ((item.value - minValue) / range) * (height - 120)
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={item.color}
                  stroke={colors.background}
                  strokeWidth="2"
                  className={`${animated ? 'hover:r-6 transition-all' : ''} cursor-pointer`}
                  onClick={() => onDataPointClick?.(item)}
                >
                  <title>{`${item.label}: ${item.value.toLocaleString()}`}</title>
                </circle>
              )
            })}
          </g>
        </svg>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs px-4">
          {dataWithColors.map((item, index) => (
            <span key={index} style={{ color: colors.text.tertiary }} className="truncate max-w-[80px]">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  // Renderizador de gráfico de área
  const renderAreaChart = () => {
    const maxValue = Math.max(...dataWithColors.map(d => d.value))
    const minValue = Math.min(...dataWithColors.map(d => d.value))
    const range = maxValue - minValue
    
    return (
      <div className="relative p-4" style={{ height }}>
        <svg width="100%" height="100%" viewBox={`0 0 400 ${height - 80}`}>
          {/* Grid */}
          {showGrid && (
            <>
              <defs>
                <pattern id="areaGrid" width="40" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 32" fill="none" stroke={colors.grid} strokeWidth="0.5" />
                </pattern>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={colors.primary[0]} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={colors.primary[0]} stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#areaGrid)" />
            </>
          )}
          
          {/* Area path */}
          {dataWithColors.length > 1 && (
            <g>
              <polygon
                points={[
                  `10,${height - 100}`,
                  ...dataWithColors.map((item, index) => {
                    const x = (index * 380) / (dataWithColors.length - 1) + 10
                    const y = (height - 100) - ((item.value - minValue) / range) * (height - 120)
                    return `${x},${y}`
                  }),
                  `${10 + 380},${height - 100}`
                ].join(' ')}
                fill="url(#areaGradient)"
                stroke={colors.primary[0]}
                strokeWidth="2"
                className={animated ? 'animate-pulse' : ''}
              />
              
              {/* Data points */}
              {dataWithColors.map((item, index) => {
                const x = (index * 380) / (dataWithColors.length - 1) + 10
                const y = (height - 100) - ((item.value - minValue) / range) * (height - 120)
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="3"
                    fill={item.color}
                    stroke={colors.background}
                    strokeWidth="2"
                    className={`${animated ? 'hover:r-5 transition-all' : ''} cursor-pointer`}
                    onClick={() => onDataPointClick?.(item)}
                  >
                    <title>{`${item.label}: ${item.value.toLocaleString()}`}</title>
                  </circle>
                )
              })}
            </g>
          )}
        </svg>
        
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs px-4">
          {dataWithColors.map((item, index) => (
            <span key={index} style={{ color: colors.text.tertiary }} className="truncate max-w-[80px]">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  // Renderizador de gráfico circular/donut
  const renderPieChart = () => {
    const total = dataWithColors.reduce((sum, item) => sum + item.value, 0)
    let currentAngle = -90 // Empezar desde arriba
    const centerX = 200
    const centerY = (height - 80) / 2
    const radius = Math.min(centerX, centerY) - 20
    const innerRadius = currentChartType === 'donut' ? radius * 0.5 : 0
    
    return (
      <div className="relative p-4" style={{ height }}>
        <svg width="100%" height="100%" viewBox={`0 0 400 ${height - 80}`}>
          {dataWithColors.map((item, index) => {
            const angle = (item.value / total) * 360
            const startAngle = currentAngle
            const endAngle = currentAngle + angle
            
            // Convertir ángulos a radianes
            const startRad = (startAngle * Math.PI) / 180
            const endRad = (endAngle * Math.PI) / 180
            
            // Calcular puntos del arco
            const largeArcFlag = angle > 180 ? 1 : 0
            
            const outerX1 = centerX + radius * Math.cos(startRad)
            const outerY1 = centerY + radius * Math.sin(startRad)
            const outerX2 = centerX + radius * Math.cos(endRad)
            const outerY2 = centerY + radius * Math.sin(endRad)
            
            const innerX1 = centerX + innerRadius * Math.cos(startRad)
            const innerY1 = centerY + innerRadius * Math.sin(startRad)
            const innerX2 = centerX + innerRadius * Math.cos(endRad)
            const innerY2 = centerY + innerRadius * Math.sin(endRad)
            
            let pathData
            if (currentChartType === 'donut') {
              pathData = [
                `M ${outerX1} ${outerY1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}`,
                `L ${innerX2} ${innerY2}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`,
                'Z'
              ].join(' ')
            } else {
              pathData = [
                `M ${centerX} ${centerY}`,
                `L ${outerX1} ${outerY1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}`,
                'Z'
              ].join(' ')
            }
            
            currentAngle += angle
            
            return (
              <path
                key={index}
                d={pathData}
                fill={item.color}
                stroke={colors.background}
                strokeWidth="2"
                className={`${animated ? 'hover:scale-105 transition-transform' : ''} cursor-pointer`}
                onClick={() => onDataPointClick?.(item)}
                style={{ transformOrigin: `${centerX}px ${centerY}px` }}
              >
                <title>{`${item.label}: ${item.value.toLocaleString()} (${((item.value / total) * 100).toFixed(1)}%)`}</title>
              </path>
            )
          })}
          
          {/* Center text for donut chart */}
          {currentChartType === 'donut' && (
            <g>
              <text
                x={centerX}
                y={centerY - 5}
                textAnchor="middle"
                style={{ fill: colors.text.primary }}
                className="text-lg font-semibold"
              >
                {total.toLocaleString()}
              </text>
              <text
                x={centerX}
                y={centerY + 15}
                textAnchor="middle"
                style={{ fill: colors.text.secondary }}
                className="text-xs"
              >
                Total
              </text>
            </g>
          )}
        </svg>
      </div>
    )
  }

  // Renderizador de gráfico de dispersión
  const renderScatterChart = () => {
    const maxX = Math.max(...dataWithColors.map(d => d.x || d.value))
    const maxY = Math.max(...dataWithColors.map(d => d.y || d.value))
    const minX = Math.min(...dataWithColors.map(d => d.x || 0))
    const minY = Math.min(...dataWithColors.map(d => d.y || 0))
    
    return (
      <div className="relative p-4" style={{ height }}>
        <svg width="100%" height="100%" viewBox={`0 0 400 ${height - 80}`}>
          {/* Grid */}
          {showGrid && (
            <defs>
              <pattern id="scatterGrid" width="40" height="32" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 32" fill="none" stroke={colors.grid} strokeWidth="0.5" />
              </pattern>
            </defs>
          )}
          {showGrid && <rect width="100%" height="100%" fill="url(#scatterGrid)" />}
          
          {/* Data points */}
          {dataWithColors.map((item, index) => {
            const x = ((item.x || item.value) - minX) / (maxX - minX) * 360 + 20
            const y = (height - 100) - (((item.y || item.value) - minY) / (maxY - minY) * (height - 120))
            const size = Math.sqrt(item.value) / 5 + 3
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={size}
                fill={item.color}
                fillOpacity="0.7"
                stroke={item.color}
                strokeWidth="2"
                className={`${animated ? 'hover:scale-125 transition-transform' : ''} cursor-pointer`}
                onClick={() => onDataPointClick?.(item)}
              >
                <title>{`${item.label}: (${item.x || item.value}, ${item.y || item.value})`}</title>
              </circle>
            )
          })}
        </svg>
      </div>
    )
  }

  // Renderizador de gráfico radar
  const renderRadarChart = () => {
    const centerX = 200
    const centerY = (height - 80) / 2
    const radius = Math.min(centerX, centerY) - 40
    const levels = 5
    const maxValue = Math.max(...dataWithColors.map(d => d.value))
    
    return (
      <div className="relative p-4" style={{ height }}>
        <svg width="100%" height="100%" viewBox={`0 0 400 ${height - 80}`}>
          {/* Grid circles */}
          {showGrid && (
            <g>
              {Array.from({ length: levels }, (_, i) => (
                <circle
                  key={i}
                  cx={centerX}
                  cy={centerY}
                  r={(radius / levels) * (i + 1)}
                  fill="none"
                  stroke={colors.grid}
                  strokeWidth="1"
                />
              ))}
              
              {/* Grid lines */}
              {dataWithColors.map((_, index) => {
                const angle = (index * 360) / dataWithColors.length - 90
                const radian = (angle * Math.PI) / 180
                const x = centerX + radius * Math.cos(radian)
                const y = centerY + radius * Math.sin(radian)
                
                return (
                  <line
                    key={index}
                    x1={centerX}
                    y1={centerY}
                    x2={x}
                    y2={y}
                    stroke={colors.grid}
                    strokeWidth="1"
                  />
                )
              })}
            </g>
          )}
          
          {/* Data polygon */}
          <polygon
            points={dataWithColors.map((item, index) => {
              const angle = (index * 360) / dataWithColors.length - 90
              const radian = (angle * Math.PI) / 180
              const distance = (item.value / maxValue) * radius
              const x = centerX + distance * Math.cos(radian)
              const y = centerY + distance * Math.sin(radian)
              return `${x},${y}`
            }).join(' ')}
            fill={colors.primary[0] + '40'}
            stroke={colors.primary[0]}
            strokeWidth="2"
            className={animated ? 'animate-pulse' : ''}
          />
          
          {/* Data points */}
          {dataWithColors.map((item, index) => {
            const angle = (index * 360) / dataWithColors.length - 90
            const radian = (angle * Math.PI) / 180
            const distance = (item.value / maxValue) * radius
            const x = centerX + distance * Math.cos(radian)
            const y = centerY + distance * Math.sin(radian)
            
            // Label position
            const labelDistance = radius + 20
            const labelX = centerX + labelDistance * Math.cos(radian)
            const labelY = centerY + labelDistance * Math.sin(radian)
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={item.color}
                  stroke={colors.background}
                  strokeWidth="2"
                  className={`${animated ? 'hover:r-6 transition-all' : ''} cursor-pointer`}
                  onClick={() => onDataPointClick?.(item)}
                >
                  <title>{`${item.label}: ${item.value.toLocaleString()}`}</title>
                </circle>
                
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fill: colors.text.tertiary }}
                  className="text-xs"
                >
                  {item.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  // Función para renderizar el gráfico según el tipo seleccionado
  const renderChart = () => {
    switch (currentChartType) {
      case 'bar':
        return renderBarChart()
      case 'line':
        return renderLineChart()
      case 'area':
        return renderAreaChart()
      case 'pie':
      case 'donut':
        return renderPieChart()
      case 'scatter':
        return renderScatterChart()
      case 'radar':
        return renderRadarChart()
      default:
        return renderBarChart()
    }
  }

  // Renderizar leyenda
  const renderLegend = () => {
    if (!showLegend || dataWithColors.length <= 1) return null
    
    return (
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
        {dataWithColors.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <Text className="text-xs" style={{ color: colors.text.secondary }}>
              {item.label}
            </Text>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card 
      className={className}
      style={{ 
        backgroundColor: colors.background,
        borderColor: colors.border 
      }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle style={{ color: colors.text.primary }}>
              {title}
            </CardTitle>
            {description && (
              <CardDescription style={{ color: colors.text.secondary }}>
                {description}
              </CardDescription>
            )}
          </div>
          
          <ChartTypeSelector
            currentType={currentChartType}
            availableTypes={availableTypes}
            onTypeChange={setCurrentChartType}
          />
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
        {renderLegend()}
        
        <div 
          className="mt-4 pt-4 border-t text-center"
          style={{ borderColor: colors.border }}
        >
          <Text 
            className="text-xs"
            style={{ color: colors.text.tertiary }}
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