'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
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

  // Ref y no estado: solo la lee el listener y no debe provocar re-render ni
  // volver a suscribirlo.
  const huboSesion = useRef(false)

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
      setUser(session?.user ?? null)
      setIsLoading(false)

      // ⚠️ `SIGNED_OUT` NO significa "el usuario cerró sesión": Supabase también
      // lo emite al inicializar el cliente en una página sin sesión previa
      // (comprobado en consola: INITIAL_SESSION seguido de SIGNED_OUT, ambos
      // sin usuario). Redirigir ante cualquiera de esos eventos rompía el
      // enlace de recuperación: la pantalla `/auth/reset` se montaba, este
      // listener disparaba antes de que el cliente terminara de procesar el
      // token del fragmento, y mandaba a login sin darle tiempo.
      //
      // Por eso solo se navega cuando ANTES hubo un usuario de verdad, que es
      // el cierre de sesión real. El resto de las redirecciones ya las resuelve
      // el middleware, que además es la defensa que no se puede saltear.
      if (event === 'SIGNED_OUT' && huboSesion.current) {
        huboSesion.current = false
        setTimeout(() => {
          router.push('/auth/login')
        }, 100)
      }

      if (session?.user) huboSesion.current = true
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