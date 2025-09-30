// Script para crear un usuario de prueba completo
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestUser() {
  console.log('🧪 Creando usuario de prueba...\n')
  
  const testEmail = 'test@bruma.local'
  const testPassword = '123456'
  const testName = 'Usuario Prueba'
  
  try {
    // 1. Registrar usuario
    console.log('1️⃣ Registrando usuario...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
          first_name: 'Usuario',
          last_name: 'Prueba'
        }
      }
    })
    
    if (authError) {
      console.log('❌ Error en registro:', authError.message)
      
      // Si el usuario ya existe, intentar hacer login
      if (authError.message.includes('already registered')) {
        console.log('2️⃣ Usuario ya existe, intentando login...')
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        })
        
        if (loginError) {
          console.log('❌ Error en login:', loginError.message)
          return
        }
        
        console.log('✅ Login exitoso')
        await setupUserProfile(loginData.user.id, testEmail, testName)
      }
      return
    }
    
    if (authData.user) {
      console.log('✅ Usuario registrado exitosamente')
      console.log(`   ID: ${authData.user.id}`)
      console.log(`   Email: ${authData.user.email}`)
      
      await setupUserProfile(authData.user.id, testEmail, testName)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

async function setupUserProfile(userId, email, fullName) {
  try {
    console.log('3️⃣ Configurando perfil de usuario...')
    
    // Crear perfil en public.users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        full_name: fullName,
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (profileError) {
      console.log('⚠️ Error creando perfil:', profileError.message)
    } else {
      console.log('✅ Perfil creado exitosamente')
    }
    
    // Asignar al proyecto E-commerce
    console.log('4️⃣ Asignando al proyecto...')
    
    const projectId = '820c116f-adaf-4609-9b97-c727e687de79'
    
    const { data: assignment, error: assignError } = await supabase
      .from('user_projects')
      .upsert({
        user_id: userId,
        project_id: projectId,
        role: 'admin',
        is_active: true,
        assigned_at: new Date().toISOString()
      })
      .select()
    
    if (assignError) {
      console.log('⚠️ Error asignando proyecto:', assignError.message)
    } else {
      console.log('✅ Usuario asignado al proyecto exitosamente')
    }
    
    console.log('\n🎉 ¡Usuario de prueba configurado!')
    console.log('📋 Credenciales:')
    console.log(`   Email: test@bruma.local`)
    console.log(`   Password: 123456`)
    console.log('\n💡 Ahora puedes hacer login con estas credenciales.')
    
  } catch (error) {
    console.error('❌ Error configurando perfil:', error.message)
  }
}

createTestUser()