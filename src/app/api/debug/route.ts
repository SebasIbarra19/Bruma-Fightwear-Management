// ================================================
// 🔧 DEBUG API - TEST SERVICE ROLE
// ================================================

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    console.log('🔧 DEBUG: Testing service role configuration')
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔧 SUPABASE_URL exists:', !!supabaseUrl)
    console.log('🔧 SERVICE_ROLE_KEY exists:', !!supabaseServiceKey)
    console.log('🔧 SERVICE_ROLE_KEY length:', supabaseServiceKey?.length || 0)
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({
        error: 'Missing environment variables',
        details: {
          supabaseUrl: !!supabaseUrl,
          serviceKey: !!supabaseServiceKey
        }
      }, { status: 500 })
    }

    // Crear cliente con service role
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test simple: obtener projects
    console.log('🔧 Testing simple query...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(3)

    if (projectsError) {
      console.error('🔧 Projects query error:', projectsError)
      return Response.json({
        error: 'Projects query failed',
        details: projectsError
      }, { status: 500 })
    }

    console.log('🔧 Projects found:', projects?.length || 0)

    // Test stored procedure existente
    if (projectId) {
      console.log('🔧 Testing get_inventory_valuation SP...')
      const { data: spData, error: spError } = await supabase
        .rpc('get_inventory_valuation', {
          p_project_id: projectId
        } as any)

      console.log('🔧 SP Result:', { data: spData, error: spError })

      return Response.json({
        success: true,
        environment: {
          supabaseUrl: !!supabaseUrl,
          serviceKey: !!supabaseServiceKey,
          serviceKeyLength: supabaseServiceKey?.length
        },
        projects: projects?.length || 0,
        storedProcedure: {
          projectId,
          data: spData,
          error: spError
        }
      })
    }

    return Response.json({
      success: true,
      environment: {
        supabaseUrl: !!supabaseUrl,
        serviceKey: !!supabaseServiceKey,
        serviceKeyLength: supabaseServiceKey?.length
      },
      projects: projects?.length || 0
    })

  } catch (error) {
    console.error('🔧 DEBUG API Error:', error)
    return Response.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}