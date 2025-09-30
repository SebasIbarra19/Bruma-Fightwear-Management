// Script para crear el proyecto BRUMA Fightwear y asignar el usuario
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function createBrumaProject() {
  console.log('🚀 Creando proyecto BRUMA Fightwear...\n')
  
  const brumaUserId = 'e435d7eb-a033-4bb0-b34c-2a040c5d2f36'
  
  try {
    // 1. Crear el proyecto BRUMA Fightwear
    console.log('📦 1. Creando proyecto BRUMA Fightwear...')
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
          secondary: '#b91c1c'
        },
        config: {
          features: [
            'inventory_management',
            'order_processing',
            'customer_management',
            'analytics',
            'multi_currency'
          ],
          specialized: true,
          combat_sports: true
        }
      })
      .select()
      .single()
    
    if (projectError) {
      console.log('❌ Error creando proyecto:', projectError.message)
      
      // Si ya existe, obtenerlo
      if (projectError.code === '23505') { // duplicate key
        console.log('📋 Proyecto ya existe, obteniendo ID...')
        const { data: existingProject, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('slug', 'bruma-fightwear')
          .single()
        
        if (fetchError) {
          console.log('❌ Error obteniendo proyecto existente:', fetchError.message)
          return
        }
        
        console.log('✅ Proyecto encontrado:', existingProject.name)
        newProject = existingProject
      } else {
        return
      }
    } else {
      console.log('✅ Proyecto creado:', newProject.name)
    }
    
    // 2. Verificar si ya está asignado
    console.log('🔍 2. Verificando asignación actual...')
    const { data: existingAssignment, error: checkError } = await supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', brumaUserId)
      .eq('project_id', newProject.id)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.log('❌ Error verificando asignación:', checkError.message)
      return
    }
    
    if (existingAssignment) {
      console.log('✅ Usuario ya está asignado al proyecto BRUMA Fightwear')
    } else {
      // 3. Asignar usuario al proyecto BRUMA Fightwear
      console.log('👤 3. Asignando usuario al proyecto BRUMA Fightwear...')
      const { data: assignment, error: assignError } = await supabase
        .from('user_projects')
        .insert({
          user_id: brumaUserId,
          project_id: newProject.id,
          role: 'owner',
          is_active: true
        })
        .select()
      
      if (assignError) {
        console.log('❌ Error asignando usuario:', assignError.message)
        return
      }
      
      console.log('✅ Usuario asignado como owner del proyecto BRUMA Fightwear')
    }
    
    // 4. Verificar el resultado final
    console.log('\n🎯 4. Verificación final:')
    const { data: finalProjects, error: finalError } = await supabase
      .rpc('get_user_projects', { user_uuid: brumaUserId })
    
    if (finalError) {
      console.log('❌ Error en verificación final:', finalError.message)
    } else {
      console.log('✅ Proyectos finales del usuario:')
      finalProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.project_name} (${project.project_slug})`)
        console.log(`      - Rol: ${project.user_role}`)
        console.log(`      - ID: ${project.project_id}`)
        console.log('')
      })
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

createBrumaProject()