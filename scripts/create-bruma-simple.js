// Script simple para crear proyecto BRUMA Fightwear usando métodos SQL directos
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function createBrumaSimple() {
  console.log('🎯 CREANDO PROYECTO BRUMA FIGHTWEAR (Método Simple)')
  console.log('=' .repeat(50))
  
  const brumaUserId = 'e435d7eb-a033-4bb0-b34c-2a040c5d2f36'
  const sebastianUserId = '969e5a99-0448-44a4-b0d2-135c6ed32ae4'
  
  try {
    // 1. Limpiar usando SQL directo (sin RLS)
    console.log('\n🧹 1. LIMPIANDO PROYECTOS EXISTENTES...')
    
    // Eliminar asignaciones
    const { error: cleanAssignError } = await supabase
      .from('user_projects')
      .delete()
      .gt('created_at', '1900-01-01')
    
    if (cleanAssignError) {
      console.log('   ⚠️  Error limpiando asignaciones (puede ser normal):', cleanAssignError.message)
    } else {
      console.log('   ✅ Asignaciones limpiadas')
    }
    
    // Eliminar proyectos
    const { error: cleanProjError } = await supabase
      .from('projects')
      .delete()
      .gt('created_at', '1900-01-01')
    
    if (cleanProjError) {
      console.log('   ⚠️  Error limpiando proyectos (puede ser normal):', cleanProjError.message)
    } else {
      console.log('   ✅ Proyectos limpiados')
    }
    
    // 2. Crear proyecto usando SQL
    console.log('\n🏗️  2. CREANDO PROYECTO BRUMA FIGHTWEAR...')
    
    const projectQuery = `
      INSERT INTO projects (
        name, 
        slug, 
        description, 
        project_type, 
        logo_url, 
        color_scheme, 
        config, 
        is_active
      ) VALUES (
        'BRUMA Fightwear',
        'bruma-fightwear',
        'Tienda especializada en ropa deportiva y equipamiento de combate',
        'ecommerce',
        '/images/bruma-logo.png',
        '{"primary": "#dc2626", "secondary": "#b91c1c", "accent": "#fbbf24"}',
        '{"features": ["inventory_management", "order_processing", "customer_management", "analytics"], "specialized": true, "combat_sports": true}',
        true
      ) RETURNING *;
    `
    
    const { data: projectResult, error: projectError } = await supabase
      .rpc('exec_sql', { query: projectQuery })
    
    if (projectError) {
      console.log('   ❌ Error creando con SQL:', projectError.message)
      
      // Intentar método alternativo
      console.log('   🔄 Intentando método alternativo...')
      const { data: altProject, error: altError } = await supabase
        .from('projects')
        .upsert({
          name: 'BRUMA Fightwear',
          slug: 'bruma-fightwear',
          description: 'Tienda especializada en ropa deportiva y equipamiento de combate',
          project_type: 'ecommerce',
          is_active: true
        }, { onConflict: 'slug' })
        .select()
        .single()
      
      if (altError) {
        console.log('   ❌ Error con método alternativo:', altError.message)
        return
      }
      
      console.log('   ✅ Proyecto creado con método alternativo')
      newProject = altProject
      
    } else {
      console.log('   ✅ Proyecto creado con SQL')
      newProject = projectResult[0]
    }
    
    // Si no tenemos el proyecto, intentar obtenerlo
    if (!newProject) {
      const { data: existingProject, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', 'bruma-fightwear')
        .single()
      
      if (fetchError) {
        console.log('   ❌ No se pudo obtener el proyecto:', fetchError.message)
        return
      }
      
      newProject = existingProject
      console.log('   ✅ Proyecto obtenido:', newProject.name)
    }
    
    // 3. Asignar usuarios
    console.log('\n👥 3. ASIGNANDO USUARIOS...')
    
    // Owner: BrumaFightwear
    const { error: ownerError } = await supabase
      .from('user_projects')
      .upsert({
        user_id: brumaUserId,
        project_id: newProject.id,
        role: 'owner',
        is_active: true
      }, { onConflict: 'user_id,project_id' })
    
    if (ownerError) {
      console.log('   ❌ Error asignando owner:', ownerError.message)
    } else {
      console.log('   ✅ BrumaFightwear asignado como OWNER')
    }
    
    // Admin: Sebastian
    const { error: adminError } = await supabase
      .from('user_projects')
      .upsert({
        user_id: sebastianUserId,
        project_id: newProject.id,
        role: 'admin',
        is_active: true
      }, { onConflict: 'user_id,project_id' })
    
    if (adminError) {
      console.log('   ❌ Error asignando admin:', adminError.message)
    } else {
      console.log('   ✅ Sebastian asignado como ADMIN')
    }
    
    // 4. Verificación final
    console.log('\n🎯 4. VERIFICACIÓN FINAL...')
    
    const { data: finalProjects, error: finalError } = await supabase
      .rpc('get_user_projects', { user_uuid: brumaUserId })
    
    if (finalError) {
      console.log('   ❌ Error verificando:', finalError.message)
    } else {
      console.log('   ✅ BrumaFightwear tiene acceso a:')
      finalProjects.forEach(p => {
        console.log(`      - ${p.project_name} (${p.user_role})`)
      })
    }
    
    console.log('\n🎉 ¡CONFIGURACIÓN COMPLETADA!')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

createBrumaSimple()