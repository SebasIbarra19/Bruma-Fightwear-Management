// Script para verificar los proyectos de ambos usuarios
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllUserProjects() {
  console.log('🔍 Verificando proyectos de todos los usuarios...\n')
  
  const users = [
    {
      name: 'BrumaFightwear',
      email: 'brumafightwear@gmail.com',
      id: 'e435d7eb-a033-4bb0-b34c-2a040c5d2f36'
    },
    {
      name: 'Sebastian',
      email: 'ibarraherrerasebastian@gmail.com',
      id: '969e5a99-0448-44a4-b0d2-135c6ed32ae4'
    }
  ]
  
  try {
    for (const user of users) {
      console.log(`👤 === ${user.name} (${user.email}) ===`)
      
      // Usar get_user_projects
      const { data: userProjects, error: funcError } = await supabase
        .rpc('get_user_projects', { user_uuid: user.id })
      
      if (funcError) {
        console.log('❌ Error:', funcError.message)
      } else {
        console.log(`✅ Proyectos: ${userProjects.length}`)
        userProjects.forEach((project, index) => {
          console.log(`   ${index + 1}. 📦 ${project.project_name}`)
          console.log(`      🏷️  Slug: ${project.project_slug}`)
          console.log(`      👨‍💼 Rol: ${project.user_role}`)
          console.log(`      🆔 ID: ${project.project_id}`)
          console.log(`      📝 Descripción: ${project.project_description}`)
          console.log(`      🎨 Colores:`, project.color_scheme)
          console.log(`      ⚙️  Tipo: ${project.project_type}`)
          console.log(`      📅 Asignado: ${new Date(project.assigned_at).toLocaleDateString()}`)
          console.log('')
        })
      }
      
      console.log('─'.repeat(60))
      console.log('')
    }
    
    // También mostrar todos los proyectos disponibles
    console.log('🗂️ === TODOS LOS PROYECTOS EN LA BASE DE DATOS ===')
    const { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (allError) {
      console.log('❌ Error:', allError.message)
    } else {
      console.log(`✅ Total de proyectos en la base de datos: ${allProjects.length}`)
      allProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. 📦 ${project.name}`)
        console.log(`      🏷️  Slug: ${project.slug}`)
        console.log(`      🆔 ID: ${project.id}`)
        console.log(`      ⚙️  Tipo: ${project.project_type}`)
        console.log(`      📅 Creado: ${new Date(project.created_at).toLocaleDateString()}`)
        console.log(`      🎨 Colores:`, project.color_scheme)
        console.log('')
      })
    }
    
    // Mostrar todas las asignaciones
    console.log('👥 === TODAS LAS ASIGNACIONES DE USUARIOS ===')
    const { data: allAssignments, error: assignError } = await supabase
      .from('user_projects')
      .select(`
        *,
        projects (name, slug),
        users!user_projects_user_id_fkey (email)
      `)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false })
    
    if (assignError) {
      console.log('❌ Error:', assignError.message)
    } else {
      console.log(`✅ Total de asignaciones activas: ${allAssignments.length}`)
      allAssignments.forEach((assignment, index) => {
        console.log(`   ${index + 1}. 👤 ${assignment.users?.email || 'Email no encontrado'}`)
        console.log(`      📦 Proyecto: ${assignment.projects?.name || 'Proyecto no encontrado'}`)
        console.log(`      🏷️  Slug: ${assignment.projects?.slug || 'N/A'}`)
        console.log(`      👨‍💼 Rol: ${assignment.role}`)
        console.log(`      📅 Asignado: ${new Date(assignment.assigned_at).toLocaleDateString()}`)
        console.log('')
      })
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

checkAllUserProjects()