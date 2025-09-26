import React from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'

// Componente de Login Form
interface LoginFormProps {
  className?: string
  onSubmit?: (data: { email: string; password: string }) => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ className, onSubmit }) => {
  const { theme } = useTheme()
  const [formData, setFormData] = React.useState({
    email: '',
    password: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
  }

  return (
    <div className={cn("w-full max-w-md", className)}>
      <div 
        className="rounded-lg shadow-lg p-8"
        style={{ 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          border: `1px solid ${theme.colors.border}`
        }}
      >
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <span className="text-2xl font-bold" style={{ color: theme.colors.textInverse }}>B</span>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>Iniciar Sesión</h2>
          <p className="mt-2" style={{ color: theme.colors.textSecondary }}>Ingresa a tu cuenta BRUMA</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textPrimary,
                '--tw-ring-color': theme.colors.primary
              } as React.CSSProperties}
              placeholder="correo@ejemplo.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textPrimary,
                '--tw-ring-color': theme.colors.primary
              } as React.CSSProperties}
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded focus:ring-2"
                style={{ 
                  accentColor: theme.colors.primary,
                  '--tw-ring-color': theme.colors.primary
                } as React.CSSProperties}
              />
              <label htmlFor="remember" className="ml-2 block text-sm" style={{ color: theme.colors.textPrimary }}>
                Recordarme
              </label>
            </div>
            <a 
              href="#" 
              className="text-sm hover:underline transition-colors"
              style={{ color: theme.colors.primary }}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors font-medium"
            style={{ 
              backgroundColor: theme.colors.primary, 
              color: theme.colors.textInverse,
              '--tw-ring-color': theme.colors.primary,
              '--tw-ring-offset-color': theme.colors.surface
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              if (theme.colors.primaryHover) {
                e.currentTarget.style.backgroundColor = theme.colors.primaryHover
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary
            }}
          >
            Iniciar Sesión
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            ¿No tienes cuenta?{' '}
            <a 
              href="#" 
              className="font-medium hover:underline transition-colors"
              style={{ color: theme.colors.primary }}
            >
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// Componente de Register Form
interface RegisterFormProps {
  className?: string
  onSubmit?: (data: { name: string; email: string; password: string; confirmPassword: string }) => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ className, onSubmit }) => {
  const { theme } = useTheme()
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
  }

  return (
    <div className={cn("w-full max-w-md", className)}>
      <div 
        className="rounded-lg shadow-lg p-8"
        style={{ 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          border: `1px solid ${theme.colors.border}`
        }}
      >
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: theme.colors.success }}
          >
            <span className="text-2xl" style={{ color: theme.colors.textInverse }}>👤</span>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>Crear Cuenta</h2>
          <p className="mt-2" style={{ color: theme.colors.textSecondary }}>Únete a la familia BRUMA</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
              Nombre Completo
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textPrimary,
                '--tw-ring-color': theme.colors.success
              } as React.CSSProperties}
              placeholder="Tu nombre completo"
            />
          </div>
          
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
              Correo Electrónico
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textPrimary,
                '--tw-ring-color': theme.colors.success
              } as React.CSSProperties}
              placeholder="correo@ejemplo.com"
            />
          </div>
          
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
              Contraseña
            </label>
            <input
              id="reg-password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textPrimary,
                '--tw-ring-color': theme.colors.success
              } as React.CSSProperties}
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
              Confirmar Contraseña
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textPrimary,
                '--tw-ring-color': theme.colors.success
              } as React.CSSProperties}
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              required
              className="h-4 w-4 rounded focus:ring-2"
              style={{ 
                accentColor: theme.colors.success,
                '--tw-ring-color': theme.colors.success
              } as React.CSSProperties}
            />
            <label htmlFor="terms" className="ml-2 block text-sm" style={{ color: theme.colors.textPrimary }}>
              Acepto los{' '}
              <a 
                href="#" 
                className="hover:underline transition-colors"
                style={{ color: theme.colors.success }}
              >
                términos y condiciones
              </a>
            </label>
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors font-medium"
            style={{ 
              backgroundColor: theme.colors.success, 
              color: theme.colors.textInverse,
              '--tw-ring-color': theme.colors.success,
              '--tw-ring-offset-color': theme.colors.surface
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              if (theme.colors.successHover) {
                e.currentTarget.style.backgroundColor = theme.colors.successHover
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.success
            }}
          >
            Crear Cuenta
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            ¿Ya tienes cuenta?{' '}
            <a 
              href="#" 
              className="font-medium hover:underline transition-colors"
              style={{ color: theme.colors.success }}
            >
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}