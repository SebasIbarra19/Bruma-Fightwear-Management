// ================================================
// 🔍 DEBUG: Probar API route de productos
// ================================================

// Cargar variables de entorno
require('dotenv').config()

async function testProductsAPI() {
  try {
    console.log('🔍 Probando API route de productos...')
    console.log('📍 Project ID: 4cffbb29-0a5b-414c-86c0-9509a19485d3')
    
    const projectId = '4cffbb29-0a5b-414c-86c0-9509a19485d3'
    const url = `http://localhost:3000/api/products?project_id=${projectId}&page=1&limit=5`
    
    console.log('📤 URL:', url)
    
    const response = await fetch(url)
    const data = await response.json()
    
    console.log('📊 Status:', response.status)
    console.log('✅ Response recibida!')
    
    if (data.success) {
      console.log('\n🎉 SUCCESS!')
      console.log('📊 Total de productos:', data.data?.total || 0)
      console.log('📄 Productos en esta página:', data.data?.data?.length || 0)
      
      if (data.data?.data && data.data.data.length > 0) {
        console.log('\n🔍 ESTRUCTURA DEL PRIMER PRODUCTO:')
        console.log('=====================================')
        const firstProduct = data.data.data[0]
        
        // Mostrar cada campo con su tipo y valor
        Object.entries(firstProduct).forEach(([key, value]) => {
          const type = typeof value
          const isNull = value === null
          console.log(`${key}: ${type}${isNull ? ' (null)' : ''} = ${JSON.stringify(value)}`)
        })
        
        console.log('\n📋 PRODUCTO COMPLETO (JSON):')
        console.log('=====================================')
        console.log(JSON.stringify(firstProduct, null, 2))
        
        console.log('\n📚 PAGINACIÓN:')
        console.log('=====================================')
        console.log('Total:', data.data.total)
        console.log('Página:', data.data.page)
        console.log('Límite:', data.data.limit)
        console.log('Total páginas:', data.data.totalPages)
      }
    } else {
      console.log('\n❌ ERROR EN LA API:')
      console.log('Error:', data.error)
      console.log('Data completa:', JSON.stringify(data, null, 2))
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:')
    console.error(error)
  }
}

// Ejecutar el test
testProductsAPI()