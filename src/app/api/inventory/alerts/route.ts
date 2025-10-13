// ================================================
// ⚠️ INVENTORY ALERTS API
// Endpoint: /api/inventory/alerts
// ================================================

import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // Query para alertas de stock bajo
    const { data: inventoryAlerts, error: inventoryError } = await supabase
      .from('inventory')
      .select('*')
      .eq('project_id', projectId)
      .lte('quantity_available', 5) // Items con stock <= 5 (incluye sin stock y stock bajo)
      .range(offset, offset + limit - 1)
      .order('quantity_available', { ascending: true })

    if (inventoryError) {
      console.error('❌ Error consultando alertas:', inventoryError)
      return Response.json(
        { error: 'Error fetching inventory alerts' },
        { status: 500 }
      )
    }

    // Obtener productos y variantes para los nombres reales
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku')
      .eq('project_id', projectId)

    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, name, sku, product_id')

    if (productsError || variantsError) {
      console.error('❌ Error obteniendo productos/variantes:', productsError || variantsError)
    }

    // Crear mapas para búsqueda rápida
    const productMap = new Map()
    const variantMap = new Map()

    products?.forEach(product => {
      productMap.set(product.id, product)
    })

    variants?.forEach(variant => {
      variantMap.set(variant.id, variant)
    })

    // Transformar datos al formato esperado con nombres reales
    const transformedAlerts = (inventoryAlerts || []).map((item: any) => {
      const variant = variantMap.get(item.variant_id)
      const product = productMap.get(item.product_id)

      return {
        alert_id: item.id,
        product_id: item.product_id || 'unknown',
        product_name: product?.name || `Producto ${item.id.slice(-4)}`,
        variant_id: item.variant_id || 'unknown',
        variant_name: variant?.name || `Variante ${item.variant_id?.slice(-4) || 'N/A'}`,
        variant_sku: variant?.sku || item.sku,
        current_stock: item.quantity_available || 0,
        reorder_level: item.reorder_level || 0,
        reorder_quantity: item.reorder_quantity || 10,
        suggested_order_quantity: Math.max(
          item.reorder_quantity || 10,
          Math.max(0, (item.reorder_level || 0) - (item.quantity_available || 0))
        ),
        alert_level: 
          item.quantity_available === 0 ? 'critical' :
          item.quantity_available <= ((item.reorder_level || 0) * 0.5) ? 'high' :
          item.quantity_available <= (item.reorder_level || 0) ? 'medium' : 'low',
        estimated_cost: Number((Math.max(
          item.reorder_quantity || 10,
          Math.max(0, (item.reorder_level || 0) - (item.quantity_available || 0))
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