import React from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'

// Título principal de página
interface PageTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  className?: string
}

export const PageTitle = React.forwardRef<HTMLHeadingElement, PageTitleProps>(
  ({ children, className, ...props }, ref) => {
    const { theme } = useTheme()
    return (
      <h1
        ref={ref}
        className={cn("font-fraunces font-black tracking-tight", className)}
        style={{ color: theme.colors.textPrimary }}
        {...props}
      >
        {children}
      </h1>
    )
  }
)
PageTitle.displayName = 'PageTitle'

// Título de sección
interface SectionTitleProps {
  children: React.ReactNode
  className?: string
  level?: 2 | 3 | 4
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  children, 
  className, 
  level = 2 
}) => {
  const { theme } = useTheme()
  const levelStyles = {
    2: "font-geist text-2xl font-semibold tracking-tight",
    3: "font-geist text-xl font-semibold tracking-tight", 
    4: "font-geist text-lg font-medium"
  }

  const commonStyle = { color: theme.colors.textPrimary }

  if (level === 2) {
    return (
      <h2 className={cn(levelStyles[2], className)} style={commonStyle}>
        {children}
      </h2>
    )
  }
  
  if (level === 3) {
    return (
      <h3 className={cn(levelStyles[3], className)} style={commonStyle}>
        {children}
      </h3>
    )
  }
  
  return (
    <h4 className={cn(levelStyles[4], className)} style={commonStyle}>
      {children}
    </h4>
  )
}

// Texto descriptivo
interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'muted' | 'small' | 'large' | 'italic'
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ children, className, variant = 'default', ...props }, ref) => {
    const { theme } = useTheme()
    const variants = {
      default: { color: theme.colors.textPrimary, fontFamily: 'var(--font-geist-sans)' },
      muted: { color: theme.colors.textSecondary, fontSize: '0.875rem', fontFamily: 'var(--font-geist-sans)' },
      small: { color: theme.colors.textTertiary, fontSize: '0.75rem', fontFamily: 'var(--font-geist-sans)' },
      large: { color: theme.colors.textPrimary, fontSize: '1.125rem', fontFamily: 'var(--font-geist-sans)' },
      italic: { color: theme.colors.textSecondary, fontSize: '1.125rem', fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', fontWeight: 300 }
    }

    return (
      <p
        ref={ref}
        className={className}
        style={variants[variant]}
        {...props}
      >
        {children}
      </p>
    )
  }
)
Text.displayName = 'Text'

// Label para estadísticas y formularios
interface LabelProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  className?: string
  htmlFor?: string
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, className, htmlFor, ...props }, ref) => {
    const { theme } = useTheme()
    
    return (
      <label
        ref={ref}
        htmlFor={htmlFor}
        className={cn("text-sm font-medium", className)}
        style={{ color: theme.colors.textPrimary }}
        {...props}
      >
        {children}
      </label>
    )
  }
)
Label.displayName = 'Label'

// Badge para estados
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, className, variant = 'default', ...props }, ref) => {
    const { theme } = useTheme()
    
    const variants = {
      default: {
        backgroundColor: theme.colors.border + '20',
        color: theme.colors.textSecondary
      },
      success: {
        backgroundColor: theme.colors.success + '20',
        color: theme.colors.success
      },
      warning: {
        backgroundColor: theme.colors.warning + '20', 
        color: theme.colors.warning
      },
      error: {
        backgroundColor: theme.colors.error + '20',
        color: theme.colors.error
      },
      info: {
        backgroundColor: theme.colors.primary + '20',
        color: theme.colors.primary
      }
    }

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          className
        )}
        style={variants[variant]}
        {...props}
      >
        {children}
      </span>
    )
  }
)
Badge.displayName = 'Badge'