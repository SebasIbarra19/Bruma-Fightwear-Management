'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { validateEmail } from '@/utils'
import { SmartLogoCard } from '@/components/common/SmartLogo'
import { useTheme } from '@/contexts/ThemeContext'

export default function LoginPage() {
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!validateEmail(email)) {
      setError('Por favor ingresa un email válido')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div 
        className="max-w-md w-full space-y-8 p-8 rounded-xl shadow-lg"
        style={{ 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.colors.shadow
        }}
      >
        <div className="text-center">
          <SmartLogoCard showText={true} />
          <h3 className="text-lg mt-4" style={{ color: theme.colors.textPrimary }}>Iniciar Sesión</h3>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div 
              className="px-4 py-3 rounded-md border"
              style={{ 
                backgroundColor: theme.colors.error + '20',
                borderColor: theme.colors.error,
                color: theme.colors.error
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary,
                  '--tw-ring-color': theme.colors.primary
                } as React.CSSProperties}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary,
                  '--tw-ring-color': theme.colors.primary
                } as React.CSSProperties}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.textInverse,
                borderColor: theme.colors.primary,
                '--tw-ring-color': theme.colors.primary
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primaryHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary
              }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              ¿No tienes una cuenta?{' '}
              <Link 
                href="/auth/register" 
                className="font-medium hover:underline transition-colors"
                style={{ color: theme.colors.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.primaryHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.primary
                }}
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}