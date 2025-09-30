'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Text, 
  Label 
} from '@/components/ui/typography'
import { 
  Flex 
} from '@/components/ui/layout'

interface RegisterFormProps {
  onSuccess: () => void
  onToggleMode: () => void
}

export function RegisterForm({ onSuccess, onToggleMode }: RegisterFormProps) {
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Por favor completa todos los campos')
      setLoading(false)
      return
    }

    if (!formData.email.includes('@')) {
      setError('Por favor ingresa un email válido')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (!acceptTerms) {
      setError('Debes aceptar los términos y condiciones')
      setLoading(false)
      return
    }

    // Real Supabase registration
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`
          }
        }
      })

      if (error) {
        console.error('Registration error details:', {
          message: error.message,
          status: error.status,
          details: error
        })
        
        // Provide more specific error messages
        let errorMessage = 'Error al crear la cuenta. Intenta nuevamente.'
        
        if (error.message.includes('already registered')) {
          errorMessage = 'Este email ya está registrado. Intenta iniciar sesión.'
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'El formato del email no es válido.'
        } else if (error.message.includes('Password')) {
          errorMessage = 'La contraseña no cumple con los requisitos mínimos.'
        } else if (error.message.includes('signup is disabled')) {
          errorMessage = 'El registro está temporalmente deshabilitado.'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        setError(errorMessage)
        return
      }

      if (data.user) {
        console.log('Registration successful:', data.user.email)
        // User will be redirected by AuthContext
        onSuccess()
      }
    } catch (err) {
      console.error('Unexpected registration error:', err)
      setError('Error inesperado. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: theme.colors.background + '50',
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="block mb-2 text-sm">
              Nombre
            </Label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 rounded-xl border border-opacity-30 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:border-opacity-50"
              style={inputStyle}
            />
          </div>
          <div>
            <Label className="block mb-2 text-sm">
              Apellido
            </Label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Tu apellido"
              className="w-full px-4 py-3 rounded-xl border border-opacity-30 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:border-opacity-50"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <Label className="block mb-2 text-sm">
            Email
          </Label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl border border-opacity-30 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:border-opacity-50"
              style={inputStyle}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>
        </div>

        {/* Password Fields */}
        <div>
          <Label className="block mb-2 text-sm">
            Contraseña
          </Label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-3 rounded-xl border border-opacity-30 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:border-opacity-50"
              style={inputStyle}
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

        <div>
          <Label className="block mb-2 text-sm">
            Confirmar Contraseña
          </Label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirma tu contraseña"
            className="w-full px-4 py-3 rounded-xl border border-opacity-30 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:border-opacity-50"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Password Strength Indicator */}
      {formData.password && (
        <div className="space-y-2">
          <Text className="text-sm opacity-75">
            Fortaleza de contraseña:
          </Text>
          <div className="flex space-x-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-1 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor: formData.password.length >= i * 2 
                    ? (formData.password.length >= 8 ? theme.colors.success : theme.colors.warning)
                    : theme.colors.border + '30'
                }}
              ></div>
            ))}
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className="flex items-start space-x-2">
        <input
          type="checkbox"
          id="acceptTerms"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-1 rounded border-gray-300 focus:ring-2"
          style={{ accentColor: theme.colors.primary }}
        />
        <Label htmlFor="acceptTerms" className="text-sm cursor-pointer">
          Acepto los{' '}
          <button
            type="button"
            className="transition-colors hover:opacity-80"
            style={{ color: theme.colors.primary }}
          >
            términos y condiciones
          </button>{' '}
          y la{' '}
          <button
            type="button"
            className="transition-colors hover:opacity-80"
            style={{ color: theme.colors.primary }}
          >
            política de privacidad
          </button>
        </Label>
      </div>

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
            <span>Creando cuenta...</span>
          </Flex>
        ) : (
          'Crear Cuenta'
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
            O regístrate con
          </span>
        </div>
      </div>

      {/* Social Register */}
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

      {/* Toggle to Login */}
      <div className="text-center mt-6">
        <Text className="text-sm">
          ¿Ya tienes una cuenta?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="font-semibold transition-colors hover:opacity-80"
            style={{ color: theme.colors.primary }}
          >
            Inicia sesión aquí
          </button>
        </Text>
      </div>
    </form>
  )
}