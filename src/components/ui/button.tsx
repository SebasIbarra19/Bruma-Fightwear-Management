import * as React from "react"
import { cn } from "@/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning'
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95"
    
    const variants = {
      default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg",
      outline: "border-2 border-gray-300 bg-white hover:bg-gray-50 hover:border-indigo-500 text-gray-700 hover:text-indigo-600",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm hover:shadow-md",
      ghost: "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
      link: "text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-700",
      success: "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg",
      warning: "bg-yellow-500 text-white hover:bg-yellow-600 shadow-md hover:shadow-lg",
    }
    
    const sizes = {
      default: "h-11 px-6 py-2",
      sm: "h-9 rounded-md px-4 text-sm",
      lg: "h-12 rounded-lg px-8 text-base",
      xl: "h-14 rounded-lg px-10 text-lg",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }