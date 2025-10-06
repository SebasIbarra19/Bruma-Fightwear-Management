// ================================================
// 🔍 DEBUG: Probar llamada a list_products
// ================================================

// Cargar variables de entorno
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testListProducts() {
  try {
    console.log('🔍 Probando list_products...')
    console.log('📍 Project ID: 4cffbb29-0a5b-414c-86c0-9509a19485d3')
    
    // Parámetros exactos como en nuestro código
    const params = {
      p_project_id: '4cffbb29-0a5b-414c-86c0-9509a19485d3',
      p_category_id: null,
      p_product_line_id: null,
      p_limit: 20,
      p_offset: 0,
      p_is_active: null,
      p_track_inventory: null,
      p_low_stock: false,
      p_search: null,
      p_sort_by: 'updated_at',
      p_sort_order: 'desc'
    }
    
    console.log('📤 Parámetros enviados:')
    console.log(JSON.stringify(params, null, 2))
    
    const { data, error } = await supabase.rpc('list_products', params)
    
    if (error) {
      console.error('❌ Error en la llamada:')
      console.error('Code:', error.code)
      console.error('Message:', error.message)
      console.error('Details:', error.details)
      console.error('Hint:', error.hint)
      return
    }
    
    console.log('✅ Llamada exitosa!')
    console.log('📊 Número de registros:', data?.length || 0)
    
    if (data && data.length > 0) {
      console.log('\n🔍 ESTRUCTURA DEL PRIMER REGISTRO:')
      console.log('=====================================')
      const firstRecord = data[0]
      
      // Mostrar cada campo con su tipo y valor
      Object.entries(firstRecord).forEach(([key, value]) => {
        const type = typeof value
        const isNull = value === null
        console.log(`${key}: ${type}${isNull ? ' (null)' : ''} = ${JSON.stringify(value)}`)
      })
      
      console.log('\n📋 REGISTRO COMPLETO (JSON):')
      console.log('=====================================')
      console.log(JSON.stringify(firstRecord, null, 2))
      
      if (data.length > 1) {
        console.log(`\n📚 TOTAL DE ${data.length} REGISTROS ENCONTRADOS`)
        console.log('🔢 Total count del primer registro:', firstRecord.total_count)
      }
    } else {
      console.log('📭 No se encontraron registros')
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:')
    console.error(error)
  }
}

// Ejecutar el test
testListProducts()