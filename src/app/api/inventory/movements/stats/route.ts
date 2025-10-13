// ================================================
// 📊 INVENTORY MOVEMENTS STATS API
// Endpoint: /api/inventory/movements/stats
// ================================================

import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    if (!projectId) {
      return Response.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    console.log('📊 API Movement Stats: Consultando estadísticas para proyecto:', projectId)

    // Llamar al stored procedure para obtener estadísticas
    const { data: stats, error } = await supabase
      .rpc('get_inventory_movement_stats', {
        p_project_id: projectId,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null
      })

    if (error) {
      console.error('❌ Error consultando estadísticas de movimientos:', error)
      return Response.json(
        { error: 'Error fetching movement statistics' },
        { status: 500 }
      )
    }

    const statsData = stats?.[0] || {}

    // Transformar datos al formato esperado
    const transformedStats = {
      total_movements: statsData.total_movements || 0,
      movements_by_type: {
        entries: statsData.total_entries || 0,
        exits: statsData.total_exits || 0,
        transfers: statsData.total_transfers || 0,
        adjustments: statsData.total_adjustments || 0
      },
      financial_summary: {
        total_value_in: Number((statsData.total_value_in || 0).toFixed(2)),
        total_value_out: Number((statsData.total_value_out || 0).toFixed(2)),
        net_value: Number((statsData.net_value || 0).toFixed(2))
      },
      insights: {
        most_active_product: statsData.most_active_product || 'N/A',
        recent_movements: statsData.recent_movements || 0,
        movement_velocity: statsData.recent_movements ? 
          Math.round((statsData.recent_movements / 7) * 10) / 10 : 0 // Movimientos por día
      }
    }

    console.log('✅ Estadísticas de movimientos obtenidas')

    return Response.json({
      success: true,
      data: transformedStats,
      period: {
        date_from: dateFrom,
        date_to: dateTo,
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('💥 Error en API movement stats:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}