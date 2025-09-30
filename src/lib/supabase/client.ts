import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

// Cliente optimizado para cookies automáticas
export function createClient() {
  return createClientComponentClient<Database>()
}