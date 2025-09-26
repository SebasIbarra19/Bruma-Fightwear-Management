import React from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'

// Grid genérico configurable
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  colsMd?: 1 | 2 | 3 | 4 | 5 | 6
  colsLg?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 2 | 4 | 6 | 8
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ children, className, cols = 1, colsMd, colsLg, gap = 4, ...props }, ref) => {
    const colsClasses = {
      1: "grid-cols-1",
      2: "grid-cols-2", 
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6"
    }
    
    const gapClasses = {
      2: "gap-2",
      4: "gap-4",
      6: "gap-6", 
      8: "gap-8"
    }

    const baseClass = `grid ${colsClasses[cols]} ${gapClasses[gap]}`
    const mdClass = colsMd ? `md:${colsClasses[colsMd]}` : ''
    const lgClass = colsLg ? `lg:${colsClasses[colsLg]}` : ''

    return (
      <div
        ref={ref}
        className={cn(baseClass, mdClass, lgClass, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Grid.displayName = 'Grid'

// Grid específico para estadísticas (patrón más usado)
interface StatsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'compact' | 'wide'
}

export const StatsGrid = React.forwardRef<HTMLDivElement, StatsGridProps>(
  ({ children, className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "grid grid-cols-2 md:grid-cols-4 gap-4",
      compact: "grid grid-cols-1 md:grid-cols-6 gap-6", 
      wide: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
    }

    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
StatsGrid.displayName = 'StatsGrid'

// Container para páginas
interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ children, className, maxWidth = 'full', ...props }, ref) => {
    const { theme } = useTheme()
    const maxWidths = {
      sm: "max-w-3xl",
      md: "max-w-5xl", 
      lg: "max-w-7xl",
      xl: "max-w-screen-xl",
      full: "max-w-full"
    }

    return (
      <div
        ref={ref}
        className={cn("mx-auto px-4 sm:px-6 lg:px-8", maxWidths[maxWidth], className)}
        style={{ 
          backgroundColor: theme.colors.background,
          color: theme.colors.textPrimary,
          minHeight: '100vh'
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PageContainer.displayName = 'PageContainer'

// Flex container común
interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  direction?: 'row' | 'col'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  gap?: 1 | 2 | 3 | 4 | 6 | 8
}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ children, className, direction = 'row', align = 'start', justify = 'start', gap = 2, ...props }, ref) => {
    const directionClasses = {
      row: "flex-row",
      col: "flex-col"
    }
    
    const alignClasses = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch"
    }
    
    const justifyClasses = {
      start: "justify-start",
      center: "justify-center", 
      end: "justify-end",
      between: "justify-between",
      around: "justify-around"
    }
    
    const gapClasses = {
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          directionClasses[direction],
          alignClasses[align],
          justifyClasses[justify],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Flex.displayName = 'Flex'