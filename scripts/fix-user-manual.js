// Script corregido para probar con UUIDs válidos y sin triggers problemáticos
const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')
require('dotenv').config({ path: '.env' })

// Función para generar UUID v4
function uuidv4() {
  return crypto.randomUUID()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAndCreateUser() {
  console.log('🔧 Arreglando y creando usuario...\n')
  
  try {
    // Paso 1: Crear usuario manualmente en public.users con UUID válido
    console.log('1️⃣ Creando perfil de usuario manualmente...')
    
    const userId = uuidv4() // UUID válido
    const userEmail = 'admin@bruma.local'
    const userName = 'Admin Bruma'
    
    console.log('Usando UUID:', userId)
    
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: userEmail,
        full_name: userName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (profileError) {
      console.log('❌ Error creando perfil:', profileError.message)
      return
    }
    
    console.log('✅ Perfil creado exitosamente')
    
    // Paso 2: Asignar al proyecto
    console.log('2️⃣ Asignando al proyecto...')
    
    const projectId = '820c116f-adaf-4609-9b97-c727e687de79'
    
    const { data: assignment, error: assignError } = await supabase
      .from('user_projects')
      .insert({
        id: uuidv4(),
        user_id: userId,
        project_id: projectId,
        role: 'admin',
        is_active: true,
        assigned_at: new Date().toISOString()
      })
      .select()
    
    if (assignError) {
      console.log('❌ Error asignando proyecto:', assignError.message)
      return
    }
    
    console.log('✅ Usuario asignado al proyecto exitosamente')
    
    // Paso 3: Intentar crear el usuario de auth usando el mismo UUID
    console.log('3️⃣ Intentando crear usuario de autenticación...')
    
    // Nota: Esto probablemente fallará por el trigger, pero veamos qué pasa
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: '123456789',
      email_confirm: true,
      user_metadata: {
        full_name: userName
      }
    })
    
    if (authError) {
      console.log('⚠️ Error creando usuario de auth:', authError.message)
      console.log('💡 Esto es esperado si no tenemos service role key')
      
      console.log('\n📋 Usuario creado manualmente:')
      console.log(`   ID: ${userId}`)
      console.log(`   Email: ${userEmail}`)
      console.log(`   Proyecto asignado: E-commerce`)
      console.log('\n💡 Para completar el setup:')
      console.log('1. Ve al dashboard de Supabase')
      console.log('2. En Authentication > Users, crea un usuario con:')
      console.log(`   - Email: ${userEmail}`)
      console.log(`   - Password: 123456789`)
      console.log(`   - Importante: usa el ID: ${userId}`)
      
    } else {
      console.log('✅ Usuario de autenticación creado exitosamente')
    }
    
    // Verificar el resultado final
    console.log('\n4️⃣ Verificando configuración final...')
    
    const { data: finalCheck, error: checkError } = await supabase
      .from('user_projects')
      .select(`
        *,
        users (email, full_name),
        projects (name, slug)
      `)
      .eq('user_id', userId)
    
    if (!checkError && finalCheck.length > 0) {
      console.log('✅ Configuración verificada:')
      console.log('   Usuario:', finalCheck[0].users.full_name)
      console.log('   Email:', finalCheck[0].users.email)
      console.log('   Proyecto:', finalCheck[0].projects.name)
      console.log('   Rol:', finalCheck[0].role)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

fixAndCreateUser()