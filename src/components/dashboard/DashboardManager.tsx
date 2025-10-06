'use client'

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { 
  getSavedDashboards, 
  saveDashboard, 
  loadDashboard, 
  deleteDashboard,
  exportDashboard,
  importDashboard,
  createFromTemplate,
  DASHBOARD_TEMPLATES,
  type SavedDashboard 
} from '@/utils/dashboardStorage'
import type { GridCell, GridConfig } from '@/types/dashboard'

interface DashboardManagerProps {
  isOpen: boolean
  onClose: () => void
  currentWidgets: GridCell[]
  currentGridConfig: GridConfig
  onLoad: (widgets: GridCell[], gridConfig: GridConfig) => void
}

export function DashboardManager({
  isOpen,
  onClose,
  currentWidgets,
  currentGridConfig,
  onLoad
}: DashboardManagerProps) {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<'save' | 'load' | 'templates'>('save')
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboard[]>(getSavedDashboards())
  const [saveName, setSaveName] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null)

  if (!isOpen) return null

  const refreshDashboards = () => {
    setSavedDashboards(getSavedDashboards())
  }

  const handleSave = () => {
    if (!saveName.trim()) {
      alert('Por favor ingresa un nombre para el dashboard')
      return
    }

    try {
      saveDashboard(saveName, currentWidgets, currentGridConfig, saveDescription)
      setSaveName('')
      setSaveDescription('')
      refreshDashboards()
      alert('Dashboard guardado exitosamente')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  const handleLoad = (dashboard: SavedDashboard) => {
    onLoad(dashboard.widgets, dashboard.gridConfig)
    onClose()
  }

  const handleDelete = (id: string) => {
    if (deleteDashboard(id)) {
      refreshDashboards()
      setShowConfirmDelete(null)
    } else {
      alert('Error al eliminar el dashboard')
    }
  }

  const handleExport = (dashboard: SavedDashboard) => {
    const dataStr = exportDashboard(dashboard)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${dashboard.name}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string
        importDashboard(jsonString)
        refreshDashboards()
        alert('Dashboard importado exitosamente')
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error al importar')
      }
    }
    reader.readAsText(file)
  }

  const handleCreateFromTemplate = (templateIndex: number) => {
    try {
      const dashboard = createFromTemplate(templateIndex)
      refreshDashboards()
      handleLoad(dashboard)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al crear desde template')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Administrador de Dashboards</CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Tabs */}
          <div className="border-b flex">
            {[
              { key: 'save', label: '💾 Guardar', icon: '💾' },
              { key: 'load', label: '📂 Cargar', icon: '📂' },
              { key: 'templates', label: '📋 Templates', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.key}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent hover:text-blue-500'
                }`}
                onClick={() => setActiveTab(tab.key as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 max-h-96 overflow-y-auto">
            {/* Tab: Guardar */}
            {activeTab === 'save' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombre del Dashboard *
                  </label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Mi Dashboard Personalizado"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder="Describe tu dashboard..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <Text className="text-sm text-gray-600 mb-2">
                    Resumen: {currentWidgets.length} widgets configurados
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Grid: {currentGridConfig.columns}×{currentGridConfig.rows} celdas
                  </Text>
                </div>

                <Button onClick={handleSave} className="w-full">
                  💾 Guardar Dashboard
                </Button>
              </div>
            )}

            {/* Tab: Cargar */}
            {activeTab === 'load' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Dashboards Guardados ({savedDashboards.length})</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={refreshDashboards}>
                      🔄 Actualizar
                    </Button>
                    <label className="cursor-pointer">
                      <div className="inline-block">
                        <Button variant="outline" size="sm">
                          📥 Importar
                        </Button>
                      </div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {savedDashboards.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📊</div>
                    <Text className="text-gray-500">
                      No tienes dashboards guardados
                    </Text>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {savedDashboards.map(dashboard => (
                      <div
                        key={dashboard.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{dashboard.name}</h4>
                            {dashboard.description && (
                              <Text className="text-sm text-gray-600 mt-1">
                                {dashboard.description}
                              </Text>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoad(dashboard)}
                            >
                              📂 Cargar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExport(dashboard)}
                            >
                              📤
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowConfirmDelete(dashboard.id)}
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{dashboard.widgets.length} widgets</span>
                          <span>
                            Actualizado: {new Date(dashboard.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Templates */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <h3 className="font-medium">Dashboards Predefinidos</h3>
                
                <div className="grid gap-4">
                  {DASHBOARD_TEMPLATES.map((template, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <Text className="text-sm text-gray-600 mt-1">
                            {template.description}
                          </Text>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleCreateFromTemplate(index)}
                        >
                          🎨 Usar Template
                        </Button>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {template.widgets.length} widgets configurados
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmación para eliminar */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirmar Eliminación</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="mb-4">
                ¿Estás seguro de que deseas eliminar este dashboard? Esta acción no se puede deshacer.
              </Text>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDelete(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(showConfirmDelete)}
                >
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}