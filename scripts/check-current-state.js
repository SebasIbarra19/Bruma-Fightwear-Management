// Script para verificar el estado actual y limpiar completamente
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCurrentState() {
  console.log('🔍 VERIFICANDO ESTADO ACTUAL DE LA BASE DE DATOS')
  console.log('=' .repeat(50))
  
  const brumaUserId = 'e435d7eb-a033-4bb0-b34c-2a040c5d2f36'
  const sebastianUserId = '969e5a99-0448-44a4-b0d2-135c6ed32ae4'
  
  try {
    // 1. Verificar proyectos que ve cada usuario
    console.log('\n👤 PROYECTOS QUE VE CADA USUARIO:')
    
    for (const user of [
      { name: 'BrumaFightwear', id: brumaUserId, email: 'brumafightwear@gmail.com' },
      { name: 'Sebastian', id: sebastianUserId, email: 'ibarraherrerasebastian@gmail.com' }
    ]) {
      console.log(`\n   ${user.name} (${user.email}):`)
      const { data: userProjects, error: userError } = await supabase
        .rpc('get_user_projects', { user_uuid: user.id })
      
      if (userError) {
        console.log(`   ❌ Error: ${userError.message}`)
      } else {
        console.log(`   📊 Total proyectos: ${userProjects.length}`)
        userProjects.forEach((project, index) => {
          console.log(`      ${index + 1}. 📦 ${project.project_name}`)
          console.log(`         🏷️  Slug: ${project.project_slug}`)
          console.log(`         👨‍💼 Rol: ${project.user_role}`)
          console.log(`         🆔 ID: ${project.project_id}`)
          console.log('')
        })
      }
    }
    
    // 2. Verificar TODOS los proyectos en la tabla projects
    console.log('\n📦 TODOS LOS PROYECTOS EN LA TABLA PROJECTS:')
    const { data: allProjects, error: projError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (projError) {
      console.log(`❌ Error: ${projError.message}`)
    } else {
      console.log(`📊 Total en tabla projects: ${allProjects.length}`)
      allProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. 📦 ${project.name}`)
        console.log(`      🏷️  Slug: ${project.slug}`)
        console.log(`      🆔 ID: ${project.id}`)
        console.log(`      📅 Creado: ${new Date(project.created_at).toLocaleString()}`)
        console.log('')
      })
    }
    
    // 3. Verificar TODAS las asignaciones en user_projects
    console.log('\n👥 TODAS LAS ASIGNACIONES EN USER_PROJECTS:')
    const { data: allAssignments, error: assignError } = await supabase
      .from('user_projects')
      .select('*')
      .order('assigned_at', { ascending: false })
    
    if (assignError) {
      console.log(`❌ Error: ${assignError.message}`)
    } else {
      console.log(`📊 Total asignaciones: ${allAssignments.length}`)
      allAssignments.forEach((assignment, index) => {
        const userName = assignment.user_id === brumaUserId ? 'BrumaFightwear' : 
                        assignment.user_id === sebastianUserId ? 'Sebastian' : 'Usuario desconocido'
        console.log(`   ${index + 1}. 👤 ${userName}`)
        console.log(`      🆔 Proyecto ID: ${assignment.project_id}`)
        console.log(`      👨‍💼 Rol: ${assignment.role}`)
        console.log(`      ✅ Activo: ${assignment.is_active}`)
        console.log(`      📅 Asignado: ${new Date(assignment.assigned_at).toLocaleString()}`)
        console.log('')
      })
    }
    
    // 4. Proponer limpieza si hay datos
    if ((allProjects && allProjects.length > 0) || (allAssignments && allAssignments.length > 0)) {
      console.log('\n🧹 HAY DATOS EXISTENTES QUE LIMPIAR')
      console.log('   📦 Proyectos a eliminar:', allProjects?.length || 0)
      console.log('   👥 Asignaciones a eliminar:', allAssignments?.length || 0)
      console.log('\n   💡 Para limpiar completamente, necesitamos:')
      console.log('      1. Eliminar todas las asignaciones de user_projects')
      console.log('      2. Eliminar todos los proyectos de projects')
      console.log('      3. Verificar que ambos usuarios no vean ningún proyecto')
    } else {
      console.log('\n✅ LA BASE DE DATOS ESTÁ LIMPIA')
      console.log('   Ambos usuarios deberían ver 0 proyectos')
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

checkCurrentState()