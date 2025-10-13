// ================================================
// 🔧 DEBUG INVENTORY STORED PROCEDURES
// ================================================

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId') || '4cffbb29-0a5b-414c-86c0-9589a19485d8'

    console.log('🔧 DEBUG INVENTORY: Testing stored procedures for project:', projectId)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return Response.json({
        error: 'SUPABASE_SERVICE_ROLE_KEY not found'
      }, { status: 500 })
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results: any = {}

    // 1. Verificar si las funciones existen (usando SQL directo)
    console.log('🔧 1. Checking function existence...')
    let functions = null
    let functionsError = null
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `
          SELECT proname, pronargs, proargnames, proargtypes 
          FROM pg_proc 
          WHERE proname IN (
            'list_inventory_items',
            'get_low_stock_alerts', 
            'get_inventory_movements',
            'get_inventory_movement_stats',
            'get_inventory_valuation'
          )
        `
      } as any)
      functions = data
      functionsError = error
    } catch (err) {
      functionsError = err instanceof Error ? err.message : 'Cannot access pg_proc'
      functions = []
    }

    results.functionsCheck = {
      error: functionsError,
      functions: functions || []
    }

    // 2. Test get_inventory_valuation (que sabemos que funciona)
    console.log('🔧 2. Testing get_inventory_valuation...')
    try {
      const { data: valuationData, error: valuationError } = await supabase
        .rpc('get_inventory_valuation', {
          p_project_id: projectId
        } as any)
      
      results.getInventoryValuation = {
        success: !valuationError,
        data: valuationData,
        error: valuationError
      }
    } catch (err) {
      results.getInventoryValuation = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // 3. Test list_inventory_items
    console.log('🔧 3. Testing list_inventory_items...')
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .rpc('list_inventory_items', {
          p_project_id: projectId,
          p_limit: 10,
          p_offset: 0,
          p_include_zero_stock: true,
          p_category_filter: null,
          p_location_filter: null
        } as any)
      
      results.listInventoryItems = {
        success: !itemsError,
        data: itemsData,
        error: itemsError,
        count: Array.isArray(itemsData) ? (itemsData as any[]).length : 0
      }
    } catch (err) {
      results.listInventoryItems = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // 4. Test get_low_stock_alerts
    console.log('🔧 4. Testing get_low_stock_alerts...')
    try {
      const { data: alertsData, error: alertsError } = await supabase
        .rpc('get_low_stock_alerts', {
          p_project_id: projectId,
          p_limit: 10,
          p_offset: 0,
          p_alert_threshold: 5,
          p_include_out_of_stock: true
        } as any)
      
      results.getLowStockAlerts = {
        success: !alertsError,
        data: alertsData,
        error: alertsError,
        count: Array.isArray(alertsData) ? (alertsData as any[]).length : 0
      }
    } catch (err) {
      results.getLowStockAlerts = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // 5. Test get_inventory_movements
    console.log('🔧 5. Testing get_inventory_movements...')
    try {
      const { data: movementsData, error: movementsError } = await supabase
        .rpc('get_inventory_movements', {
          p_project_id: projectId,
          p_limit: 10,
          p_offset: 0
        } as any)
      
      results.getInventoryMovements = {
        success: !movementsError,
        data: movementsData,
        error: movementsError,
        count: Array.isArray(movementsData) ? (movementsData as any[]).length : 0
      }
    } catch (err) {
      results.getInventoryMovements = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // 6. Verificar datos de inventario existentes
    console.log('🔧 6. Checking existing inventory data...')
    const { data: inventoryCount, error: countError } = await supabase
      .from('inventory')
      .select('id', { count: 'exact' })
      .eq('project_id', projectId)

    results.inventoryDataCheck = {
      totalRecords: inventoryCount?.length || 0,
      error: countError
    }

    return Response.json({
      success: true,
      projectId,
      timestamp: new Date().toISOString(),
      results
    })

  } catch (error) {
    console.error('🔧 DEBUG INVENTORY Error:', error)
    return Response.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}