// Script para reset completo y crear proyecto BRUMA Fightwear correctamente
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetAndCreateBruma() {
  console.log('🧹 RESET COMPLETO Y CREACIÓN DE BRUMA FIGHTWEAR')
  console.log('=' .repeat(60))
  
  const brumaUserId = 'e435d7eb-a033-4bb0-b34c-2a040c5d2f36'
  const sebastianUserId = '969e5a99-0448-44a4-b0d2-135c6ed32ae4'
  
  try {
    // 1. LIMPIAR TODO
    console.log('\n🗑️  1. ELIMINANDO TODOS LOS PROYECTOS Y ASIGNACIONES...')
    
    // Eliminar todas las asignaciones de usuarios
    console.log('   📋 Eliminando asignaciones de usuarios...')
    const { error: deleteAssignmentsError } = await supabase
      .from('user_projects')
      .delete()
      .neq('id', 'impossible-id') // Esto eliminará todas las filas
    
    if (deleteAssignmentsError && deleteAssignmentsError.code !== 'PGRST116') {
      console.log('   ❌ Error eliminando asignaciones:', deleteAssignmentsError.message)
    } else {
      console.log('   ✅ Asignaciones eliminadas')
    }
    
    // Eliminar todos los proyectos
    console.log('   📦 Eliminando proyectos...')
    const { error: deleteProjectsError } = await supabase
      .from('projects')
      .delete()
      .neq('id', 'impossible-id') // Esto eliminará todas las filas
    
    if (deleteProjectsError && deleteProjectsError.code !== 'PGRST116') {
      console.log('   ❌ Error eliminando proyectos:', deleteProjectsError.message)
    } else {
      console.log('   ✅ Proyectos eliminados')
    }
    
    // 2. CREAR PROYECTO BRUMA FIGHTWEAR
    console.log('\n🏗️  2. CREANDO PROYECTO BRUMA FIGHTWEAR...')
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'BRUMA Fightwear',
        slug: 'bruma-fightwear',
        description: 'Tienda especializada en ropa deportiva y equipamiento de combate',
        project_type: 'ecommerce',
        logo_url: '/images/bruma-logo.png',
        color_scheme: {
          primary: '#dc2626',
          secondary: '#b91c1c',
          accent: '#fbbf24'
        },
        config: {
          features: [
            'inventory_management',
            'order_processing',
            'customer_management',
            'analytics',
            'multi_currency',
            'combat_sports_categories'
          ],
          specialized: true,
          combat_sports: true,
          demo_mode: false
        },
        is_active: true
      })
      .select()
      .single()
    
    if (projectError) {
      console.log('   ❌ Error creando proyecto:', projectError.message)
      return
    }
    
    console.log('   ✅ Proyecto BRUMA Fightwear creado exitosamente')
    console.log(`   🆔 ID: ${newProject.id}`)
    console.log(`   🏷️  Slug: ${newProject.slug}`)
    
    // 3. ASIGNAR BRUMAFIGHTWEAR COMO OWNER
    console.log('\n👑 3. ASIGNANDO BRUMAFIGHTWEAR COMO OWNER...')
    const { data: ownerAssignment, error: ownerError } = await supabase
      .from('user_projects')
      .insert({
        user_id: brumaUserId,
        project_id: newProject.id,
        role: 'owner',
        is_active: true,
        permissions: {
          can_manage_users: true,
          can_manage_settings: true,
          can_manage_inventory: true,
          can_manage_orders: true,
          can_view_analytics: true,
          can_export_data: true
        }
      })
      .select()
      .single()
    
    if (ownerError) {
      console.log('   ❌ Error asignando owner:', ownerError.message)
      return
    }
    
    console.log('   ✅ BrumaFightwear asignado como OWNER')
    
    // 4. ASIGNAR SEBASTIAN COMO ADMIN
    console.log('\n👨‍💼 4. ASIGNANDO SEBASTIAN COMO ADMIN...')
    const { data: adminAssignment, error: adminError } = await supabase
      .from('user_projects')
      .insert({
        user_id: sebastianUserId,
        project_id: newProject.id,
        role: 'admin',
        is_active: true,
        permissions: {
          can_manage_users: false,
          can_manage_settings: true,
          can_manage_inventory: true,
          can_manage_orders: true,
          can_view_analytics: true,
          can_export_data: false
        }
      })
      .select()
      .single()
    
    if (adminError) {
      console.log('   ❌ Error asignando admin:', adminError.message)
      return
    }
    
    console.log('   ✅ Sebastian asignado como ADMIN')
    
    // 5. VERIFICACIÓN FINAL
    console.log('\n🎯 5. VERIFICACIÓN FINAL...')
    
    // Verificar proyectos
    const { data: allProjects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
    
    if (projectsError) {
      console.log('   ❌ Error verificando proyectos:', projectsError.message)
    } else {
      console.log(`   📦 Proyectos totales: ${allProjects.length}`)
      allProjects.forEach(p => {
        console.log(`      - ${p.name} (${p.slug})`)
      })
    }
    
    // Verificar asignaciones
    for (const user of [
      { name: 'BrumaFightwear', email: 'brumafightwear@gmail.com', id: brumaUserId },
      { name: 'Sebastian', email: 'ibarraherrerasebastian@gmail.com', id: sebastianUserId }
    ]) {
      console.log(`\n   👤 ${user.name} (${user.email}):`)
      const { data: userProjects, error: userError } = await supabase
        .rpc('get_user_projects', { user_uuid: user.id })
      
      if (userError) {
        console.log('      ❌ Error:', userError.message)
      } else {
        userProjects.forEach((project, index) => {
          console.log(`      ${index + 1}. 📦 ${project.project_name}`)
          console.log(`         👨‍💼 Rol: ${project.user_role}`)
          console.log(`         🏷️  Slug: ${project.project_slug}`)
        })
      }
    }
    
    console.log('\n🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!')
    console.log('📋 Resumen:')
    console.log('   - Proyecto: BRUMA Fightwear (bruma-fightwear)')
    console.log('   - Owner: brumafightwear@gmail.com')
    console.log('   - Admin: ibarraherrerasebastian@gmail.com')
    console.log('   - Tipo: ecommerce')
    console.log('   - Especialización: Combat Sports')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

resetAndCreateBruma()