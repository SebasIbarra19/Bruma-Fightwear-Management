// ================================================
// ⚠️ INVENTORY ALERTS API
// Endpoint: /api/inventory/alerts
// ================================================

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    if (!projectId) {
      return Response.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    console.log('⚠️ API Inventory Alerts: Consultando alertas para proyecto:', projectId)

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

    // Llamar al stored procedure para obtener alertas
    console.log('🚨 Calling get_low_stock_alerts SP with params:', {
      p_project_id: projectId,
      p_limit: limit,
      p_offset: offset,
      p_alert_threshold: 5,
      p_include_out_of_stock: true
    })

    const { data: alertsData, error } = await supabase
      .rpc('get_low_stock_alerts', {
        p_project_id: projectId,
        p_limit: limit,
        p_offset: offset,
        p_alert_threshold: 5, // Items con stock <= 5
        p_include_out_of_stock: true
      } as any)

    console.log('🚨 SP Response:', { data: alertsData, error })

    if (error) {
      console.error('❌ Error consultando alertas:', error)
      return Response.json(
        { 
          error: 'Error fetching inventory alerts',
          details: error,
          message: error.message || 'Unknown database error',
          code: error.code || 'UNKNOWN'
        },
        { status: 500 }
      )
    }

    // Las funciones ahora retornan JSON, así que necesitamos parsearlo
    let parsedAlerts: any[] = []
    
    if (alertsData) {
      // Si es string JSON, parsearlo
      if (typeof alertsData === 'string') {
        try {
          parsedAlerts = JSON.parse(alertsData)
        } catch (e) {
          console.error('Error parsing alerts JSON:', e)
          parsedAlerts = []
        }
      } 
      // Si ya es array/object, usarlo directamente
      else if (Array.isArray(alertsData)) {
        parsedAlerts = alertsData
      }
      // Si es un objeto JSON, podría ser el resultado directo
      else if (alertsData && typeof alertsData === 'object') {
        parsedAlerts = Array.isArray(alertsData) ? alertsData : [alertsData]
      }
    }

    console.log('✅ Parsed alerts:', parsedAlerts?.length || 0)

    // Transformar datos al formato esperado con nombres reales del SP
    const transformedAlerts = (parsedAlerts || []).map((item: any) => {
      return {
        alert_id: item.inventory_id,
        product_id: item.product_id || 'unknown',
        product_name: item.product_name || `Producto ${item.product_id?.slice(-4)}`,
        variant_id: item.variant_id || 'unknown',
        variant_name: item.variant_name || `Variante ${item.variant_id?.slice(-4) || 'N/A'}`,
        variant_sku: item.variant_sku || item.product_sku,
        current_stock: item.current_stock || 0,
        reorder_level: item.reorder_level || 0,
        reorder_quantity: item.reorder_quantity || 10,
        suggested_order_quantity: Math.max(
          item.reorder_quantity || 10,
          Math.max(0, (item.reorder_level || 0) - (item.current_stock || 0))
        ),
        alert_level: 
          item.current_stock === 0 ? 'critical' :
          item.current_stock <= ((item.reorder_level || 0) * 0.5) ? 'high' :
          item.current_stock <= (item.reorder_level || 0) ? 'medium' : 'low',
        estimated_cost: Number((Math.max(
          item.reorder_quantity || 10,
          Math.max(0, (item.reorder_level || 0) - (item.current_stock || 0))
        ) * (item.average_cost || 0)).toFixed(2)),
        location: item.location || 'Almacén Principal',
        last_updated: item.updated_at
      }
    })

    console.log(`✅ ${transformedAlerts.length} alertas encontradas`)

    return Response.json({
      success: true,
      data: transformedAlerts,
      total: transformedAlerts.length
    })

  } catch (error) {
    console.error('💥 Error en API inventory alerts:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}