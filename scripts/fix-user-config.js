// Script para arreglar la configuración de roles y perfiles
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixUserConfiguration() {
  console.log('🔧 Arreglando configuración de usuarios...\n')
  
  const projectId = '820c116f-adaf-4609-9b97-c727e687de79'
  const sebastianUserId = '969e5a99-0448-44a4-b0d2-135c6ed32ae4'
  const brumaUserId = 'e435d7eb-a033-4bb0-b34c-2a040c5d2f36'
  
  try {
    // Paso 1: Crear/actualizar perfil de BrumaFightwear
    console.log('1️⃣ Creando perfil para BrumaFightwear...')
    
    const { data: brumaProfile, error: brumaProfileError } = await supabase
      .from('users')
      .upsert({
        id: brumaUserId,
        email: 'brumafightwear@gmail.com',
        full_name: 'BrumaFightwear',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (brumaProfileError) {
      console.log('❌ Error creando perfil BrumaFightwear:', brumaProfileError.message)
    } else {
      console.log('✅ Perfil BrumaFightwear creado/actualizado')
    }
    
    // Paso 2: Actualizar rol de Sebastian a admin
    console.log('\n2️⃣ Actualizando Sebastian a rol admin...')
    
    const { data: sebastianUpdate, error: sebastianError } = await supabase
      .from('user_projects')
      .update({ role: 'admin' })
      .eq('user_id', sebastianUserId)
      .eq('project_id', projectId)
      .select()
    
    if (sebastianError) {
      console.log('❌ Error actualizando Sebastian:', sebastianError.message)
    } else {
      console.log('✅ Sebastian actualizado a admin')
    }
    
    // Paso 3: Verificar que BrumaFightwear sea owner
    console.log('\n3️⃣ Verificando rol de BrumaFightwear...')
    
    const { data: brumaRole, error: brumaRoleError } = await supabase
      .from('user_projects')
      .select('role')
      .eq('user_id', brumaUserId)
      .eq('project_id', projectId)
      .single()
    
    if (brumaRoleError) {
      console.log('❌ Error verificando rol:', brumaRoleError.message)
    } else {
      console.log(`✅ BrumaFightwear tiene rol: ${brumaRole.role}`)
    }
    
    // Paso 4: Verificación final
    console.log('\n4️⃣ Verificación final...')
    
    // Verificar perfiles de usuario
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .order('email')
    
    if (usersError) {
      console.log('❌ Error consultando usuarios:', usersError.message)
    } else {
      console.log('👥 Perfiles de usuario:')
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.full_name} (${user.email})`)
        console.log(`      ID: ${user.id}`)
      })
    }
    
    // Verificar asignaciones de proyecto
    const { data: projectAssignments, error: assignError } = await supabase
      .from('user_projects')
      .select('user_id, role, is_active')
      .eq('project_id', projectId)
      .order('role', { ascending: false })
    
    if (assignError) {
      console.log('\n❌ Error consultando asignaciones:', assignError.message)
    } else {
      console.log('\n🏢 Asignaciones del proyecto E-commerce:')
      
      for (const assignment of projectAssignments) {
        // Buscar el usuario correspondiente
        const user = allUsers?.find(u => u.id === assignment.user_id)
        if (user) {
          console.log(`   ${assignment.role.toUpperCase()}: ${user.full_name} (${user.email})`)
          console.log(`   Activo: ${assignment.is_active ? 'Sí' : 'No'}`)
          console.log('   ---')
        }
      }
    }
    
    console.log('\n🎉 Configuración completada!')
    console.log('\n📋 Credenciales para pruebas:')
    console.log('   👑 OWNER: brumafightwear@gmail.com / menteserena')
    console.log('   🔧 ADMIN: ibarraherrerasebastian@gmail.com / [tu contraseña]')
    console.log('\n💡 Ahora puedes probar el login en la aplicación.')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

fixUserConfiguration()