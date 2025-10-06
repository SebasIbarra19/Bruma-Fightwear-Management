'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Text } from '@/components/ui/typography'
import { ChartContainer, ChartDataPoint } from '@/components/ui/chart-container'

interface WidgetProps {
  width: number
  height: number
  className?: string
}

// Widget KPI Card
export function KPIWidget({ width, height, className = '' }: WidgetProps & {
  title: string
  value: string
  change: string
  icon: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  const { theme } = useTheme()
  
  return (
    <Card className={`w-full h-full ${className}`} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm" style={{ color: theme.colors.textSecondary }}>
            Ingresos Totales
          </CardTitle>
          <span className="text-xl">💰</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold mb-1" style={{ color: theme.colors.textPrimary }}>
          €847,230
        </div>
        <div className="text-sm" style={{ color: theme.colors.success }}>
          +12.4% vs mes anterior
        </div>
      </CardContent>
    </Card>
  )
}

// Widget Chart pequeño
export function MiniChartWidget({ width, height, className = '' }: WidgetProps) {
  const data: ChartDataPoint[] = [
    { label: 'Ene', value: 145 },
    { label: 'Feb', value: 162 },
    { label: 'Mar', value: 178 },
    { label: 'Abr', value: 156 },
    { label: 'May', value: 189 },
    { label: 'Jun', value: 201 }
  ]

  return (
    <div className={`w-full h-full ${className}`}>
      <ChartContainer
        title="📈 Ventas Mensuales"
        description="Evolución de ingresos"
        data={data}
        defaultChartType="line"
        availableTypes={['line', 'bar', 'area']}
        height={height * 80 - 60}
        showLegend={false}
        animated={true}
      />
    </div>
  )
}

// Widget Dashboard Ejecutivo compacto
export function ExecutiveMiniWidget({ width, height, className = '' }: WidgetProps) {
  const { theme } = useTheme()
  
  return (
    <Card className={`w-full h-full ${className}`} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2" style={{ color: theme.colors.textPrimary }}>
          👔 Dashboard Ejecutivo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: 'Revenue', value: '€847K', trend: '+12.4%' },
            { label: 'Margen', value: '34.2%', trend: '+2.1%' },
            { label: 'Clientes', value: '8,947', trend: '+8.7%' },
            { label: 'Conversión', value: '3.8%', trend: '+0.6%' }
          ].map((kpi, index) => (
            <div key={index} className="text-center p-2 rounded" style={{ backgroundColor: theme.colors.background }}>
              <div className="font-bold" style={{ color: theme.colors.textPrimary }}>{kpi.value}</div>
              <div className="text-xs" style={{ color: theme.colors.textSecondary }}>{kpi.label}</div>
              <div className="text-xs" style={{ color: theme.colors.success }}>{kpi.trend}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Widget de Análisis de Ventas compacto
export function SalesMiniWidget({ width, height, className = '' }: WidgetProps) {
  const data: ChartDataPoint[] = [
    { label: 'Guantes', value: 234 },
    { label: 'Rashguards', value: 187 },
    { label: 'Shorts', value: 156 },
    { label: 'Protectores', value: 98 }
  ]

  return (
    <div className={`w-full h-full ${className}`}>
      <ChartContainer
        title="🎯 Top Productos"
        description="Ventas por categoría"
        data={data}
        defaultChartType="pie"
        availableTypes={['pie', 'donut', 'bar']}
        height={height * 80 - 60}
        showLegend={width >= 4}
        animated={true}
      />
    </div>
  )
}

// Widget de Comportamiento de Cliente compacto  
export function CustomerMiniWidget({ width, height, className = '' }: WidgetProps) {
  const { theme } = useTheme()
  
  return (
    <Card className={`w-full h-full ${className}`} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2" style={{ color: theme.colors.textPrimary }}>
          👥 Clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <Text style={{ color: theme.colors.textSecondary }}>CLV Promedio:</Text>
            <Text className="font-bold" style={{ color: theme.colors.textPrimary }}>€287</Text>
          </div>
          <div className="flex justify-between">
            <Text style={{ color: theme.colors.textSecondary }}>Retención:</Text>
            <Text className="font-bold" style={{ color: theme.colors.success }}>68.5%</Text>
          </div>
          <div className="flex justify-between">
            <Text style={{ color: theme.colors.textSecondary }}>Nuevos/Mes:</Text>
            <Text className="font-bold" style={{ color: theme.colors.textPrimary }}>342</Text>
          </div>
          <div className="flex justify-between">
            <Text style={{ color: theme.colors.textSecondary }}>Satisfacción:</Text>
            <Text className="font-bold" style={{ color: theme.colors.success }}>4.8/5</Text>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Widget de Rendimiento Operacional compacto
export function OperationalMiniWidget({ width, height, className = '' }: WidgetProps) {
  const data: ChartDataPoint[] = [
    { label: 'Recepción', value: 94.2 },
    { label: 'Almacén', value: 87.8 },
    { label: 'Picking', value: 91.5 },
    { label: 'Empaque', value: 96.3 },
    { label: 'Envío', value: 89.7 }
  ]

  return (
    <div className={`w-full h-full ${className}`}>
      <ChartContainer
        title="⚙️ Eficiencia Procesos"
        description="Rendimiento por etapa"
        data={data}
        defaultChartType="radar"
        availableTypes={['radar', 'bar', 'line']}
        height={height * 80 - 60}
        showLegend={false}
        animated={true}
      />
    </div>
  )
}

// Widget de Análisis Predictivo compacto
export function PredictiveMiniWidget({ width, height, className = '' }: WidgetProps) {
  const { theme } = useTheme()
  
  return (
    <Card className={`w-full h-full ${className}`} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2" style={{ color: theme.colors.textPrimary }}>
          🔮 Predicciones IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="p-2 rounded text-xs" style={{ backgroundColor: theme.colors.background }}>
            <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
              📈 Ventas Diciembre
            </div>
            <div style={{ color: theme.colors.success }}>+28% esperado</div>
            <div className="text-xs" style={{ color: theme.colors.textTertiary }}>94% confianza</div>
          </div>
          <div className="p-2 rounded text-xs" style={{ backgroundColor: theme.colors.background }}>
            <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
              🚨 Stock Crítico
            </div>
            <div style={{ color: theme.colors.warning }}>8 productos</div>
            <div className="text-xs" style={{ color: theme.colors.textTertiary }}>Acción requerida</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Widget de texto personalizable
export function TextWidget({ width, height, className = '' }: WidgetProps & {
  title?: string
  content?: string
}) {
  const { theme } = useTheme()
  
  return (
    <Card className={`w-full h-full ${className}`} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm" style={{ color: theme.colors.textPrimary }}>
          📝 Notas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
          • Revisar inventario de guantes
          • Llamar proveedor Valencia
          • Actualizar precios Q4
          • Preparar reporte mensual
        </div>
      </CardContent>
    </Card>
  )
}

// Mapeo de tipos de widget a componentes
export const WIDGET_COMPONENTS = {
  kpi: KPIWidget,
  chart: MiniChartWidget,
  executive: ExecutiveMiniWidget,
  sales: SalesMiniWidget,
  customer: CustomerMiniWidget,
  operational: OperationalMiniWidget,
  predictive: PredictiveMiniWidget,
  text: TextWidget
} as const

export type WidgetType = keyof typeof WIDGET_COMPONENTS