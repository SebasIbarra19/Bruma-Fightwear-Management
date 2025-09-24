'use client'

import DatabaseSetup from '@/components/setup/DatabaseSetup'

export default function DatabaseSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🏗️ Configuración de Base de Datos
          </h1>
          <p className="text-gray-600">
            Verifica y configura las tablas necesarias para la Fase 2 de BRUMA
          </p>
        </div>
        
        <DatabaseSetup />
        
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Instrucciones:</h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-1">
            <li>Haz clic en "Verificar Tablas" para comprobar el estado actual</li>
            <li>Si faltan tablas, ve a Supabase Dashboard → SQL Editor</li>
            <li>Copia el contenido del archivo <code className="bg-blue-100 px-1 rounded">/database/phase2-tables.sql</code></li>
            <li>Ejecuta el script en Supabase (ignora errores de tablas faltantes)</li>
            <li>Vuelve aquí y verifica nuevamente</li>
            <li>Una vez que todas las tablas existan, crea datos de ejemplo</li>
          </ol>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded">
            <p className="text-amber-800 text-sm">
              <strong>Nota:</strong> Las tablas de productos (products, product_variants) se crearán más tarde. 
              Por ahora, la Fase 2 funcionará con campos de texto para nombres de productos.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}