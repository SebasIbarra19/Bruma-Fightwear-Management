// ================================================
// 🧪 TESTING UTILITIES PARA DATA ACCESS
// Funciones simples para probar la conexión y SPs
// ================================================

import { dataAccess } from './unified-data-access'

// ================================================
// 🔍 FUNCIONES DE TEST BÁSICAS
// ================================================

/**
 * Test básico de conexión y autenticación
 */
export async function testConnection() {
  console.log('🔍 Testeando conexión con Supabase...')
  
  try {
    const result = await dataAccess.getProjects()
    
    if (result.success) {
      console.log('✅ Conexión exitosa!')
      console.log(`📊 Proyectos encontrados: ${result.data?.length || 0}`)
      
      if (result.data && result.data.length > 0) {
        console.log('🏢 Primer proyecto:', result.data[0])
      }
    } else {
      console.log('❌ Error en conexión:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('💥 Error inesperado:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Test de stored procedures con un proyecto específico
 */
export async function testProjectData(projectId: string) {
  console.log(`🔍 Testeando datos para proyecto: ${projectId}`)
  
  try {
    // Test 1: Obtener proyecto
    const projectResult = await dataAccess.getProject(projectId)
    console.log('📋 Proyecto:', projectResult.success ? '✅' : '❌', projectResult.error || '')
    
    // Test 2: Obtener productos
    const productsResult = await dataAccess.getProducts({ project_id: projectId })
    console.log('🎽 Productos:', productsResult.success ? '✅' : '❌', productsResult.error || '')
    
    if (productsResult.success && productsResult.data) {
      console.log(`📊 Total productos: ${productsResult.data.total}`)
    }
    
    // Test 3: Obtener categorías
    const categoriesResult = await dataAccess.getCategories(projectId)
    console.log('🏷️ Categorías:', categoriesResult.success ? '✅' : '❌', categoriesResult.error || '')
    
    // Test 4: Obtener suppliers
    const suppliersResult = await dataAccess.getSuppliers({ project_id: projectId })
    console.log('🏢 Proveedores:', suppliersResult.success ? '✅' : '❌', suppliersResult.error || '')
    
    if (suppliersResult.success && suppliersResult.data) {
      console.log(`📊 Total proveedores: ${suppliersResult.data.total}`)
    }
    
    // Test 5: Obtener pedidos
    const ordersResult = await dataAccess.getOrders({ project_id: projectId })
    console.log('📦 Pedidos:', ordersResult.success ? '✅' : '❌', ordersResult.error || '')
    
    // Test 6: Obtener inventario
    const inventoryResult = await dataAccess.getInventory(projectId)
    console.log('📊 Inventario:', inventoryResult.success ? '✅' : '❌', inventoryResult.error || '')
    
    return {
      project: projectResult,
      products: productsResult,
      categories: categoriesResult,
      suppliers: suppliersResult,
      orders: ordersResult,
      inventory: inventoryResult
    }
  } catch (error) {
    console.error('💥 Error inesperado en test:', error)
    return { error: (error as Error).message }
  }
}

/**
 * Test de creación de datos
 */
export async function testCreateOperations(projectId: string) {
  console.log(`🔍 Testeando operaciones de creación para proyecto: ${projectId}`)
  
  try {
    // Test: Crear producto
    const testProduct = {
      project_id: projectId,
      name: 'Test Product - Data Access',
      slug: 'test-product-data-access',
      sku: 'TEST-DA-001',
      description: 'Producto de prueba para validar la capa de datos',
      base_price: 29.99,
      base_cost: 15.00,
      tags: ['test', 'data-access'],
      is_active: true
    }
    
    const createResult = await dataAccess.createProduct(testProduct)
    console.log('✨ Crear producto:', createResult.success ? '✅' : '❌', createResult.error || '')
    
    if (createResult.success && createResult.data) {
      console.log('🎯 Producto creado:', createResult.data.name, '-', createResult.data.id)
      
      // Test: Actualizar producto
      const updateResult = await dataAccess.updateProduct(createResult.data.id, {
        description: 'Producto actualizado via Data Access Layer',
        base_price: 34.99
      })
      console.log('📝 Actualizar producto:', updateResult.success ? '✅' : '❌', updateResult.error || '')
      
      // Test: Eliminar producto
      const deleteResult = await dataAccess.deleteProduct(createResult.data.id)
      console.log('🗑️ Eliminar producto:', deleteResult.success ? '✅' : '❌', deleteResult.error || '')
    }
    
    return createResult
  } catch (error) {
    console.error('💥 Error inesperado en test de creación:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Test completo de la capa de datos
 */
export async function runFullDataAccessTest() {
  console.log('🚀 Iniciando test completo de Data Access Layer...')
  console.log('=====================================')
  
  // Test 1: Conexión básica
  const connectionTest = await testConnection()
  
  if (!connectionTest.success) {
    console.log('❌ No se pudo conectar. Abortando tests.')
    return connectionTest
  }
  
  // Obtener primer proyecto para tests
  const projects = 'data' in connectionTest ? connectionTest.data : null
  if (!projects || projects.length === 0) {
    console.log('⚠️ No hay proyectos disponibles para testing')
    return { success: false, error: 'No projects available' }
  }
  
  const testProjectId = projects[0].id
  console.log(`🎯 Usando proyecto para testing: ${projects[0].name} (${testProjectId})`)
  console.log('=====================================')
  
  // Test 2: Datos del proyecto
  await testProjectData(testProjectId)
  console.log('=====================================')
  
  // Test 3: Operaciones CRUD
  await testCreateOperations(testProjectId)
  console.log('=====================================')
  
  console.log('✅ Test completo terminado!')
  
  return { success: true }
}

// ================================================
// 🎯 EJEMPLO DE USO
// ================================================

/**
 * Función helper para usar en componentes React
 */
export async function quickDataTest() {
  const result = await testConnection()
  
  if (result.success) {
    console.log('🎉 Data Access Layer funcionando correctamente!')
    return true
  } else {
    console.error('⚠️ Problema con Data Access Layer:', result.error)
    return false
  }
}