// Script para crear usuario brumafightwear@gmail.com y ajustar roles
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupBrumaUser() {
  console.log('🏢 Configurando usuario BrumaFightwear...\n')
  
  const brumaEmail = 'brumafightwear@gmail.com'
  const brumaPassword = 'menteserena'
  const brumaName = 'BrumaFightwear'
  const projectId = '820c116f-adaf-4609-9b97-c727e687de79'
  const sebastianUserId = '969e5a99-0448-44a4-b0d2-135c6ed32ae4'
  
  try {
    // Paso 1: Registrar usuario BrumaFightwear
    console.log('1️⃣ Registrando usuario brumafightwear@gmail.com...')
    
    const { data: brumaAuth, error: brumaError } = await supabase.auth.signUp({
      email: brumaEmail,
      password: brumaPassword,
      options: {
        data: {
          full_name: brumaName
        }
      }
    })
    
    if (brumaError) {
      if (brumaError.message.includes('already registered') || brumaError.message.includes('already exists')) {
        console.log('⚠️ Usuario ya existe, intentando login...')
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: brumaEmail,
          password: brumaPassword
        })
        
        if (loginError) {
          console.log('❌ Error en login:', loginError.message)
          return
        }
        
        console.log('✅ Login exitoso con usuario existente')
        await setupRoles(loginData.user.id, sebastianUserId, projectId)
      } else {
        console.log('❌ Error registrando usuario:', brumaError.message)
        return
      }
    } else if (brumaAuth.user) {
      console.log('✅ Usuario BrumaFightwear registrado exitosamente')
      console.log(`   ID: ${brumaAuth.user.id}`)
      console.log(`   Email: ${brumaAuth.user.email}`)
      
      await setupRoles(brumaAuth.user.id, sebastianUserId, projectId)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

async function setupRoles(brumaUserId, sebastianUserId, projectId) {
  console.log('\n2️⃣ Configurando roles y asignaciones...')
  
  try {
    // Actualizar el perfil de BrumaFightwear para asegurar que tiene el nombre correcto
    console.log('   📝 Actualizando perfil de BrumaFightwear...')
    const { data: updateProfile, error: updateError } = await supabase
      .from('users')
      .update({
        full_name: 'BrumaFightwear',
        updated_at: new Date().toISOString()
      })
      .eq('id', brumaUserId)
    
    if (updateError) {
      console.log('   ⚠️ Error actualizando perfil:', updateError.message)
    }
    
    // Configurar BrumaFightwear como owner del proyecto
    console.log('   👑 Configurando BrumaFightwear como owner...')
    const { data: ownerAssign, error: ownerError } = await supabase
      .from('user_projects')
      .upsert({
        user_id: brumaUserId,
        project_id: projectId,
        role: 'owner',
        is_active: true,
        assigned_at: new Date().toISOString()
      })
    
    if (ownerError) {
      console.log('   ❌ Error asignando owner:', ownerError.message)
    } else {
      console.log('   ✅ BrumaFightwear configurado como owner')
    }
    
    // Actualizar Sebastian como admin (cambiar de owner a admin)
    console.log('   🔧 Actualizando Sebastian como admin...')
    const { data: adminUpdate, error: adminError } = await supabase
      .from('user_projects')
      .update({
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', sebastianUserId)
      .eq('project_id', projectId)
    
    if (adminError) {
      console.log('   ❌ Error actualizando rol de Sebastian:', adminError.message)
    } else {
      console.log('   ✅ Sebastian actualizado como admin')
    }
    
    // Verificar configuración final
    console.log('\n3️⃣ Verificando configuración final...')
    
    const { data: finalConfig, error: configError } = await supabase
      .from('user_projects')
      .select(`
        role,
        is_active,
        users (email, full_name),
        projects (name)
      `)
      .eq('project_id', projectId)
      .order('role', { ascending: false }) // owner primero, luego admin
    
    if (configError) {
      console.log('❌ Error verificando configuración:', configError.message)
    } else {
      console.log('✅ Configuración final del proyecto E-commerce:')
      finalConfig.forEach((assignment, index) => {
        console.log(`   ${index + 1}. ${assignment.users.full_name} (${assignment.users.email})`)
        console.log(`      Rol: ${assignment.role}`)
        console.log(`      Activo: ${assignment.is_active ? 'Sí' : 'No'}`)
        console.log('      ---')
      })
    }
    
    console.log('\n🎉 ¡Configuración completada!')
    console.log('\n📋 Credenciales para login:')
    console.log('   👑 Owner - brumafightwear@gmail.com / menteserena')
    console.log('   🔧 Admin - ibarraherrerasebastian@gmail.com / [su contraseña]')
    
  } catch (error) {
    console.error('❌ Error configurando roles:', error.message)
  }
}

setupBrumaUser()