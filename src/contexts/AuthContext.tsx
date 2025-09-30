'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error obteniendo sesión inicial:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      setUser(session?.user ?? null)
      setIsLoading(false)

      // El middleware maneja las redirecciones automáticamente
      // Solo redirigir en logout explícito
      if (event === 'SIGNED_OUT') {
        // Delay para permitir que las cookies se limpien
        setTimeout(() => {
          router.push('/auth/login')
        }, 100)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, router])

  const signOut = async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signOut()
      // La redirección se maneja en onAuthStateChange
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('Error refrescando sesión:', error)
      setUser(null)
    }
  }

  const value = {
    user,
    isLoading,
    signOut,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}