import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from './card'
import { Text } from './typography'
import { useTheme } from '@/contexts/ThemeContext'

// Tarjeta de estadística individual
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  trend?: {
    value: number
    isPositive: boolean
  }
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, subtitle, icon, className, variant = 'default', trend, ...props }, ref) => {
    const { theme } = useTheme()
    
    const variants = {
      default: {
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface
      },
      success: {
        borderColor: theme.colors.success + '33',
        backgroundColor: theme.colors.success + '08'
      },
      warning: {
        borderColor: theme.colors.warning + '33', 
        backgroundColor: theme.colors.warning + '08'
      },
      error: {
        borderColor: theme.colors.error + '33',
        backgroundColor: theme.colors.error + '08'
      },
      info: {
        borderColor: theme.colors.primary + '33',
        backgroundColor: theme.colors.primary + '08'
      }
    }

    return (
      <Card
        ref={ref}
        className={cn(className)}
        style={{
          borderColor: variants[variant].borderColor,
          backgroundColor: variants[variant].backgroundColor,
          border: `1px solid ${variants[variant].borderColor}`
        }}
        {...props}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Text variant="muted" className="text-xs uppercase tracking-wider font-medium">
                {title}
              </Text>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {trend && (
                  <span 
                    className="ml-2 text-sm font-medium"
                    style={{ 
                      color: trend.isPositive ? theme.colors.success : theme.colors.error 
                    }}
                  >
                    {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                  </span>
                )}
              </div>
              {subtitle && (
                <Text variant="muted" className="mt-1">
                  {subtitle}
                </Text>
              )}
            </div>
            {icon && (
              <div className="ml-4 flex-shrink-0">
                <div className="w-8 h-8" style={{ color: theme.colors.textSecondary }}>
                  {icon}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
StatCard.displayName = 'StatCard'

// Componente para mostrar métricas simples (sin card)
interface MetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  className?: string
}

export const Metric = React.forwardRef<HTMLDivElement, MetricProps>(
  ({ label, value, className, ...props }, ref) => {
    const { theme } = useTheme()
    
    return (
      <div
        ref={ref}
        className={cn("text-center", className)}
        {...props}
      >
        <div className="text-3xl font-bold" style={{ color: theme.colors.textPrimary }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <Text variant="muted" className="mt-1">
          {label}
        </Text>
      </div>
    )
  }
)
Metric.displayName = 'Metric'

// Componente para listas de métricas
interface MetricListProps extends React.HTMLAttributes<HTMLDivElement> {
  metrics: Array<{
    label: string
    value: string | number
    icon?: React.ReactNode
  }>
  className?: string
}

export const MetricList = React.forwardRef<HTMLDivElement, MetricListProps>(
  ({ metrics, className, ...props }, ref) => {
    const { theme } = useTheme()
    
    return (
      <div
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      >
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              {metric.icon && (
                <div className="w-5 h-5" style={{ color: theme.colors.textSecondary }}>
                  {metric.icon}
                </div>
              )}
              <Text variant="muted">
                {metric.label}
              </Text>
            </div>
            <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>
              {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
)
MetricList.displayName = 'MetricList'

// Card de resumen con múltiples métricas
interface SummaryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  metrics: Array<{
    label: string
    value: string | number
  }>
  className?: string
}

export const SummaryCard = React.forwardRef<HTMLDivElement, SummaryCardProps>(
  ({ title, metrics, className, ...props }, ref) => {
    const { theme } = useTheme()
    
    return (
      <Card
        ref={ref}
        className={cn(className)}
        {...props}
      >
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
            {title}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                </div>
                <Text variant="muted" className="text-xs">
                  {metric.label}
                </Text>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
)
SummaryCard.displayName = 'SummaryCard'