import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verificar autenticación
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Error de sesión:', sessionError)
      return NextResponse.json({ error: 'Error de autenticación' }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener projectId desde query params
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'ProjectId requerido' }, { status: 400 })
    }

    // Verificar que el usuario tiene acceso al proyecto
    const { data: userProjects } = await supabase
      .rpc('get_user_projects', { user_uuid: session.user.id })

    const hasAccess = userProjects?.some((project: any) => project.project_id === projectId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin acceso al proyecto' }, { status: 403 })
    }

    // Obtener inventario del proyecto
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select(`
        *,
        suppliers(
          id,
          name,
          email
        )
      `)
      .eq('project_id', projectId)
      .order('sku', { ascending: true })

    if (inventoryError) {
      console.error('Error obteniendo inventario:', inventoryError)
      return NextResponse.json({ 
        error: 'Error obteniendo inventario', 
        details: inventoryError.message 
      }, { status: 500 })
    }

    // Estadísticas adicionales
    const totalItems = inventory?.length || 0
    const totalValue = inventory?.reduce((sum, item) => {
      return sum + (item.quantity_available * (item.unit_cost || 0))
    }, 0) || 0
    
    const lowStockItems = inventory?.filter(item => 
      item.reorder_level && item.quantity_available <= item.reorder_level
    ) || []

    return NextResponse.json({
      success: true,
      data: {
        inventory,
        stats: {
          totalItems,
          totalValue: parseFloat(totalValue.toFixed(2)),
          lowStockCount: lowStockItems.length,
          lowStockItems: lowStockItems.map(item => ({
            id: item.id,
            sku: item.sku,
            product_name: item.product_name,
            quantity_available: item.quantity_available,
            reorder_level: item.reorder_level
          }))
        }
      }
    })

  } catch (error) {
    console.error('Error en API de inventario:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, ...inventoryData } = body

    // Verificar acceso al proyecto
    const { data: userProjects } = await supabase
      .rpc('get_user_projects', { user_uuid: session.user.id })

    const hasAccess = userProjects?.some((project: any) => project.project_id === projectId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin acceso al proyecto' }, { status: 403 })
    }

    // Crear nuevo item de inventario
    const { data: newItem, error } = await supabase
      .from('inventory')
      .insert({
        ...inventoryData,
        project_id: projectId
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ 
        error: 'Error creando item de inventario', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newItem
    })

  } catch (error) {
    console.error('Error en POST inventario:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}