// ================================================
// 🔧 API ROUTE - GET PROJECT BY SLUG
// Server-side endpoint para resolver slugs a project IDs
// ================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }
    
    console.log('🔍 API: Buscando proyecto con slug:', slug)
    
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
    
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, slug, project_type')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
    
    if (error) {
      console.error('❌ API: Error en query:', error)
      return NextResponse.json(
        { error: 'Database query error' },
        { status: 500 }
      )
    }
    
    if (!data) {
      console.log('❌ API: Proyecto no encontrado con slug:', slug)
      return NextResponse.json(
        { error: `Project not found with slug: ${slug}` },
        { status: 404 }
      )
    }
    
    console.log('✅ API: Proyecto encontrado:', data)
    
    return NextResponse.json({
      success: true,
      project: data
    })
    
  } catch (error) {
    console.error('❌ API: Error interno:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}