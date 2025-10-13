import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    if (!projectId) {
      return Response.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    console.log('📋 API Inventory Items: Consultando items para proyecto:', projectId)

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

    // Llamar al stored procedure para obtener items de inventario
    console.log('📋 Calling list_inventory_items SP with params:', {
      p_project_id: projectId,
      p_limit: limit,
      p_offset: 0,
      p_include_zero_stock: true,
      p_category_filter: null,
      p_location_filter: null
    })

    const { data: inventoryData, error } = await supabase
      .rpc('list_inventory_items', {
        p_project_id: projectId,
        p_limit: limit,
        p_offset: 0,
        p_include_zero_stock: true,
        p_category_filter: null,
        p_location_filter: null
      } as any)

    console.log('📋 SP Response:', { data: inventoryData, error })

    if (error) {
      console.error('❌ Error consultando inventory items:', error)
      return Response.json(
        { 
          error: 'Error fetching inventory items', 
          details: error,
          message: error.message || 'Unknown database error',
          code: error.code || 'UNKNOWN'
        },
        { status: 500 }
      )
    }

    console.log('✅ Inventory items data type:', typeof inventoryData, inventoryData)

    // Las funciones ahora retornan JSON, así que necesitamos parsearlo
    let parsedData: any[] = []
    
    if (inventoryData) {
      // Si es string JSON, parsearlo
      if (typeof inventoryData === 'string') {
        try {
          parsedData = JSON.parse(inventoryData)
        } catch (e) {
          console.error('Error parsing JSON:', e)
          parsedData = []
        }
      } 
      // Si ya es array/object, usarlo directamente
      else if (Array.isArray(inventoryData)) {
        parsedData = inventoryData
      }
      // Si es un objeto JSON, podría ser el resultado directo
      else if (inventoryData && typeof inventoryData === 'object') {
        parsedData = Array.isArray(inventoryData) ? inventoryData : [inventoryData]
      }
    }

    console.log('✅ Parsed inventory items:', parsedData?.length || 0)

    // Agrupar por productos usando los datos del SP
    const productGroups = new Map()

    parsedData?.forEach((item: any) => {
      const variantData = {
        inventory_id: item.inventory_id,
        variant_id: item.variant_id,
        variant_name: item.variant_name || `Variante ${item.variant_id?.slice(-4) || 'N/A'}`,
        variant_sku: item.variant_sku || item.product_sku,
        size: item.variant_size || 'N/A',
        color: item.variant_color || 'N/A',
        quantity_available: item.current_stock || 0,
        quantity_reserved: item.reserved_stock || 0,
        quantity_on_order: item.on_order_stock || 0,
        reorder_level: item.reorder_point || 10,
        reorder_quantity: item.reorder_quantity || 20,
        unit_cost: Number((item.unit_cost || 25.00).toFixed(2)),
        total_value: Number((item.total_value || 0).toFixed(2)),
        location: item.location || 'Almacén Principal',
        stock_status: item.stock_status || 'normal',
        needs_reorder: item.needs_reorder || false,
        created_at: item.created_at,
        updated_at: item.updated_at
      }

      if (!productGroups.has(item.product_id)) {
        productGroups.set(item.product_id, {
          id: item.product_id,
          name: item.product_name || `Producto ${item.product_id?.slice(-4)}`,
          sku: item.product_sku || 'N/A',
          category_name: item.category_name || 'Sin Categoría',
          total_variants: 0,
          total_stock: 0,
          total_value: 0,
          variants: [],
          status: 'good' // Se calculará después
        })
      }

      const productGroup = productGroups.get(item.product_id)
      productGroup.variants.push(variantData)
      productGroup.total_variants += 1
      productGroup.total_stock += variantData.quantity_available
      productGroup.total_value += variantData.total_value

      // Determinar estado general del producto
      const hasOutOfStock = productGroup.variants.some((v: any) => v.stock_status === 'out_of_stock')
      const hasLowStock = productGroup.variants.some((v: any) => v.stock_status === 'low_stock')
      
      if (hasOutOfStock) {
        productGroup.status = 'critical'
      } else if (hasLowStock) {
        productGroup.status = 'warning'
      } else {
        productGroup.status = 'good'
      }
    })

    const transformedItems = Array.from(productGroups.values())

    console.log(`✅ ${transformedItems.length} items transformados`)

    return Response.json({
      success: true,
      data: transformedItems,
      total: transformedItems.length,
      pagination: {
        limit,
        offset: 0,
        hasMore: transformedItems.length === limit
      }
    })

  } catch (error) {
    console.error('❌ Error en API inventory items:', error)
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}