// ================================================
// 🔌 SUPABASE CLIENT SINGLETON
// Cliente centralizado con service role para server-side
// ================================================

import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Cliente Supabase Singleton para uso en server-side
 * Usa service role key para bypass RLS
 */
export class SupabaseServiceClient {
  private static instance: SupabaseServiceClient
  private client: SupabaseClientType<Database>

  private constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }

    if (!supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    }

    this.client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        /**
         * Adjunta `x-bruma-user` a cada llamada para que los triggers sepan
         * quién hizo el cambio.
         *
         * ¿Por qué acá y no en cada stored procedure? Porque PostgREST publica
         * las cabeceras HTTP en la variable de sesión `request.headers`, y
         * `actor()` (migración 20260827000000) las lee. Interceptando `fetch`
         * en un solo lugar quedan atribuidas TODAS las escrituras —las de hoy y
         * las que se escriban mañana— sin cambiar ninguna firma ni depender de
         * que alguien se acuerde de pasar el usuario.
         *
         * El token de servicio no lleva identidad (sus claims son
         * exp/iat/iss/ref/role, sin `sub`), así que sin esta cabecera
         * `auth.uid()` dentro de un trigger es NULL siempre.
         */
        fetch: async (input, init) => {
          const headers = new Headers(init?.headers)

          try {
            // Memoizado por request, así que preguntarlo en cada llamada a la
            // base no agrega viajes al servidor de Auth.
            const { getSessionUser } = await import('@/lib/api/middleware')
            const user = await getSessionUser()
            if (user?.id) headers.set('x-bruma-user', user.id)
          } catch {
            // Fuera de una petición HTTP —un script, el build— no hay cookies
            // que leer. La operación sigue; la bitácora la registra sin autor,
            // que es exactamente lo que corresponde: no vino de la aplicación.
          }

          return fetch(input, { ...init, headers })
        }
      }
    })

    console.log('✅ Supabase Service Client initialized')
  }

  /**
   * Obtiene la instancia singleton del cliente
   */
  static getInstance(): SupabaseServiceClient {
    if (!SupabaseServiceClient.instance) {
      SupabaseServiceClient.instance = new SupabaseServiceClient()
    }
    return SupabaseServiceClient.instance
  }

  /**
   * Obtiene el cliente de Supabase
   */
  getClient(): SupabaseClientType<Database> {
    return this.client
  }

  /**
   * Verifica si el cliente está configurado correctamente
   */
  isConfigured(): boolean {
    return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
  }
}

/**
 * Helper function para obtener el cliente directamente
 */
export function getSupabaseServiceClient(): SupabaseClientType<Database> {
  return SupabaseServiceClient.getInstance().getClient()
}
