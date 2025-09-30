// Script para arreglar el usuario existente y asignarlo al proyecto
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Usaremos anon key por ahora

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixExistingUser() {
  console.log('🔧 Arreglando usuario existente...\n')
  
  try {
    // Buscar usuarios registrados recientemente
    console.log('1️⃣ Intentando autenticar con credenciales conocidas...')
    
    // Hacer login para obtener el ID del usuario
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ibarraherrerasebastian@gmail.com',
      password: 'PASSWORD_TEMPORAL' // Cambiar por la contraseña real
    })
    
    if (authError) {
      console.log('❌ No se pudo autenticar:', authError.message)
      console.log('Necesitamos la contraseña correcta para obtener el ID del usuario.')
      return
    }
    
    const userId = authData.user.id
    const userEmail = authData.user.email
    
    console.log(`✅ Usuario autenticado exitosamente:`)
    console.log(`   ID: ${userId}`)
    console.log(`   Email: ${userEmail}`)
    
    // Verificar si ya existe perfil
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (existingProfile) {
      console.log('✅ El perfil ya existe en public.users')
    } else {
      console.log('2️⃣ Creando perfil en public.users...')
      
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          full_name: 'Sebastián Ibarra', // Ajustar según sea necesario
        })
      
      if (createError) {
        console.log('❌ Error creando perfil:', createError.message)
      } else {
        console.log('✅ Perfil creado exitosamente')
      }
    }
    
    // Asignar al proyecto
    console.log('3️⃣ Asignando usuario al proyecto E-commerce...')
    
    const projectId = '820c116f-adaf-4609-9b97-c727e687de79'
    
    const { data: assignment, error: assignError } = await supabase
      .from('user_projects')
      .insert({
        user_id: userId,
        project_id: projectId,
        role: 'admin',
        is_active: true
      })
    
    if (assignError) {
      console.log('❌ Error asignando proyecto:', assignError.message)
    } else {
      console.log('✅ Usuario asignado al proyecto exitosamente')
    }
    
    console.log('\n🎉 ¡Usuario configurado correctamente!')
    console.log('Ahora puedes hacer login y acceder al proyecto.')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

// Función alternativa para crear usuario manualmente si conocemos el ID
async function createUserManually(userId, email, fullName) {
  console.log(`🔧 Creando usuario manualmente para ID: ${userId}`)
  
  try {
    // Crear perfil
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        full_name: fullName,
      })
    
    if (profileError) {
      console.log('❌ Error creando perfil:', profileError.message)
      return
    }
    
    // Asignar al proyecto
    const projectId = '820c116f-adaf-4609-9b97-c727e687de79'
    
    const { data: assignment, error: assignError } = await supabase
      .from('user_projects')
      .insert({
        user_id: userId,
        project_id: projectId,
        role: 'admin',
        is_active: true
      })
    
    if (assignError) {
      console.log('❌ Error asignando proyecto:', assignError.message)
      return
    }
    
    console.log('✅ Usuario creado y asignado exitosamente')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Ejecutar función principal
fixExistingUser()

// Alternativa: descomentar para crear usuario manualmente
// createUserManually('USER_ID_AQUI', 'email@example.com', 'Nombre Completo')