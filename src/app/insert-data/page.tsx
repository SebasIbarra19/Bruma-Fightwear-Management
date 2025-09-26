'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export default function InsertInventoryDataPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    getUser()
  }, [])

  const insertSuppliers = async () => {
    setLoading(true)
    try {
      // Primero, obtener el project_id correcto para BRUMA
      const { data: projects } = await supabase
        .from('user_projects')
        .select('project_id, project_name')
        .ilike('project_name', '%bruma%')

      if (!projects || projects.length === 0) {
        setResults(['❌ No se encontró proyecto BRUMA'])
        return
      }

      const brumaProjectId = projects[0].project_id
      setResults([`✅ Proyecto BRUMA encontrado: ${brumaProjectId}`])

      // Insertar proveedores
      const suppliers = [
        {
          project_id: brumaProjectId,
          name: 'Textiles Maya',
          contact_name: 'Juan Carlos López',
          contact_email: 'juan@textilesmaya.com',
          contact_phone: '+502 2345-6789',
          address: 'Zona 4, Ciudad de Guatemala',
          city: 'Guatemala',
          country: 'Guatemala',
          is_active: true
        },
        {
          project_id: brumaProjectId,
          name: 'Bordados Premium',
          contact_name: 'María Rodríguez',
          contact_email: 'maria@bordadospremium.com',
          contact_phone: '+502 3456-7890',
          address: 'Zona 10, Ciudad de Guatemala',
          city: 'Guatemala',
          country: 'Guatemala',
          is_active: true
        }
      ]

      const { data: insertedSuppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .insert(suppliers)
        .select()

      if (suppliersError) {
        setResults(prev => [...prev, `❌ Error insertando proveedores: ${suppliersError.message}`])
        return
      }

      setResults(prev => [...prev, `✅ ${insertedSuppliers?.length} proveedores insertados`])

      // Ahora insertar inventario usando el primer proveedor
      const supplierId = insertedSuppliers?.[0]?.id

      const inventoryItems = [
        {
          project_id: brumaProjectId,
          supplier_id: supplierId,
          name: 'Rashguard Manga Larga Negra',
          sku: 'BRU-RG-001',
          description: 'Rashguard de manga larga para entrenamiento MMA',
          category: 'Rashguards',
          quantity: 25,
          min_stock_level: 5,
          max_stock_level: 50,
          unit_cost: 35.00,
          selling_price: 75.00,
          location: 'Almacén A-1',
          is_active: true
        },
        {
          project_id: brumaProjectId,
          supplier_id: supplierId,
          name: 'Shorts MMA BRUMA Classic',
          sku: 'BRU-SH-001',
          description: 'Shorts de MMA con velcro lateral y bordado BRUMA',
          category: 'Shorts',
          quantity: 18,
          min_stock_level: 3,
          max_stock_level: 30,
          unit_cost: 28.00,
          selling_price: 65.00,
          location: 'Almacén A-2',
          is_active: true
        },
        {
          project_id: brumaProjectId,
          supplier_id: supplierId,
          name: 'Guantes MMA 4oz Profesional',
          sku: 'BRU-GL-001',
          description: 'Guantes de MMA 4oz con cierre de velcro',
          category: 'Guantes',
          quantity: 12,
          min_stock_level: 2,
          max_stock_level: 20,
          unit_cost: 45.00,
          selling_price: 95.00,
          location: 'Almacén B-1',
          is_active: true
        },
        {
          project_id: brumaProjectId,
          supplier_id: supplierId,
          name: 'Espinilleras BRUMA Pro',
          sku: 'BRU-SP-001',
          description: 'Espinilleras de alta calidad con amortiguación',
          category: 'Protecciones',
          quantity: 8,
          min_stock_level: 2,
          max_stock_level: 15,
          unit_cost: 52.00,
          selling_price: 110.00,
          location: 'Almacén B-2',
          is_active: true
        },
        {
          project_id: brumaProjectId,
          supplier_id: supplierId,
          name: 'Camiseta BRUMA Logo',
          sku: 'BRU-TS-001',
          description: 'Camiseta casual con logo BRUMA bordado',
          category: 'Camisetas',
          quantity: 35,
          min_stock_level: 10,
          max_stock_level: 60,
          unit_cost: 15.00,
          selling_price: 35.00,
          location: 'Almacén A-3',
          is_active: true
        }
      ]

      const { data: insertedInventory, error: inventoryError } = await supabase
        .from('inventory')
        .insert(inventoryItems)
        .select()

      if (inventoryError) {
        setResults(prev => [...prev, `❌ Error insertando inventario: ${inventoryError.message}`])
        return
      }

      setResults(prev => [...prev, `✅ ${insertedInventory?.length} items de inventario insertados`])

    } catch (error) {
      console.error('Error:', error)
      setResults(prev => [...prev, `❌ Error: ${error}`])
    } finally {
      setLoading(false)
    }
  }

  const insertPurchaseOrders = async () => {
    setLoading(true)
    try {
      // Obtener el project_id correcto para BRUMA
      const { data: projects } = await supabase
        .from('user_projects')
        .select('project_id, project_name')
        .ilike('project_name', '%bruma%')

      if (!projects || projects.length === 0) {
        setResults(['❌ No se encontró proyecto BRUMA'])
        return
      }

      const brumaProjectId = projects[0].project_id
      setResults([`✅ Proyecto BRUMA encontrado: ${brumaProjectId}`])

      // Obtener suppliers existentes
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('project_id', brumaProjectId)
        .limit(3)

      if (!suppliers || suppliers.length === 0) {
        setResults(prev => [...prev, '❌ No se encontraron proveedores. Inserta primero los proveedores.'])
        return
      }

      // Crear órdenes de compra
      const purchaseOrders = [
        {
          project_id: brumaProjectId,
          supplier_id: suppliers[0].id,
          order_number: 'PO-2024-001',
          status: 'ordered',
          order_date: new Date('2024-09-01').toISOString(),
          expected_date: new Date('2024-09-15').toISOString(),
          subtotal: 850.00,
          tax_amount: 127.50,
          shipping_cost: 25.00,
          total_amount: 1002.50,
          currency: 'USD',
          payment_terms: 'Net 30',
          notes: 'Orden para restock de productos principales'
        },
        {
          project_id: brumaProjectId,
          supplier_id: suppliers[1] ? suppliers[1].id : suppliers[0].id,
          order_number: 'PO-2024-002',
          status: 'pending',
          order_date: new Date('2024-09-15').toISOString(),
          expected_date: new Date('2024-09-30').toISOString(),
          subtotal: 450.00,
          tax_amount: 67.50,
          shipping_cost: 15.00,
          total_amount: 532.50,
          currency: 'USD',
          payment_terms: 'Net 15',
          notes: 'Orden de productos de protección'
        },
        {
          project_id: brumaProjectId,
          supplier_id: suppliers[2] ? suppliers[2].id : suppliers[0].id,
          order_number: 'PO-2024-003',
          status: 'draft',
          order_date: null,
          expected_date: null,
          subtotal: 0.00,
          tax_amount: 0.00,
          shipping_cost: 0.00,
          total_amount: 0.00,
          currency: 'USD',
          payment_terms: 'Net 30',
          notes: 'Orden en borrador para próxima compra'
        }
      ]

      const { data: insertedOrders, error: ordersError } = await supabase
        .from('purchase_orders')
        .insert(purchaseOrders)
        .select()

      if (ordersError) {
        setResults(prev => [...prev, `❌ Error insertando órdenes: ${ordersError.message}`])
        return
      }

      setResults(prev => [...prev, `✅ Insertadas ${insertedOrders.length} órdenes de compra`])

      // Insertar items para las órdenes
      const purchaseOrderItems = [
        // Items para PO-2024-001
        {
          purchase_order_id: insertedOrders[0].id,
          sku: 'BRU-RG-001-L',
          description: 'Rashguard BRUMA Fightwear Talla L',
          quantity_ordered: 10,
          quantity_received: 10,
          unit_cost: 35.00,
          total_cost: 350.00,
          notes: 'Recibido completo'
        },
        {
          purchase_order_id: insertedOrders[0].id,
          sku: 'BRU-SH-001-M',
          description: 'Shorts MMA BRUMA Classic Talla M',
          quantity_ordered: 15,
          quantity_received: 15,
          unit_cost: 28.00,
          total_cost: 420.00,
          notes: 'Recibido completo'
        },
        {
          purchase_order_id: insertedOrders[0].id,
          sku: 'BRU-GL-001',
          description: 'Guantes MMA 4oz Profesional',
          quantity_ordered: 4,
          quantity_received: 4,
          unit_cost: 45.00,
          total_cost: 180.00,
          notes: 'Recibido completo'
        },
        // Items para PO-2024-002
        {
          purchase_order_id: insertedOrders[1].id,
          sku: 'BRU-SP-001',
          description: 'Espinilleras BRUMA Pro',
          quantity_ordered: 8,
          quantity_received: 0,
          unit_cost: 32.50,
          total_cost: 260.00,
          notes: 'Pendiente de recibir'
        },
        {
          purchase_order_id: insertedOrders[1].id,
          sku: 'BRU-PB-001',
          description: 'Protector Bucal BRUMA Custom',
          quantity_ordered: 20,
          quantity_received: 0,
          unit_cost: 9.50,
          total_cost: 190.00,
          notes: 'Pendiente de recibir'
        }
      ]

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(purchaseOrderItems)

      if (itemsError) {
        setResults(prev => [...prev, `❌ Error insertando items: ${itemsError.message}`])
        return
      }

      setResults(prev => [...prev, `✅ Insertados ${purchaseOrderItems.length} items en las órdenes`])
      setResults(prev => [...prev, '✅ Datos de Purchase Orders insertados correctamente'])

    } catch (error) {
      console.error('Error:', error)
      setResults(prev => [...prev, `❌ Error: ${error}`])
    } finally {
      setLoading(false)
    }
  }

  const insertInventoryMovements = async () => {
    setLoading(true)
    try {
      // Obtener el project_id correcto para BRUMA
      const { data: projects } = await supabase
        .from('user_projects')
        .select('project_id, project_name')
        .ilike('project_name', '%bruma%')

      if (!projects || projects.length === 0) {
        setResults(['❌ No se encontró proyecto BRUMA'])
        return
      }

      const brumaProjectId = projects[0].project_id
      setResults([`✅ Proyecto BRUMA encontrado: ${brumaProjectId}`])

      // Obtener inventory items existentes
      const { data: inventoryItems } = await supabase
        .from('inventory')
        .select('id, sku, product_name, unit_cost')
        .eq('project_id', brumaProjectId)
        .limit(5)

      if (!inventoryItems || inventoryItems.length === 0) {
        setResults(prev => [...prev, '❌ No se encontraron items de inventario. Inserta primero el inventario.'])
        return
      }

      // Obtener el usuario actual para created_by
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setResults(prev => [...prev, '❌ Usuario no autenticado'])
        return
      }

      const userId = session.user.id

      // Crear movimientos de inventario simulando diferentes scenarios
      const inventoryMovements = [
        // Entradas (recepción de mercancía)
        {
          project_id: brumaProjectId,
          inventory_id: inventoryItems[0].id,
          movement_type: 'in',
          quantity: 25,
          unit_cost: inventoryItems[0].unit_cost || 35.00,
          total_cost: 25 * (inventoryItems[0].unit_cost || 35.00),
          reference_type: 'purchase_order',
          reference_id: null, // Podríamos linkear a una PO real
          notes: `Recepción de mercancía - ${inventoryItems[0].sku}`,
          created_by: userId
        },
        {
          project_id: brumaProjectId,
          inventory_id: inventoryItems[1].id,
          movement_type: 'in',
          quantity: 30,
          unit_cost: inventoryItems[1].unit_cost || 28.00,
          total_cost: 30 * (inventoryItems[1].unit_cost || 28.00),
          reference_type: 'purchase_order',
          reference_id: null,
          notes: `Recepción de mercancía - ${inventoryItems[1].sku}`,
          created_by: userId
        },
        // Salidas (ventas)
        {
          project_id: brumaProjectId,
          inventory_id: inventoryItems[0].id,
          movement_type: 'out',
          quantity: -5,
          unit_cost: inventoryItems[0].unit_cost || 35.00,
          total_cost: -5 * (inventoryItems[0].unit_cost || 35.00),
          reference_type: 'sale',
          reference_id: null,
          notes: `Venta a cliente - ${inventoryItems[0].sku}`,
          created_by: userId
        },
        {
          project_id: brumaProjectId,
          inventory_id: inventoryItems[1].id,
          movement_type: 'out',
          quantity: -8,
          unit_cost: inventoryItems[1].unit_cost || 28.00,
          total_cost: -8 * (inventoryItems[1].unit_cost || 28.00),
          reference_type: 'sale',
          reference_id: null,
          notes: `Venta a cliente - ${inventoryItems[1].sku}`,
          created_by: userId
        },
        // Ajustes de inventario
        {
          project_id: brumaProjectId,
          inventory_id: inventoryItems[2].id,
          movement_type: 'adjustment',
          quantity: -2,
          unit_cost: inventoryItems[2].unit_cost || 45.00,
          total_cost: -2 * (inventoryItems[2].unit_cost || 45.00),
          reference_type: 'inventory_adjustment',
          reference_id: null,
          notes: `Ajuste por productos dañados - ${inventoryItems[2].sku}`,
          created_by: userId
        },
        {
          project_id: brumaProjectId,
          inventory_id: inventoryItems[3]?.id || inventoryItems[0].id,
          movement_type: 'adjustment',
          quantity: 3,
          unit_cost: inventoryItems[3]?.unit_cost || inventoryItems[0].unit_cost || 25.00,
          total_cost: 3 * (inventoryItems[3]?.unit_cost || inventoryItems[0].unit_cost || 25.00),
          reference_type: 'inventory_adjustment',
          reference_id: null,
          notes: `Ajuste positivo por reconteo - ${inventoryItems[3]?.sku || inventoryItems[0].sku}`,
          created_by: userId
        },
        // Transferencias entre ubicaciones
        {
          project_id: brumaProjectId,
          inventory_id: inventoryItems[0].id,
          movement_type: 'transfer',
          quantity: 10,
          unit_cost: inventoryItems[0].unit_cost || 35.00,
          total_cost: 10 * (inventoryItems[0].unit_cost || 35.00),
          reference_type: 'location_transfer',
          reference_id: null,
          notes: `Transferencia de Almacén A a Almacén B - ${inventoryItems[0].sku}`,
          created_by: userId
        },
        {
          project_id: brumaProjectId,
          inventory_id: inventoryItems[1].id,
          movement_type: 'transfer',
          quantity: -5,
          unit_cost: inventoryItems[1].unit_cost || 28.00,
          total_cost: -5 * (inventoryItems[1].unit_cost || 28.00),
          reference_type: 'location_transfer',
          reference_id: null,
          notes: `Transferencia de Almacén B a Tienda - ${inventoryItems[1].sku}`,
          created_by: userId
        }
      ]

      const { error: movementsError } = await supabase
        .from('inventory_movements')
        .insert(inventoryMovements)

      if (movementsError) {
        setResults(prev => [...prev, `❌ Error insertando movimientos: ${movementsError.message}`])
        return
      }

      setResults(prev => [...prev, `✅ Insertados ${inventoryMovements.length} movimientos de inventario`])
      setResults(prev => [...prev, '✅ Datos de Inventory Movements insertados correctamente'])

    } catch (error) {
      console.error('Error:', error)
      setResults(prev => [...prev, `❌ Error: ${error}`])
    } finally {
      setLoading(false)
    }
  }

  const verifyData = async () => {
    try {
      const { data: inventory } = await supabase
        .from('inventory')
        .select(`
          *,
          suppliers (name)
        `)
        .limit(10)

      setResults(prev => [...prev, `📊 Inventario encontrado: ${JSON.stringify(inventory, null, 2)}`])
    } catch (error) {
      setResults(prev => [...prev, `❌ Error verificando: ${error}`])
    }
  }

  if (!user) {
    return <div>Necesitas estar logueado</div>
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Insertar Datos de Inventario BRUMA</CardTitle>
          <CardDescription>
            Script para insertar datos de prueba en BRUMA Fightwear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={insertSuppliers} disabled={loading}>
              {loading ? 'Insertando...' : 'Insertar Datos de Inventario'}
            </Button>
            
            <Button onClick={insertPurchaseOrders} disabled={loading} variant="outline">
              {loading ? 'Insertando...' : 'Insertar Purchase Orders'}
            </Button>
            
            <Button onClick={insertInventoryMovements} disabled={loading} variant="outline">
              {loading ? 'Insertando...' : 'Insertar Inventory Movements'}
            </Button>
            
            <Button onClick={verifyData} variant="outline">
              Verificar Datos
            </Button>

            <div className="border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="mb-2 text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}