'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SmartLogoNavbar } from '@/components/common/SmartLogo'
import { ThemeSelector } from '@/components/ui/theme-selector'
import { useTheme } from '@/contexts/ThemeContext'
import type { User } from '@supabase/auth-helpers-nextjs'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { theme } = useTheme()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }
      
      setUser(session.user)
      setLoading(false)
    }
    
    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <p style={{ color: theme.colors.textPrimary }}>Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 50%, ${theme.colors.surfaceHover} 100%)` }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ backgroundColor: theme.colors.surface + '90', borderColor: theme.colors.border }}>
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <SmartLogoNavbar showText={true} />
              <div className="hidden md:flex items-center space-x-6">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="transition-colors hover:opacity-80" 
                  style={{ color: theme.colors.textSecondary }}
                >
                  ← Volver al Dashboard
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeSelector />
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
            Configuración del Perfil
          </h1>
          <p className="text-xl" style={{ color: theme.colors.textSecondary }}>
            Gestiona tu información personal y configuraciones de cuenta
          </p>
        </div>

        {/* Profile Card */}
        <Card 
          className="mb-8 backdrop-blur-sm border-0 shadow-lg"
          style={{ 
            backgroundColor: theme.colors.surface + 'DD',
            borderColor: theme.colors.border
          }}
        >
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                  color: 'white'
                }}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle style={{ color: theme.colors.textPrimary }}>
                  {user?.email?.split('@')[0] || 'Usuario'}
                </CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  {user?.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                  Email
                </label>
                <div 
                  className="p-3 rounded-lg border"
                  style={{ 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.textSecondary
                  }}
                >
                  {user?.email}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                  ID de Usuario
                </label>
                <div 
                  className="p-3 rounded-lg border font-mono text-sm"
                  style={{ 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.textSecondary
                  }}
                >
                  {user?.id?.substring(0, 8)}...
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Card */}
        <Card 
          className="backdrop-blur-sm border-0 shadow-lg"
          style={{ 
            backgroundColor: theme.colors.surface + 'DD',
            borderColor: theme.colors.border
          }}
        >
          <CardContent className="text-center py-12">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ 
                background: `linear-gradient(135deg, ${theme.colors.warning}20, ${theme.colors.info}20)` 
              }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.colors.warning }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: theme.colors.textPrimary }}>
              Configuraciones Avanzadas
            </h3>
            <p className="mb-6 max-w-md mx-auto" style={{ color: theme.colors.textSecondary }}>
              Las opciones de configuración del perfil estarán disponibles próximamente. Por ahora puedes ver tu información básica.
            </p>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="shadow-lg backdrop-blur-sm"
              style={{ 
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                border: 'none'
              }}
            >
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}