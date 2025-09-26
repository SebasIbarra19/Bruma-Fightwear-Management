import * as React from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning' | 'primary' | 'minimal'
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', style, ...props }, ref) => {
    const { theme } = useTheme()
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const getVariantStyles = () => {
      switch (variant) {
        case 'default':
        case 'primary':
          return {
            backgroundColor: theme.colors.primary,
            color: theme.colors.textInverse,
            hoverColor: theme.colors.primaryHover
          }
        case 'destructive':
          return {
            backgroundColor: theme.colors.error,
            color: theme.colors.textInverse,
            hoverColor: theme.colors.errorHover
          }
        case 'outline':
          return {
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: 'transparent',
            color: theme.colors.textSecondary,
            hoverBgColor: theme.colors.surfaceHover,
            hoverTextColor: theme.colors.textPrimary
          }
        case 'secondary':
          return {
            backgroundColor: theme.colors.secondary,
            color: theme.colors.textInverse,
            hoverColor: theme.colors.secondaryHover || theme.colors.secondary
          }
        case 'ghost':
          return {
            backgroundColor: 'transparent',
            color: theme.colors.textSecondary,
            hoverBgColor: theme.colors.surfaceHover,
            hoverTextColor: theme.colors.textPrimary
          }
        case 'link':
          return {
            backgroundColor: 'transparent',
            color: theme.colors.primary,
            textDecoration: 'underline',
            hoverColor: theme.colors.primaryHover
          }
        case 'success':
          return {
            backgroundColor: theme.colors.success,
            color: theme.colors.textInverse,
            hoverColor: theme.colors.successHover || theme.colors.success
          }
        case 'warning':
          return {
            backgroundColor: theme.colors.warning,
            color: theme.colors.textInverse,
            hoverColor: theme.colors.warningHover || theme.colors.warning
          }
        case 'minimal':
          return {
            backgroundColor: 'transparent',
            color: theme.colors.textTertiary,
            hoverBgColor: theme.colors.surfaceHover,
            hoverTextColor: theme.colors.textPrimary
          }
        default:
          return {}
      }
    }
    
    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-10 px-6",
      xl: "h-12 px-8 text-base",
      icon: "h-9 w-9",
    }

    const variantStyles = getVariantStyles()

    return (
      <button
        className={cn(baseClasses, sizes[size], className)}
        style={{ ...variantStyles, ...style }}
        onMouseEnter={(e) => {
          if (variantStyles.hoverColor) {
            e.currentTarget.style.backgroundColor = variantStyles.hoverColor
          } else if (variantStyles.hoverBgColor) {
            e.currentTarget.style.backgroundColor = variantStyles.hoverBgColor
          }
          if (variantStyles.hoverTextColor) {
            e.currentTarget.style.color = variantStyles.hoverTextColor
          }
        }}
        onMouseLeave={(e) => {
          if (variantStyles.backgroundColor) {
            e.currentTarget.style.backgroundColor = variantStyles.backgroundColor
          }
          if (variantStyles.color) {
            e.currentTarget.style.color = variantStyles.color
          }
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }