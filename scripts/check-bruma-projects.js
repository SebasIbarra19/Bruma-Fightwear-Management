// Script para verificar los proyectos asignados a brumafightwear@gmail.com
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBrumaProjects() {
  console.log('🔍 Verificando proyectos de brumafightwear@gmail.com...\n')
  
  const brumaUserId = 'e435d7eb-a033-4bb0-b34c-2a040c5d2f36'
  
  try {
    // Verificar proyectos asignados usando get_user_projects
    console.log('📊 1. Usando función get_user_projects:')
    const { data: userProjects, error: funcError } = await supabase
      .rpc('get_user_projects', { user_uuid: brumaUserId })
    
    if (funcError) {
      console.log('❌ Error:', funcError.message)
    } else {
      console.log('✅ Proyectos encontrados:', userProjects.length)
      userProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.project_name} (${project.project_slug})`)
        console.log(`      - Rol: ${project.user_role}`)
        console.log(`      - ID: ${project.project_id}`)
        console.log(`      - Descripción: ${project.project_description}`)
        console.log('')
      })
    }
    
    // Verificar también directamente en la tabla user_projects
    console.log('📋 2. Consulta directa a user_projects:')
    const { data: directProjects, error: directError } = await supabase
      .from('user_projects')
      .select(`
        *,
        projects (
          id,
          name,
          slug,
          description,
          project_type
        )
      `)
      .eq('user_id', brumaUserId)
      .eq('is_active', true)
    
    if (directError) {
      console.log('❌ Error:', directError.message)
    } else {
      console.log('✅ Asignaciones encontradas:', directProjects.length)
      directProjects.forEach((assignment, index) => {
        console.log(`   ${index + 1}. ${assignment.projects.name} (${assignment.projects.slug})`)
        console.log(`      - Rol: ${assignment.role}`)
        console.log(`      - ID: ${assignment.projects.id}`)
        console.log(`      - Tipo: ${assignment.projects.project_type}`)
        console.log('')
      })
    }
    
    // Verificar todos los proyectos existentes
    console.log('🗂️ 3. Todos los proyectos en la base de datos:')
    const { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (allError) {
      console.log('❌ Error:', allError.message)
    } else {
      console.log('✅ Total de proyectos:', allProjects.length)
      allProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name} (${project.slug})`)
        console.log(`      - ID: ${project.id}`)
        console.log(`      - Tipo: ${project.project_type}`)
        console.log(`      - Creado: ${project.created_at}`)
        console.log('')
      })
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

checkBrumaProjects()