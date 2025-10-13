import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente con service role para bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const projectId = searchParams.get('project_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const parentId = searchParams.get('parent_id')
    const includeChildren = searchParams.get('include_children') === 'true'

    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id es requerido' },
        { status: 400 }
      )
    }

    console.log('🔍 API Categories: Consultando categorías para proyecto:', projectId)
    console.log('📄 Parámetros:', { page, limit, search, parentId, includeChildren })

    // Calcular offset
    const offset = (page - 1) * limit

    // Query directo sin stored procedures (igual que productos)
    let query = supabase
      .from('categories')
      .select('*', { count: 'exact' })
      .eq('project_id', projectId)

    // Aplicar filtros
    if (parentId) {
      query = query.eq('parent_id', parentId)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Aplicar paginación y ordenamiento
    const { data, count, error } = await query
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Error consultando categorías:', error)
      return NextResponse.json(
        { error: 'Error consultando categorías', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Categorías encontradas: ${data?.length || 0} de ${count || 0} total`)

    // Si necesitamos conteo de productos, haremos una consulta separada
    let categoriesWithCount = data || []
    
    if (data && data.length > 0) {
      // Obtener conteos de productos para cada categoría
      const categoryIds = data.map(cat => cat.id)
      
      const { data: productCounts } = await supabase
        .from('products')
        .select('category_id')
        .in('category_id', categoryIds)
        .eq('project_id', projectId)
      
      // Crear mapa de conteos
      const countMap = (productCounts || []).reduce((acc: any, product: any) => {
        acc[product.category_id] = (acc[product.category_id] || 0) + 1
        return acc
      }, {})
      
      // Agregar conteos a las categorías
      categoriesWithCount = data.map((category: any) => ({
        ...category,
        product_count: countMap[category.id] || 0,
        children_count: 0, // Placeholder, se puede calcular después si se necesita
        total_count: count || 0
      }))
    }

    // Transformar datos para coincidir con el formato esperado
    const transformedData = categoriesWithCount

    return NextResponse.json({
      success: true,
      data: {
        data: transformedData,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('💥 Error inesperado en API categories:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}