'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Text, 
  Label 
} from '@/components/ui/typography'
import { 
  Flex 
} from '@/components/ui/layout'

interface LoginFormProps {
  onSuccess: () => void
  onToggleMode: () => void
}

export function LoginForm({ onSuccess, onToggleMode }: LoginFormProps) {
  const { theme } = useTheme()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Basic validation
    if (!email || !password) {
      setError('Por favor completa todos los campos')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Por favor ingresa un email válido')
      setLoading(false)
      return
    }

    // Real Supabase authentication
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        console.error('Login error:', error)
        setError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.')
        return
      }

      if (data.user) {
        console.log('Login successful:', data.user.email)
        
        // Múltiples métodos de redirección para asegurar que funcione
        console.log('Redirecting to dashboard...')
        
        // Método 1: Router push
        router.push('/dashboard')
        
        // Método 2: Location change como fallback
        setTimeout(() => {
          if (window.location.pathname !== '/dashboard') {
            console.log('Router redirect failed, using window.location')
            window.location.href = '/dashboard'
          }
        }, 500)
        
        // Call parent success handler
        onSuccess()
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Error inesperado. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div 
          className="p-4 rounded-xl border text-sm"
          style={{ 
            backgroundColor: theme.colors.error + '10',
            borderColor: theme.colors.error + '30',
            color: theme.colors.error
          }}
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Email Field */}
        <div>
          <Label className="block mb-2">
            Email
          </Label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl border border-opacity-30 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:border-opacity-50"
              style={{
                backgroundColor: theme.colors.background + '50',
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary
              }}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>
        </div>

        {/* Password Field */}
        <div>
          <Label className="block mb-2">
            Contraseña
          </Label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="w-full px-4 py-3 rounded-xl border border-opacity-30 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:border-opacity-50"
              style={{
                backgroundColor: theme.colors.background + '50',
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 opacity-40 hover:opacity-60 transition-opacity"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Remember me and Forgot password */}
      <Flex className="items-center justify-between">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-gray-300 focus:ring-2"
            style={{ accentColor: theme.colors.primary }}
          />
          <Text className="text-sm">
            Recordarme
          </Text>
        </label>
        <button
          type="button"
          className="text-sm transition-colors hover:opacity-80"
          style={{ color: theme.colors.primary }}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </Flex>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-lg font-semibold rounded-xl transition-all hover:shadow-lg disabled:opacity-50"
        style={{
          backgroundColor: theme.colors.primary,
          color: theme.colors.textInverse
        }}
      >
        {loading ? (
          <Flex className="items-center justify-center space-x-2">
            <div 
              className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
            ></div>
            <span>Iniciando sesión...</span>
          </Flex>
        ) : (
          'Iniciar Sesión'
        )}
      </Button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: theme.colors.border + '30' }}></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span 
            className="px-4 text-sm"
            style={{ 
              backgroundColor: theme.colors.surface + 'f0',
              color: theme.colors.textSecondary 
            }}
          >
            O continúa con
          </span>
        </div>
      </div>

      {/* Social Login */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="py-3 transition-all hover:shadow-md"
          style={{
            borderColor: theme.colors.border + '50',
            backgroundColor: theme.colors.background + '30'
          }}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="py-3 transition-all hover:shadow-md"
          style={{
            borderColor: theme.colors.border + '50',
            backgroundColor: theme.colors.background + '30'
          }}
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </Button>
      </div>

      {/* Toggle to Register */}
      <div className="text-center mt-6">
        <Text className="text-sm">
          ¿No tienes una cuenta?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="font-semibold transition-colors hover:opacity-80"
            style={{ color: theme.colors.primary }}
          >
            Regístrate aquí
          </button>
        </Text>
      </div>
    </form>
  )
}