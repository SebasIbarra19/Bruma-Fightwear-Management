'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SmartLogoNavbar } from '@/components/common/SmartLogo'
import { ThemeSelector } from '@/components/ui/theme-selector'
import { useTheme } from '@/contexts/ThemeContext'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { theme } = useTheme()
  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    // El middleware ya maneja la redirección de autenticación
    // Solo cargar el perfil si hay usuario
    if (user && !isLoading) {
      loadProfile()
    }
  }, [user, isLoading])

  const loadProfile = async () => {
    if (!user) return

    try {
      setProfileLoading(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
      }

      // Combinar datos del usuario con perfil
      setProfile({
        id: user.id,
        email: user.email,
        full_name: data?.full_name || user.user_metadata?.full_name || '',
        phone: data?.phone || user.user_metadata?.phone || '',
        company: data?.company || 'BRUMA Fightwear',
        role: data?.role || 'Usuario',
        avatar_url: data?.avatar_url || user.user_metadata?.avatar_url || '',
        created_at: user.created_at
      })
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <p style={{ color: theme.colors.textPrimary }}>Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <p style={{ color: theme.colors.error }}>No se pudo cargar el perfil</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Volver al Dashboard
          </Button>
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
                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <CardTitle style={{ color: theme.colors.textPrimary }}>
                  {profile?.full_name || profile?.email?.split('@')[0] || 'Usuario'}
                </CardTitle>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  {profile?.email}
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
                  {profile?.email}
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
                  {profile?.id?.substring(0, 8)}...
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