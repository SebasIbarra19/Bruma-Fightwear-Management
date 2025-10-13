import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // Query principal de inventario
    const { data: inventoryItems, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('project_id', projectId)
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error consultando inventory:', error)
      return Response.json(
        { error: 'Error fetching inventory items', details: error },
        { status: 500 }
      )
    }

    // Obtener datos relacionados
    const { data: products } = await supabase
      .from('products')
      .select('id, name, sku, category_id')
      .eq('project_id', projectId)

    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, product_id, name, sku, size, color')

    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('project_id', projectId)

    console.log('✅ Inventory items encontrados:', inventoryItems?.length || 0)

    // Crear mapas para búsquedas rápidas
    const productMap = new Map((products || []).map(p => [p.id, p]))
    const variantMap = new Map((variants || []).map(v => [v.id, v]))
    const categoryMap = new Map((categories || []).map(c => [c.id, c]))

    // Agrupar por productos
    const productGroups = new Map()

    inventoryItems.forEach((item: any) => {
      const variant = variantMap.get(item.variant_id)
      const product = productMap.get(item.product_id)
      const category = product ? categoryMap.get(product.category_id) : null

      const variantData = {
        inventory_id: item.id,
        variant_id: item.variant_id,
        variant_name: variant?.name || `Variante ${item.variant_id?.slice(-4) || 'N/A'}`,
        variant_sku: variant?.sku || item.sku,
        size: variant?.size || 'N/A',
        color: variant?.color || 'N/A',
        quantity_available: item.quantity_available || 0,
        quantity_reserved: item.quantity_reserved || 0,
        quantity_on_order: item.quantity_on_order || 0,
        reorder_level: item.reorder_level || 10,
        reorder_quantity: item.reorder_quantity || 20,
        unit_cost: Number((item.average_cost || 25.00).toFixed(2)),
        total_value: Number(((item.quantity_available || 0) * (item.average_cost || 25.00)).toFixed(2)),
        location: item.location || 'Almacén Principal',
        stock_status: 
          item.quantity_available === 0 ? 'out_of_stock' :
          item.quantity_available <= (item.reorder_level || 0) ? 'low_stock' :
          item.quantity_available <= ((item.reorder_level || 0) * 2) ? 'normal' : 'high_stock',
        needs_reorder: (item.quantity_available || 0) <= (item.reorder_level || 0),
        created_at: item.created_at,
        updated_at: item.updated_at
      }

      if (!productGroups.has(item.product_id)) {
        productGroups.set(item.product_id, {
          id: item.product_id,
          name: product?.name || `Producto ${item.id.slice(-4)}`,
          sku: product?.sku || item.sku,
          category_name: category?.name || 'Sin Categoría',
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