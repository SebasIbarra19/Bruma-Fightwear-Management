import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface ProgressBarProps {
  value: number
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  animated?: boolean
  className?: string
}

export function ProgressBar({ 
  value, 
  max = 100, 
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  animated = false,
  className = '' 
}: ProgressBarProps) {
  const { theme } = useTheme()
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const getVariantColor = () => {
    switch (variant) {
      case 'success': return theme.colors.success
      case 'warning': return theme.colors.warning
      case 'danger': return theme.colors.error
      default: return theme.colors.primary
    }
  }
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }
  
  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm" style={{ color: theme.colors.textPrimary }}>
            {label || `Progreso`}
          </span>
          <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div 
        className={`rounded-full overflow-hidden ${sizes[size]}`}
        style={{ backgroundColor: theme.colors.surfaceHover }}
      >
        <div
          className={`${sizes[size]} rounded-full transition-all duration-300 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getVariantColor()
          }}
        />
      </div>
    </div>
  )
}

interface SteppedProgressProps {
  steps: number
  currentStep: number
  variant?: 'default' | 'success' | 'warning' | 'danger'
  showNumbers?: boolean
  className?: string
}

export function SteppedProgress({
  steps,
  currentStep,
  variant = 'default',
  showNumbers = false,
  className = ''
}: SteppedProgressProps) {
  const { theme } = useTheme()
  
  const getVariantColor = () => {
    switch (variant) {
      case 'success': return theme.colors.success
      case 'warning': return theme.colors.warning
      case 'danger': return theme.colors.error
      default: return theme.colors.primary
    }
  }
  
  return (
    <div className={`flex items-center ${className}`}>
      {Array.from({ length: steps }, (_, index) => (
        <React.Fragment key={index}>
          <div 
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all duration-200"
            style={{
              backgroundColor: index < currentStep 
                ? getVariantColor()
                : index === currentStep
                ? theme.colors.textSecondary
                : theme.colors.surfaceHover,
              borderColor: index < currentStep 
                ? getVariantColor()
                : index === currentStep
                ? theme.colors.textSecondary
                : theme.colors.border,
              color: index <= currentStep ? theme.colors.textInverse : theme.colors.textTertiary
            }}
          >
            {showNumbers ? index + 1 : (
              index < currentStep ? '✓' : ''
            )}
          </div>
          
          {index < steps - 1 && (
            <div 
              className="flex-1 h-0.5 mx-2 transition-all duration-200"
              style={{
                backgroundColor: index < currentStep ? getVariantColor() : theme.colors.border
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}