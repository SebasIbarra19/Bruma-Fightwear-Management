import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verificar autenticación
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener projectId desde query params
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'ProjectId requerido' }, { status: 400 })
    }

    // Verificar acceso al proyecto
    const { data: userProjects } = await supabase
      .rpc('get_user_projects', { user_uuid: session.user.id })

    const hasAccess = userProjects?.some((project: any) => project.project_id === projectId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin acceso al proyecto' }, { status: 403 })
    }

    // Obtener proveedores del proyecto
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true })

    if (suppliersError) {
      console.error('Error obteniendo proveedores:', suppliersError)
      return NextResponse.json({ 
        error: 'Error obteniendo proveedores', 
        details: suppliersError.message 
      }, { status: 500 })
    }

    // Estadísticas adicionales
    const totalSuppliers = suppliers?.length || 0
    const activeSuppliers = suppliers?.filter(s => s.is_active).length || 0
    const inactiveSuppliers = totalSuppliers - activeSuppliers

    return NextResponse.json({
      success: true,
      data: {
        suppliers,
        stats: {
          totalSuppliers,
          activeSuppliers,
          inactiveSuppliers
        }
      }
    })

  } catch (error) {
    console.error('Error en API de proveedores:', error)
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
    const { projectId, ...supplierData } = body

    // Verificar acceso al proyecto
    const { data: userProjects } = await supabase
      .rpc('get_user_projects', { user_uuid: session.user.id })

    const hasAccess = userProjects?.some((project: any) => project.project_id === projectId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin acceso al proyecto' }, { status: 403 })
    }

    // Crear nuevo proveedor
    const { data: newSupplier, error } = await supabase
      .from('suppliers')
      .insert({
        ...supplierData,
        project_id: projectId
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ 
        error: 'Error creando proveedor', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newSupplier
    })

  } catch (error) {
    console.error('Error en POST proveedores:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}