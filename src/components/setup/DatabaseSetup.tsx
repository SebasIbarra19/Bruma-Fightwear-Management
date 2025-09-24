'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DatabaseSetup() {
  const [status, setStatus] = useState<{
    checking: boolean
    tablesExist: boolean
    error: string | null
    tables: string[]
  }>({
    checking: false,
    tablesExist: false,
    error: null,
    tables: []
  })

  const checkTables = async () => {
    setStatus(prev => ({ ...prev, checking: true, error: null }))
    
    try {
      const tablesToCheck = ['suppliers', 'inventory', 'purchase_orders', 'purchase_order_items', 'inventory_movements']
      const existingTables: string[] = []
      
      for (const table of tablesToCheck) {
        try {
          const { error } = await supabase
            .from(table)
            .select('*')
            .limit(1)
            
          if (!error) {
            existingTables.push(table)
          }
        } catch (err) {
          console.log(`Table ${table} doesn't exist:`, err)
        }
      }
      
      setStatus(prev => ({
        ...prev,
        checking: false,
        tablesExist: existingTables.length === tablesToCheck.length,
        tables: existingTables
      }))
      
    } catch (error) {
      console.error('Error checking tables:', error)
      setStatus(prev => ({
        ...prev,
        checking: false,
        error: 'Error verificando tablas: ' + (error as Error).message
      }))
    }
  }

  const createSampleData = async () => {
    try {
      // Obtener el proyecto actual
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('No hay sesión activa')
        return
      }

      // Buscar un proyecto del usuario
      const { data: userProjects } = await supabase
        .rpc('get_user_projects', { user_uuid: session.user.id })

      if (!userProjects || userProjects.length === 0) {
        alert('No hay proyectos disponibles. Crea un proyecto primero.')
        return
      }

      const projectId = userProjects[0].project_id

      // Crear proveedores de ejemplo
      const { error: suppliersError } = await supabase
        .from('suppliers')
        .insert([
          {
            project_id: projectId,
            name: 'Proveedor Deportivo S.A.',
            contact_person: 'Juan Pérez',
            email: 'juan@proveedor.com',
            phone: '+1-555-0101',
            address: 'Av. Deportes 123',
            city: 'Lima',
            country: 'Perú',
            payment_terms: '30 días',
            is_active: true
          },
          {
            project_id: projectId,
            name: 'Textiles Combat Pro',
            contact_person: 'María García',
            email: 'maria@combatpro.com',
            phone: '+1-555-0102',
            address: 'Calle Industrial 456',
            city: 'Lima',
            country: 'Perú',
            payment_terms: 'Contado',
            is_active: true
          }
        ])

      if (suppliersError) {
        console.error('Error creando proveedores:', suppliersError)
        alert('Error creando proveedores: ' + suppliersError.message)
        return
      }

      // Obtener IDs de proveedores creados
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('project_id', projectId)

      if (suppliers && suppliers.length > 0) {
        // Crear items de inventario de ejemplo
        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert([
            {
              project_id: projectId,
              supplier_id: suppliers[0].id,
              sku: 'GLV-001',
              product_name: 'Guantes de Boxeo Profesionales',
              product_description: 'Guantes de cuero genuino para entrenamiento',
              quantity_available: 50,
              quantity_reserved: 5,
              reorder_level: 10,
              unit_cost: 45.00,
              location: 'Almacén A-1'
            },
            {
              project_id: projectId,
              supplier_id: suppliers[1].id,
              sku: 'SHT-002',
              product_name: 'Camiseta de Entrenamiento',
              product_description: 'Camiseta técnica transpirable',
              quantity_available: 100,
              quantity_reserved: 15,
              reorder_level: 20,
              unit_cost: 25.00,
              location: 'Almacén B-2'
            }
          ])

        if (inventoryError) {
          console.error('Error creando inventario:', inventoryError)
          alert('Error creando inventario: ' + inventoryError.message)
          return
        }

        alert('Datos de ejemplo creados exitosamente!')
      } else {
        alert('Datos de ejemplo creados exitosamente!')
      }

    } catch (error) {
      console.error('Error creando datos:', error)
      alert('Error creando datos de ejemplo')
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Verificación de Base de Datos - Fase 2</h2>
      
      <div className="space-y-4">
        <button
          onClick={checkTables}
          disabled={status.checking}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {status.checking ? 'Verificando...' : 'Verificar Tablas'}
        </button>

        {status.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700">{status.error}</p>
          </div>
        )}

        {status.tables.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800 mb-2">
              Tablas encontradas ({status.tables.length}/5):
            </h3>
            <ul className="list-disc list-inside text-green-700">
              {status.tables.map(table => (
                <li key={table}>{table}</li>
              ))}
            </ul>
            
            {status.tablesExist && (
              <div className="mt-4">
                <button
                  onClick={createSampleData}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Crear Datos de Ejemplo
                </button>
              </div>
            )}
          </div>
        )}

        {!status.tablesExist && status.tables.length < 5 && status.tables.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">
              Faltan algunas tablas. Ejecuta el script SQL en Supabase:
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Ve a Supabase Dashboard → SQL Editor → Nuevo query → Copia el contenido de 
              <code className="bg-yellow-100 px-1 rounded">/database/phase2-tables.sql</code>
            </p>
          </div>
        )}

        {status.tables.length === 0 && !status.checking && !status.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 font-semibold">
              ⚠️ No se encontraron tablas de la Fase 2
            </p>
            <p className="text-red-700 mt-2">
              Necesitas ejecutar el script SQL para crear las tablas:
            </p>
            <ol className="list-decimal list-inside text-red-700 mt-2 space-y-1">
              <li>Ve a Supabase Dashboard</li>
              <li>Abre el SQL Editor</li>
              <li>Crea un nuevo query</li>
              <li>Copia todo el contenido del archivo <code className="bg-red-100 px-1 rounded">/database/phase2-tables.sql</code></li>
              <li>Ejecuta el script</li>
              <li>Vuelve aquí y verifica las tablas</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}