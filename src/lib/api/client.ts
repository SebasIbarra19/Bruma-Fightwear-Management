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
