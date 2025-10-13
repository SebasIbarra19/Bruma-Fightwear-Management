// ================================================
// 🧪 TEST INVENTORY STORED PROCEDURES
// Script para probar los stored procedures de inventario
// ================================================

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

const BRUMA_PROJECT_ID = '4cffbb29-0a5b-414c-86c0-9509a19485d3'

async function testInventoryStoredProcedures() {
  console.log('🧪 Testing Inventory Stored Procedures...')
  console.log(`📋 Project ID: ${BRUMA_PROJECT_ID}`)
  
  try {
    // 1. Test get_stock_status
    console.log('\n1️⃣ Testing get_stock_status...')
    const { data: stockStatus, error: stockError } = await supabase
      .rpc('get_stock_status', { 
        p_project_id: BRUMA_PROJECT_ID 
      })
    
    if (stockError) {
      console.log('❌ Error:', stockError)
    } else {
      console.log('✅ Stock Status Results:', stockStatus?.length || 0, 'items')
      if (stockStatus && stockStatus.length > 0) {
        console.log('📊 First item:', stockStatus[0])
      }
    }
    
    // 2. Test get_low_stock_alerts
    console.log('\n2️⃣ Testing get_low_stock_alerts...')
    const { data: alerts, error: alertsError } = await supabase
      .rpc('get_low_stock_alerts', { 
        p_project_id: BRUMA_PROJECT_ID 
      })
    
    if (alertsError) {
      console.log('❌ Error:', alertsError)
    } else {
      console.log('✅ Low Stock Alerts:', alerts?.length || 0, 'items')
      if (alerts && alerts.length > 0) {
        console.log('⚠️ First alert:', alerts[0])
      }
    }
    
    // 3. Test get_inventory_valuation
    console.log('\n3️⃣ Testing get_inventory_valuation...')
    const { data: valuation, error: valuationError } = await supabase
      .rpc('get_inventory_valuation', { 
        p_project_id: BRUMA_PROJECT_ID 
      })
    
    if (valuationError) {
      console.log('❌ Error:', valuationError)
    } else {
      console.log('✅ Inventory Valuation:', valuation)
    }

    // 4. Test list_inventory_items
    console.log('\n4️⃣ Testing list_inventory_items...')
    const { data: items, error: itemsError } = await supabase
      .rpc('list_inventory_items', { 
        p_project_id: BRUMA_PROJECT_ID,
        p_limit: 10
      })
    
    if (itemsError) {
      console.log('❌ Error:', itemsError)
    } else {
      console.log('✅ Inventory Items:', items?.length || 0, 'items')
      if (items && items.length > 0) {
        console.log('📦 First item:', items[0])
      }
    }
    
  } catch (error) {
    console.error('💥 Error general:', error)
  }
}

testInventoryStoredProcedures()
