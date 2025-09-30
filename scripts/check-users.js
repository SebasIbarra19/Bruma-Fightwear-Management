// Script para verificar usuarios en Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Falta')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ Falta')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsers() {
  console.log('🔍 Verificando usuarios en Supabase...\n')
  
  try {
    // 1. Intentar obtener usuarios desde auth.users (requiere service role key)
    console.log('1️⃣ Consultando auth.users (tabla de autenticación)...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log('⚠️ No se pudo acceder a auth.users (necesita service role key)')
      console.log('Error:', authError.message)
    } else {
      console.log(`✅ Encontrados ${authUsers.users.length} usuarios en auth.users:`)
      authUsers.users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Creado: ${new Date(user.created_at).toLocaleString()}`)
        console.log(`   Email confirmado: ${user.email_confirmed_at ? 'Sí ✅' : 'No ❌'}`)
        console.log(`   Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Nunca'}`)
        console.log('   ---')
      })
    }
    
    // 2. Consultar tabla public.users (perfiles de usuario)
    console.log('\n2️⃣ Consultando public.users (perfiles de usuario)...')
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')
    
    if (publicError) {
      console.log('⚠️ Error al consultar tabla "users":', publicError.message)
    } else {
      console.log(`✅ Encontrados ${publicUsers.length} perfiles en public.users:`)
      publicUsers.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Nombre: ${user.full_name || 'Sin nombre'}`)
        console.log(`   Avatar: ${user.avatar_url || 'Sin avatar'}`)
        console.log(`   Creado: ${new Date(user.created_at).toLocaleString()}`)
        console.log('   ---')
      })
    }
    
    // 3. Consultar relaciones usuario-proyecto
    console.log('\n3️⃣ Consultando user_projects (asignaciones de proyectos)...')
    const { data: userProjects, error: userProjectsError } = await supabase
      .from('user_projects')
      .select(`
        *,
        projects (
          id,
          name,
          slug
        )
      `)
    
    if (userProjectsError) {
      console.log('⚠️ Error al consultar user_projects:', userProjectsError.message)
    } else {
      console.log(`✅ Encontradas ${userProjects.length} asignaciones usuario-proyecto:`)
      userProjects.forEach((assignment, index) => {
        console.log(`${index + 1}. Usuario ID: ${assignment.user_id}`)
        console.log(`   Proyecto: ${assignment.projects?.name || 'Proyecto desconocido'}`)
        console.log(`   Rol: ${assignment.role}`)
        console.log(`   Activo: ${assignment.is_active ? 'Sí' : 'No'}`)
        console.log(`   Asignado: ${new Date(assignment.assigned_at).toLocaleString()}`)
        console.log('   ---')
      })
    }
    
    // 4. Consultar proyectos disponibles
    console.log('\n4️⃣ Consultando proyectos disponibles...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, slug, project_type, is_active')
    
    if (projectsError) {
      console.log('⚠️ Error al consultar projects:', projectsError.message)
    } else {
      console.log(`✅ Encontrados ${projects.length} proyectos:`)
      projects.forEach((project, index) => {
        console.log(`${index + 1}. ${project.name} (${project.slug})`)
        console.log(`   ID: ${project.id}`)
        console.log(`   Tipo: ${project.project_type}`)
        console.log(`   Activo: ${project.is_active ? 'Sí' : 'No'}`)
        console.log('   ---')
      })
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

checkUsers()
