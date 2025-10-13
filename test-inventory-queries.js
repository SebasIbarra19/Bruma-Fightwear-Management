// ================================================
// 🧪 TEST INVENTORY SQL QUERIES
// Test de las queries SQL simples sin autenticación
// ================================================

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

const BRUMA_PROJECT_ID = '4cffbb29-0a5b-414c-86c0-9509a19485d3'

async function testInventoryQueries() {
  console.log('🧪 Testing Inventory SQL Queries...')
  console.log(`📋 Project ID: ${BRUMA_PROJECT_ID}`)
  
  try {
    // 1. Test Inventory Stats Summary
    console.log('\n1️⃣ Testing Inventory Stats Summary...')
    
    const statsQuery = `
      SELECT 
          COUNT(DISTINCT p.id) as total_products,
          COALESCE(SUM(i.quantity_available * i.average_cost), 0) as total_stock_value,
          COALESCE(SUM(i.quantity_available), 0) as total_items_count,
          COUNT(CASE WHEN i.quantity_available <= i.reorder_level THEN 1 END) as low_stock_count
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE i.project_id = $1
          AND p.track_inventory = true
          AND p.is_active = true
          AND pv.is_active = true
    `
    
    const { data: stats, error: statsError } = await supabase
      .rpc('exec_sql', { 
        query: statsQuery,
        params: [BRUMA_PROJECT_ID]
      })
    
    if (statsError) {
      console.log('❌ Stats Error:', statsError)
      
      // Fallback: try direct table query
      console.log('📊 Trying direct inventory query...')
      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select(`
          id,
          quantity_available,
          average_cost,
          reorder_level,
          product_variants!inner(
            id,
            sku,
            name,
            is_active,
            products!inner(
              id,
              name,
              track_inventory,
              is_active
            )
          )
        `)
        .eq('project_id', BRUMA_PROJECT_ID)
        .eq('product_variants.is_active', true)
        .eq('product_variants.products.is_active', true)
        .eq('product_variants.products.track_inventory', true)
      
      if (invError) {
        console.log('❌ Inventory Error:', invError)
      } else {
        console.log('✅ Inventory Items:', inventory?.length || 0)
        if (inventory && inventory.length > 0) {
          const totalProducts = new Set(inventory.map(item => 
            item.product_variants.products.id
          )).size
          
          const totalStockValue = inventory.reduce((sum, item) => 
            sum + (item.quantity_available * (item.average_cost || 0)), 0
          )
          
          const totalItemsCount = inventory.reduce((sum, item) => 
            sum + item.quantity_available, 0
          )
          
          const lowStockCount = inventory.filter(item => 
            item.quantity_available <= (item.reorder_level || 0)
          ).length
          
          console.log('📊 Calculated Stats:', {
            total_products: totalProducts,
            total_stock_value: totalStockValue,
            total_items_count: totalItemsCount,
            low_stock_count: lowStockCount
          })
        }
      }
    } else {
      console.log('✅ Stats Results:', stats)
    }
    
    // 2. Test Low Stock Alerts
    console.log('\n2️⃣ Testing Low Stock Alerts...')
    
    const { data: alerts, error: alertsError } = await supabase
      .from('inventory')
      .select(`
        id,
        quantity_available,
        reorder_level,
        reorder_quantity,
        average_cost,
        location,
        updated_at,
        product_variants!inner(
          id,
          sku,
          name,
          is_active,
          products!inner(
            id,
            name,
            track_inventory,
            is_active
          )
        )
      `)
      .eq('project_id', BRUMA_PROJECT_ID)
      .eq('product_variants.is_active', true)
      .eq('product_variants.products.is_active', true)
      .eq('product_variants.products.track_inventory', true)
      .lte('quantity_available', supabase.rpc('coalesce', { value: 'reorder_level', fallback: 0 }))
    
    if (alertsError) {
      console.log('❌ Alerts Error:', alertsError)
    } else {
      console.log('✅ Low Stock Items:', alerts?.length || 0)
      if (alerts && alerts.length > 0) {
        console.log('⚠️ First alert:', {
          product: alerts[0].product_variants.products.name,
          variant: alerts[0].product_variants.name,
          sku: alerts[0].product_variants.sku,
          stock: alerts[0].quantity_available,
          reorder_level: alerts[0].reorder_level
        })
      }
    }
    
    // 3. Test Basic Inventory List
    console.log('\n3️⃣ Testing Inventory List...')
    
    const { data: items, error: itemsError } = await supabase
      .from('inventory')
      .select(`
        id,
        quantity_available,
        average_cost,
        last_cost,
        reorder_level,
        reorder_quantity,
        location,
        created_at,
        updated_at,
        product_variants!inner(
          id,
          sku,
          name,
          size,
          color,
          variant_description,
          is_active,
          products!inner(
            id,
            name,
            sku,
            track_inventory,
            is_active,
            categories(
              id,
              name
            )
          )
        )
      `)
      .eq('project_id', BRUMA_PROJECT_ID)
      .eq('product_variants.is_active', true)
      .eq('product_variants.products.is_active', true)
      .eq('product_variants.products.track_inventory', true)
      .limit(10)
    
    if (itemsError) {
      console.log('❌ Items Error:', itemsError)
    } else {
      console.log('✅ Inventory Items:', items?.length || 0)
      if (items && items.length > 0) {
        console.log('📦 First item:', {
          product: items[0].product_variants.products.name,
          variant: items[0].product_variants.name,
          sku: items[0].product_variants.sku,
          stock: items[0].quantity_available,
          value: items[0].quantity_available * (items[0].average_cost || 0),
          category: items[0].product_variants.products.categories?.name || 'Sin Categoría'
        })
      }
    }
    
  } catch (error) {
    console.error('💥 Error general:', error)
  }
}

// Run if called directly
if (require.main === module) {
  testInventoryQueries()
}

module.exports = { testInventoryQueries }