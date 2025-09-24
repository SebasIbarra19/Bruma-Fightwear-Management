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