// ================================================
// 📊 INVENTORY STATS API
// Endpoint: /api/inventory/stats
// ================================================

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return Response.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    console.log('📊 API Inventory Stats: Consultando estadísticas para proyecto:', projectId)

    // Crear cliente con service role para server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found')
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Llamar al stored procedure para obtener estadísticas de valuación
    const { data: statsData, error } = await supabase
      .rpc('get_inventory_valuation', {
        p_project_id: projectId
      } as any)

    if (error) {
      console.error('❌ Error consultando estadísticas:', error)
      return Response.json(
        { error: 'Error fetching inventory stats' },
        { status: 500 }
      )
    }

    if (!statsData || (statsData as any)?.length === 0) {
      console.log('⚠️ No se encontraron datos de inventario')
      return Response.json({
        success: true,
        data: {
          total_products: 0,
          total_items: 0,
          total_value: 0,
          low_stock_items: 0
        }
      })
    }

    // Los datos vienen directamente del stored procedure con las estadísticas calculadas
    const stats = (statsData as any)?.[0] || {}
    
    const result = {
      total_products: stats.total_products || 0,
      total_items: stats.total_items || 0,
      total_value: Number((stats.total_value || 0).toFixed(2)),
      low_stock_items: stats.low_stock_items || 0
    }

    console.log('✅ Estadísticas calculadas:', result)

    return Response.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('💥 Error en API inventory stats:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}