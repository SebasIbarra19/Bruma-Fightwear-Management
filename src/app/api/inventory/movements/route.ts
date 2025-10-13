// ================================================
// 📦 INVENTORY MOVEMENTS API
// Endpoint: /api/inventory/movements
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
    const movementType = searchParams.get('type') // entrada, salida, transferencia, ajuste
    const dateFrom = searchParams.get('dateFrom') 
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')
    
    if (!projectId) {
      return Response.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    console.log('📦 API Inventory Movements: Consultando movimientos para proyecto:', projectId)

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

    // Llamar al stored procedure para obtener movimientos
    console.log('📦 Calling get_inventory_movements SP with params:', {
      p_project_id: projectId,
      p_limit: limit,
      p_offset: offset,
      p_movement_type: movementType || null,
      p_date_from: dateFrom || null,
      p_date_to: dateTo || null,
      p_search_term: search || null
    })

    const { data: movements, error } = await supabase
      .rpc('get_inventory_movements', {
        p_project_id: projectId,
        p_limit: limit,
        p_offset: offset,
        p_movement_type: movementType || null,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null,
        p_search_term: search || null
      } as any)

    console.log('📦 SP Response:', { data: movements, error })

    if (error) {
      console.error('❌ Error consultando movimientos:', error)
      return Response.json(
        { 
          error: 'Error fetching inventory movements',
          details: error,
          message: error.message || 'Unknown database error',
          code: error.code || 'UNKNOWN'
        },
        { status: 500 }
      )
    }

    // Transformar datos al formato esperado por el frontend
    const transformedMovements = ((movements as any) || []).map((movement: any) => ({
      id: movement.movement_id,
      type: movement.movement_type,
      product_id: movement.product_id,
      product_name: movement.product_name,
      product_sku: movement.product_sku,
      variant_id: movement.variant_id,
      variant_name: movement.variant_name,
      variant_sku: movement.variant_sku,
      sku: movement.variant_sku || movement.product_sku, // SKU principal para mostrar
      quantity: movement.quantity,
      unit_cost: Number((movement.unit_cost || 0).toFixed(2)),
      total_cost: Number((movement.total_cost || 0).toFixed(2)),
      location_from: movement.location_from || 'N/A',
      location_to: movement.location_to || 'N/A',
      reason: movement.reason || 'Sin especificar',
      reference: movement.reference_number || 'N/A',
      user: movement.user_name || 'Sistema',
      date: movement.created_at,
      notes: movement.notes,
      created_at: movement.created_at,
      updated_at: movement.updated_at
    }))

    console.log(`✅ ${transformedMovements.length} movimientos encontrados`)

    return Response.json({
      success: true,
      data: transformedMovements,
      total: transformedMovements.length,
      pagination: {
        limit,
        offset,
        hasMore: transformedMovements.length === limit
      },
      filters: {
        movement_type: movementType,
        date_from: dateFrom,
        date_to: dateTo,
        search
      }
    })

  } catch (error) {
    console.error('💥 Error en API inventory movements:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      projectId,
      movementType,
      productId,
      variantId,
      quantity,
      unitCost,
      locationFrom,
      locationTo,
      reason,
      referenceNumber,
      userName,
      notes
    } = body

    if (!projectId || !movementType || !productId || quantity === undefined) {
      return Response.json(
        { error: 'Missing required fields: projectId, movementType, productId, quantity' },
        { status: 400 }
      )
    }

    console.log('📦 API Inventory Movements: Creando nuevo movimiento:', {
      projectId,
      movementType,
      productId,
      quantity
    })

    // Crear cliente con service role para server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabaseServerSide = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Llamar al stored procedure para crear movimiento
    const { data: movementId, error } = await supabaseServerSide
      .rpc('create_inventory_movement', {
        p_project_id: projectId,
        p_movement_type: movementType,
        p_product_id: productId,
        p_variant_id: variantId || null,
        p_quantity: quantity,
        p_unit_cost: unitCost || 0.00,
        p_location_from: locationFrom || null,
        p_location_to: locationTo || null,
        p_reason: reason || null,
        p_reference_number: referenceNumber || null,
        p_user_name: userName || 'Sistema',
        p_notes: notes || null
      } as any)

    if (error) {
      console.error('❌ Error creando movimiento:', error)
      return Response.json(
        { error: 'Error creating inventory movement' },
        { status: 500 }
      )
    }

    console.log('✅ Movimiento creado exitosamente:', movementId)

    return Response.json({
      success: true,
      data: {
        movement_id: movementId,
        message: 'Movimiento de inventario creado exitosamente'
      }
    })

  } catch (error) {
    console.error('💥 Error en API inventory movements POST:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}