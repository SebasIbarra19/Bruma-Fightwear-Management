// Script simple para crear usuario sin RLS
const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

function uuidv4() {
  return crypto.randomUUID()
}

async function createUserSimple() {
  console.log('🧪 Creando usuario de prueba simple...\n')
  
  // Datos del usuario de prueba
  const userEmail = 'test@bruma.com'
  const userPassword = '123456'
  
  try {
    console.log('1️⃣ Intentando registro directo con signUp...')
    
    // Método 1: SignUp básico (sin metadatos extra que puedan causar problemas)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userEmail,
      password: userPassword
    })
    
    if (authError) {
      console.log('❌ Error en signUp:', authError.message)
      
      // Si el usuario ya existe, intentar login
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        console.log('\n2️⃣ Usuario ya existe, intentando login...')
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: userPassword
        })
        
        if (loginError) {
          console.log('❌ Error en login:', loginError.message)
          
          // Intentar con el usuario anterior que sabemos que existe
          console.log('\n3️⃣ Intentando con usuario conocido...')
          const { data: knownLogin, error: knownError } = await supabase.auth.signInWithPassword({
            email: 'ibarraherrerasebastian@gmail.com',
            password: 'PASSWORD_AQUI' // Necesitas poner la contraseña real
          })
          
          if (knownError) {
            console.log('❌ Error con usuario conocido:', knownError.message)
            console.log('\n💡 Necesitamos la contraseña correcta del usuario ibarraherrerasebastian@gmail.com')
            console.log('O podemos crear las políticas RLS correctas.')
            return
          }
          
          console.log('✅ Login exitoso con usuario conocido')
          await createUserProfile(knownLogin.user)
        } else {
          console.log('✅ Login exitoso')
          await createUserProfile(loginData.user)
        }
      } else {
        console.log('\n💡 Error diferente. Probablemente el trigger de crear perfil está fallando.')
        console.log('Detalles del error:', authError)
      }
      return
    }
    
    if (authData.user) {
      console.log('✅ Usuario registrado exitosamente')
      await createUserProfile(authData.user)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

async function createUserProfile(user) {
  console.log(`\n📋 Información del usuario autenticado:`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Confirmado: ${user.email_confirmed_at ? 'Sí' : 'No'}`)
  
  try {
    // Verificar si ya existe perfil
    const { data: existingProfile, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (existingProfile) {
      console.log('✅ El perfil ya existe en public.users')
    } else if (checkError && !checkError.message.includes('No rows')) {
      console.log('⚠️ Error verificando perfil:', checkError.message)
    } else {
      console.log('📝 Perfil no existe, necesita ser creado manualmente.')
    }
    
    // Verificar asignación al proyecto
    const { data: projectAssignment, error: assignError } = await supabase
      .from('user_projects')
      .select('*, projects(name)')
      .eq('user_id', user.id)
    
    if (assignError) {
      console.log('⚠️ Error verificando asignación:', assignError.message)
    } else if (projectAssignment.length > 0) {
      console.log('✅ Usuario ya asignado a proyectos:')
      projectAssignment.forEach(p => {
        console.log(`   - ${p.projects.name} (${p.role})`)
      })
    } else {
      console.log('📝 Usuario no asignado a ningún proyecto')
    }
    
    console.log('\n🎯 Para completar la configuración manualmente:')
    console.log('1. Ve al dashboard de Supabase')
    console.log('2. Desactiva temporalmente RLS en table "users"')
    console.log('3. Inserta manualmente:')
    console.log(`   INSERT INTO public.users (id, email, full_name) VALUES ('${user.id}', '${user.email}', 'Usuario Test');`)
    console.log('4. Inserta en user_projects:')
    console.log(`   INSERT INTO public.user_projects (user_id, project_id, role) VALUES ('${user.id}', '820c116f-adaf-4609-9b97-c727e687de79', 'admin');`)
    console.log('5. Reactiva RLS')
    
  } catch (error) {
    console.error('❌ Error creando perfil:', error.message)
  }
}

createUserSimple()