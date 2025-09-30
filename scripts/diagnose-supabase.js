// Script para diagnosticar problemas específicos de Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Configuración de Supabase:')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NO ENCONTRADA')

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseSupabase() {
  console.log('\n🔍 Diagnosticando Supabase...\n')
  
  try {
    // Test 1: Conectividad básica
    console.log('1️⃣ Probando conectividad básica...')
    const { data: testConnection, error: connectionError } = await supabase
      .from('projects')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.log('❌ Error de conectividad:', connectionError.message)
      return
    }
    console.log('✅ Conectividad OK')
    
    // Test 2: Verificar que las tablas existen
    console.log('\n2️⃣ Verificando estructura de tablas...')
    
    const tables = ['users', 'user_projects', 'projects']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
          
        if (error) {
          console.log(`❌ Tabla ${table}: ${error.message}`)
        } else {
          console.log(`✅ Tabla ${table}: Accesible`)
        }
      } catch (err) {
        console.log(`❌ Tabla ${table}: Error inesperado`)
      }
    }
    
    // Test 3: Intentar insertar directamente en public.users
    console.log('\n3️⃣ Probando inserción directa en public.users...')
    
    const testUserId = 'test-' + Date.now()
    const { data: insertTest, error: insertError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: 'test-insert@example.com',
        full_name: 'Test User'
      })
      .select()
    
    if (insertError) {
      console.log('❌ Error insertando en users:', insertError.message)
      console.log('Detalles del error:', insertError)
      
      // Analizar el tipo de error
      if (insertError.message.includes('duplicate key')) {
        console.log('💡 El error es por clave duplicada - tabla funciona')
      } else if (insertError.message.includes('permission denied')) {
        console.log('💡 El error es de permisos - necesitamos configurar RLS')
      } else if (insertError.message.includes('relation') && insertError.message.includes('does not exist')) {
        console.log('💡 La tabla no existe - necesitamos crearla')
      }
    } else {
      console.log('✅ Inserción directa exitosa')
      
      // Limpiar test
      await supabase
        .from('users')
        .delete()
        .eq('id', testUserId)
    }
    
    // Test 4: Probar auth con datos muy simples
    console.log('\n4️⃣ Probando registro de auth simple...')
    
    const simpleEmail = `simple-test-${Date.now()}@example.com`
    const { data: authTest, error: authError } = await supabase.auth.signUp({
      email: simpleEmail,
      password: '123456789'
    })
    
    if (authError) {
      console.log('❌ Error en auth.signUp:', authError.message)
      console.log('Código de error:', authError.status)
      console.log('Detalles completos:', authError)
    } else {
      console.log('✅ Auth.signUp funciona correctamente')
      if (authTest.user) {
        console.log('Usuario creado con ID:', authTest.user.id)
      }
    }
    
  } catch (error) {
    console.error('❌ Error general en diagnóstico:', error)
  }
}

diagnoseSupabase()