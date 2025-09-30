// Script para investigar el proyecto BRUMA Fightwear y asignar correctamente
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixBrumaProject() {
  console.log('🔍 Investigando el proyecto BRUMA Fightwear...\n')
  
  const brumaUserId = 'e435d7eb-a033-4bb0-b34c-2a040c5d2f36'
  const sebastianUserId = '969e5a99-0448-44a4-b0d2-135c6ed32ae4'
  
  try {
    // 1. Buscar el proyecto BRUMA Fightwear por slug
    console.log('🔍 1. Buscando proyecto BRUMA Fightwear por slug...')
    const { data: brumaProject, error: searchError } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', 'bruma-fightwear')
      .single()
    
    if (searchError) {
      console.log('❌ No encontrado por slug:', searchError.message)
      
      // Buscar por nombre
      console.log('🔍 Buscando por nombre...')
      const { data: brumaByName, error: nameError } = await supabase
        .from('projects')
        .select('*')
        .ilike('name', '%bruma%')
      
      if (nameError) {
        console.log('❌ Error buscando por nombre:', nameError.message)
      } else {
        console.log('✅ Proyectos encontrados con "bruma":', brumaByName.length)
        brumaByName.forEach(p => console.log(`   - ${p.name} (${p.slug})`))
      }
    } else {
      console.log('✅ Proyecto BRUMA Fightwear encontrado:')
      console.log(`   - Nombre: ${brumaProject.name}`)
      console.log(`   - Slug: ${brumaProject.slug}`)
      console.log(`   - ID: ${brumaProject.id}`)
      console.log('')
      
      // 2. Verificar quién tiene acceso a este proyecto
      console.log('👥 2. Verificando asignaciones actuales...')
      const { data: assignments, error: assignError } = await supabase
        .from('user_projects')
        .select(`
          *,
          users (email)
        `)
        .eq('project_id', brumaProject.id)
        .eq('is_active', true)
      
      if (assignError) {
        console.log('❌ Error obteniendo asignaciones:', assignError.message)
      } else {
        console.log(`✅ Usuarios asignados: ${assignments.length}`)
        assignments.forEach(a => {
          console.log(`   - ${a.users?.email || 'Email no encontrado'}: ${a.role}`)
        })
      }
      
      // 3. Verificar si BrumaFightwear ya está asignado
      const brumaAssignment = assignments.find(a => a.user_id === brumaUserId)
      
      if (brumaAssignment) {
        console.log('✅ BrumaFightwear ya está asignado al proyecto BRUMA Fightwear')
      } else {
        console.log('❌ BrumaFightwear NO está asignado al proyecto BRUMA Fightwear')
        
        // 4. Asignar BrumaFightwear al proyecto BRUMA Fightwear
        console.log('➕ 4. Asignando BrumaFightwear al proyecto BRUMA Fightwear...')
        const { data: newAssignment, error: newAssignError } = await supabase
          .from('user_projects')
          .insert({
            user_id: brumaUserId,
            project_id: brumaProject.id,
            role: 'owner',
            is_active: true
          })
          .select()
        
        if (newAssignError) {
          console.log('❌ Error asignando:', newAssignError.message)
        } else {
          console.log('✅ BrumaFightwear asignado como owner de BRUMA Fightwear')
        }
      }
    }
    
    // 5. Verificación final de ambos usuarios
    console.log('\n🎯 5. Verificación final de proyectos:')
    
    for (const user of [
      { name: 'BrumaFightwear', id: brumaUserId },
      { name: 'Sebastian', id: sebastianUserId }
    ]) {
      console.log(`\n👤 ${user.name}:`)
      const { data: finalProjects, error: finalError } = await supabase
        .rpc('get_user_projects', { user_uuid: user.id })
      
      if (finalError) {
        console.log('❌ Error:', finalError.message)
      } else {
        finalProjects.forEach((project, index) => {
          console.log(`   ${index + 1}. ${project.project_name} (${project.user_role})`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

fixBrumaProject()