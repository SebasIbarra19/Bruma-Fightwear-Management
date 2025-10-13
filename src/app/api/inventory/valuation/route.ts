// ================================================
// 💰 INVENTORY VALUATION API
// Endpoint: /api/inventory/valuation
// ================================================

import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    console.log('💰 API Inventory Valuation: Consultando valoración para proyecto:', projectId)

    // Query para obtener datos de inventario con precios
    const { data: items, error } = await supabase
      .from('inventory')
      .select(`
        id,
        quantity_available,
        average_cost,
        product_variants!inner(
          id,
          price_adjustment,
          is_active,
          products!inner(
            id,
            name,
            base_price,
            track_inventory,
            is_active,
            categories(
              id,
              name
            )
          )
        )
      `)
      .eq('project_id', projectId)
      .eq('product_variants.is_active', true)
      .eq('product_variants.products.is_active', true)
      .eq('product_variants.products.track_inventory', true)
      .gt('quantity_available', 0)

    if (error) {
      console.error('❌ Error consultando valoración:', error)
      return Response.json(
        { error: 'Error fetching inventory valuation' },
        { status: 500 }
      )
    }

    if (!items || items.length === 0) {
      console.log('⚠️ No se encontraron items con stock')
      return Response.json({
        success: true,
        data: {
          total_items: 0,
          total_quantity: 0,
          total_value_at_cost: 0,
          total_value_at_price: 0,
          potential_profit: 0,
          profit_margin: 0,
          category_breakdown: []
        }
      })
    }

    // Calcular totales
    let totalItems = 0
    let totalQuantity = 0
    let totalValueAtCost = 0
    let totalValueAtPrice = 0
    const categoryMap = new Map()

    items.forEach((item: any) => {
      const quantity = item.quantity_available || 0
      const cost = item.average_cost || 0
      const basePrice = item.product_variants.products.base_price || 0
      const priceAdjustment = item.product_variants.price_adjustment || 0
      const finalPrice = basePrice + priceAdjustment
      
      const valueAtCost = quantity * cost
      const valueAtPrice = quantity * finalPrice
      const categoryName = item.product_variants.products.categories?.name || 'Sin Categoría'
      const categoryId = item.product_variants.products.categories?.id || null

      totalItems += 1
      totalQuantity += quantity
      totalValueAtCost += valueAtCost
      totalValueAtPrice += valueAtPrice

      // Agrupar por categoría
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category_id: categoryId,
          category_name: categoryName,
          items: 0,
          quantity: 0,
          value_at_cost: 0,
          value_at_price: 0,
          profit: 0
        })
      }

      const categoryStats = categoryMap.get(categoryId)
      categoryStats.items += 1
      categoryStats.quantity += quantity
      categoryStats.value_at_cost += valueAtCost
      categoryStats.value_at_price += valueAtPrice
      categoryStats.profit += (valueAtPrice - valueAtCost)
    })

    const potentialProfit = totalValueAtPrice - totalValueAtCost
    const profitMargin = totalValueAtCost > 0 ? 
      Number(((potentialProfit / totalValueAtCost) * 100).toFixed(2)) : 0

    const categoryBreakdown = Array.from(categoryMap.values()).map(cat => ({
      ...cat,
      value_at_cost: Number(cat.value_at_cost.toFixed(2)),
      value_at_price: Number(cat.value_at_price.toFixed(2)),
      profit: Number(cat.profit.toFixed(2))
    }))

    const result = {
      total_items: totalItems,
      total_quantity: totalQuantity,
      total_value_at_cost: Number(totalValueAtCost.toFixed(2)),
      total_value_at_price: Number(totalValueAtPrice.toFixed(2)),
      potential_profit: Number(potentialProfit.toFixed(2)),
      profit_margin: profitMargin,
      category_breakdown: categoryBreakdown
    }

    console.log('✅ Valoración calculada:', result)

    return Response.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('💥 Error en API inventory valuation:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}