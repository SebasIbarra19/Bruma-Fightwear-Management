'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  company?: string
  role?: string
  avatar_url?: string
  created_at: string
}

interface UserProfilePopupProps {
  isOpen: boolean
  onClose: () => void
}

export function UserProfilePopup({ isOpen, onClose }: UserProfilePopupProps) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && user) {
      loadProfile()
    }
  }, [isOpen, user])

  const loadProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Intentar cargar perfil de Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
      }

      // Si no hay perfil en la base de datos, usar datos básicos del usuario
      const profileData: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: data?.full_name || user.user_metadata?.full_name || '',
        phone: data?.phone || user.user_metadata?.phone || '',
        company: data?.company || 'BRUMA Fightwear',
        role: data?.role || 'Usuario',
        avatar_url: data?.avatar_url || user.user_metadata?.avatar_url || '',
        created_at: user.created_at
      }

      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
      // Fallback con datos básicos
      setProfile({
        id: user.id,
        email: user.email || '',
        company: 'BRUMA Fightwear',
        role: 'Usuario',
        created_at: user.created_at
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditProfile = () => {
    onClose()
    router.push('/profile')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Popup */}
        <div
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-between items-start mb-4">
                <CardTitle style={{ color: theme.colors.textPrimary }}>
                  Perfil de Usuario
                </CardTitle>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg transition-colors"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                    color: 'white'
                  }}
                >
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" 
                       style={{ borderColor: theme.colors.primary }}></div>
                  <p style={{ color: theme.colors.textSecondary }}>Cargando perfil...</p>
                </div>
              ) : profile ? (
                <>
                  {/* Información básica */}
                  <div className="space-y-3">
                    {profile.full_name && (
                      <div>
                        <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                          Nombre completo
                        </label>
                        <p className="mt-1" style={{ color: theme.colors.textPrimary }}>
                          {profile.full_name}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                        Correo electrónico
                      </label>
                      <p className="mt-1" style={{ color: theme.colors.textPrimary }}>
                        {profile.email}
                      </p>
                    </div>

                    {profile.phone && (
                      <div>
                        <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                          Teléfono
                        </label>
                        <p className="mt-1" style={{ color: theme.colors.textPrimary }}>
                          {profile.phone}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                        Empresa
                      </label>
                      <p className="mt-1" style={{ color: theme.colors.textPrimary }}>
                        {profile.company}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                        Rol
                      </label>
                      <p className="mt-1" style={{ color: theme.colors.textPrimary }}>
                        {profile.role}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                        Miembro desde
                      </label>
                      <p className="mt-1" style={{ color: theme.colors.textPrimary }}>
                        {formatDate(profile.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleEditProfile}
                      className="flex-1"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: 'white',
                        borderColor: theme.colors.primary
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar perfil
                    </Button>
                    
                    <Button
                      onClick={onClose}
                      variant="outline"
                      style={{
                        borderColor: theme.colors.border,
                        color: theme.colors.textSecondary,
                        backgroundColor: 'transparent'
                      }}
                    >
                      Cerrar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p style={{ color: theme.colors.error }}>Error al cargar el perfil</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}