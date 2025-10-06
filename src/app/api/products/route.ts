// ================================================
// 🔧 API ROUTE - GET PRODUCTS
// Server-side endpoint para obtener productos sin SP
// ================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id parameter is required' },
        { status: 400 }
      )
    }
    
    console.log('🔍 API: Cargando productos para proyecto:', projectId)
    
    // Usar service role server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found')
      return NextResponse.json(
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
    
    // Query directo sin stored procedures
    const offset = (page - 1) * limit
    
    const { data: products, error, count } = await supabase
      .from('products')
      .select(`
        *,
        categories(name),
        product_lines(name)
      `, { count: 'exact' })
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('❌ API: Error obteniendo productos:', error)
      return NextResponse.json(
        { error: 'Database query error' },
        { status: 500 }
      )
    }
    
    console.log(`✅ API: ${products?.length || 0} productos encontrados`)
    
    // Transformar datos para coincidir con el formato del stored procedure
    const transformedProducts = products?.map((product: any) => ({
      ...product,
      category_name: product.categories?.name || null,
      product_line_name: product.product_lines?.name || null,
      variant_count: 0, // Placeholder - se puede calcular con otra query
      total_stock: 0,   // Placeholder - se puede calcular con otra query
      total_count: count || 0
    })) || []
    
    return NextResponse.json({
      success: true,
      data: {
        data: transformedProducts,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
    
  } catch (error) {
    console.error('❌ API: Error interno:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}