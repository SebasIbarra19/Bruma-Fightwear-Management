'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { WidgetSidebar } from './WidgetSidebar'
import { WIDGET_COMPONENTS, type WidgetType } from './WidgetComponents'
import { getWidgetDefinition } from './WidgetDefinitions'
import { ResizableWidget } from './ResizableWidget'
import { DashboardManager } from './DashboardManager'
import type { GridCell, GridConfig, EditMode, DashboardLayout, WidgetDefinition } from '@/types/dashboard'

interface CustomDashboardProps {
  className?: string
}

export default function CustomDashboard({ className = '' }: CustomDashboardProps) {
  const { theme } = useTheme()
  const [editMode, setEditMode] = useState<EditMode>('view')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    columns: 12,
    rows: 8,
    cellSize: 80,
    gap: 8
  })
  const [widgets, setWidgets] = useState<GridCell[]>([])
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [draggedWidget, setDraggedWidget] = useState<WidgetDefinition | null>(null)
  const [showDashboardManager, setShowDashboardManager] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // Manejar teclas de acceso rápido
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editMode !== 'edit' || !selectedWidget) return

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          handleWidgetDelete(selectedWidget)
          break
        case 'Escape':
          setSelectedWidget(null)
          break
        case 'ArrowUp':
          e.preventDefault()
          const currentWidgetUp = widgets.find(w => w.id === selectedWidget)
          if (currentWidgetUp) {
            handleWidgetMove(selectedWidget, { 
              x: currentWidgetUp.x,
              y: Math.max(0, currentWidgetUp.y - 1)
            })
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          const currentWidgetDown = widgets.find(w => w.id === selectedWidget)
          if (currentWidgetDown) {
            handleWidgetMove(selectedWidget, { 
              x: currentWidgetDown.x,
              y: Math.min(gridConfig.rows - currentWidgetDown.height, currentWidgetDown.y + 1)
            })
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          const currentWidgetLeft = widgets.find(w => w.id === selectedWidget)
          if (currentWidgetLeft) {
            handleWidgetMove(selectedWidget, { 
              x: Math.max(0, currentWidgetLeft.x - 1),
              y: currentWidgetLeft.y
            })
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          const currentWidgetRight = widgets.find(w => w.id === selectedWidget)
          if (currentWidgetRight) {
            handleWidgetMove(selectedWidget, { 
              x: Math.min(gridConfig.columns - currentWidgetRight.width, currentWidgetRight.x + 1),
              y: currentWidgetRight.y
            })
          }
          break
      }
    }

    if (editMode === 'edit') {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editMode, selectedWidget, widgets, gridConfig])

  // Calcular dimensiones del grid
  const gridWidth = gridConfig.columns * gridConfig.cellSize + (gridConfig.columns - 1) * gridConfig.gap
  const gridHeight = gridConfig.rows * gridConfig.cellSize + (gridConfig.rows - 1) * gridConfig.gap

  // Generar celdas del grid para visualización
  const generateGridCells = () => {
    const cells = []
    for (let row = 0; row < gridConfig.rows; row++) {
      for (let col = 0; col < gridConfig.columns; col++) {
        cells.push({
          x: col,
          y: row,
          id: `${col}-${row}`
        })
      }
    }
    return cells
  }

  // Convertir coordenadas de píxeles a grid
  const pixelsToGrid = useCallback((x: number, y: number) => {
    const cellWithGap = gridConfig.cellSize + gridConfig.gap
    return {
      x: Math.floor(x / cellWithGap),
      y: Math.floor(y / cellWithGap)
    }
  }, [gridConfig])

  // Convertir coordenadas de grid a píxeles
  const gridToPixels = useCallback((x: number, y: number) => {
    return {
      x: x * (gridConfig.cellSize + gridConfig.gap),
      y: y * (gridConfig.cellSize + gridConfig.gap)
    }
  }, [gridConfig])

  // Verificar si una posición está ocupada
  const isPositionOccupied = useCallback((x: number, y: number, width: number, height: number, excludeId?: string) => {
    return widgets.some(widget => {
      if (excludeId && widget.id === excludeId) return false
      
      return !(
        x >= widget.x + widget.width ||
        x + width <= widget.x ||
        y >= widget.y + widget.height ||
        y + height <= widget.y
      )
    })
  }, [widgets])

  // Encontrar posición libre para un widget
  const findFreePosition = useCallback((width: number, height: number) => {
    for (let y = 0; y <= gridConfig.rows - height; y++) {
      for (let x = 0; x <= gridConfig.columns - width; x++) {
        if (!isPositionOccupied(x, y, width, height)) {
          return { x, y }
        }
      }
    }
    return null
  }, [gridConfig, isPositionOccupied])

  // Manejar drop en el grid
  const handleGridDrop = (event: React.DragEvent) => {
    event.preventDefault()
    
    if (editMode !== 'edit') return

    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json'))
      
      if (data.type === 'widget' && data.widgetDefinition) {
        const rect = gridRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        const gridPos = pixelsToGrid(x, y)

        // Crear nuevo widget
        const newWidget: GridCell = {
          id: `${data.widgetDefinition.id}-${Date.now()}`,
          x: Math.max(0, Math.min(gridPos.x, gridConfig.columns - data.widgetDefinition.minWidth)),
          y: Math.max(0, Math.min(gridPos.y, gridConfig.rows - data.widgetDefinition.minHeight)),
          width: data.widgetDefinition.minWidth,
          height: data.widgetDefinition.minHeight,
          widgetType: data.widgetDefinition.id,
          widgetProps: data.widgetDefinition.defaultProps || {}
        }

        // Verificar si la posición está libre
        if (!isPositionOccupied(newWidget.x, newWidget.y, newWidget.width, newWidget.height)) {
          setWidgets(prev => [...prev, newWidget])
        } else {
          // Buscar posición libre cercana
          const freePos = findFreePosition(newWidget.width, newWidget.height)
          if (freePos) {
            newWidget.x = freePos.x
            newWidget.y = freePos.y
            setWidgets(prev => [...prev, newWidget])
          } else {
            alert('No hay espacio disponible en el grid')
          }
        }
      }
    } catch (error) {
      console.error('Error al procesar drop:', error)
    }
    
    setDraggedWidget(null)
  }

  const handleGridDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  // Manejar redimensionamiento del grid
  const handleGridResize = (dimension: 'columns' | 'rows', value: number) => {
    setGridConfig(prev => ({
      ...prev,
      [dimension]: Math.max(4, Math.min(20, value))
    }))
  }

  // Agregar nuevo widget
  const handleWidgetAdd = (widget: GridCell) => {
    const freePos = findFreePosition(widget.width, widget.height)
    if (freePos) {
      widget.x = freePos.x
      widget.y = freePos.y
      setWidgets(prev => [...prev, widget])
    } else {
      alert('No hay espacio disponible en el grid')
    }
  }

  // Manejar inicio de drag de widget
  const handleWidgetDragStart = (widgetDef: WidgetDefinition) => {
    setDraggedWidget(widgetDef)
  }

  // Manejar redimensionamiento de widget
  const handleWidgetResize = useCallback((widgetId: string, newSize: { width: number; height: number }) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, ...newSize }
        : widget
    ))
  }, [])

  // Manejar movimiento de widget
  const handleWidgetMove = useCallback((widgetId: string, newPosition: { x: number; y: number }) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, ...newPosition }
        : widget
    ))
  }, [])

  // Manejar eliminación de widget
  const handleWidgetDelete = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId))
    setSelectedWidget(null)
  }, [])

  // Manejar carga de dashboard
  const handleDashboardLoad = useCallback((newWidgets: GridCell[], newGridConfig: GridConfig) => {
    setWidgets(newWidgets)
    setGridConfig(newGridConfig)
    setSelectedWidget(null)
  }, [])

  // Renderizar widget
  const renderWidget = (widget: GridCell) => {
    // Obtener el componente del widget
    const widgetDef = getWidgetDefinition(widget.widgetType || '')
    const WidgetComponent = widgetDef?.component || WIDGET_COMPONENTS.kpi

    return (
      <ResizableWidget
        key={widget.id}
        widget={widget}
        gridConfig={gridConfig}
        isSelected={selectedWidget === widget.id}
        editMode={editMode === 'edit'}
        onResize={handleWidgetResize}
        onMove={handleWidgetMove}
        onSelect={setSelectedWidget}
        onDelete={handleWidgetDelete}
        isPositionOccupied={isPositionOccupied}
      >
        <WidgetComponent 
          width={widget.width} 
          height={widget.height}
          {...widget.widgetProps}
        />
      </ResizableWidget>
    )
  }

  // Renderizar celdas del grid de fondo
  const renderGridCells = () => {
    if (editMode !== 'edit') return null

    return generateGridCells().map(cell => {
      const position = gridToPixels(cell.x, cell.y)
      return (
        <div
          key={cell.id}
          className="absolute border border-dashed opacity-30 hover:opacity-60 transition-opacity"
          style={{
            left: position.x,
            top: position.y,
            width: gridConfig.cellSize,
            height: gridConfig.cellSize,
            borderColor: theme.colors.border
          }}
        />
      )
    })
  }

  return (
    <div className={`min-h-screen ${className}`} style={{ backgroundColor: theme.colors.background }}>
      {/* Header con controles */}
      <div className="sticky top-0 z-50 border-b" style={{ 
        backgroundColor: theme.colors.surface, 
        borderColor: theme.colors.border 
      }}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
              🎛️ Dashboard Personalizado
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant={editMode === 'view' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode('view')}
                style={{
                  backgroundColor: editMode === 'view' ? theme.colors.primary : 'transparent',
                  borderColor: theme.colors.border
                }}
              >
                👁️ Vista
              </Button>
              <Button
                variant={editMode === 'edit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode('edit')}
                style={{
                  backgroundColor: editMode === 'edit' ? theme.colors.primary : 'transparent',
                  borderColor: theme.colors.border
                }}
              >
                ✏️ Editar
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Controles de grid */}
            {editMode === 'edit' && (
              <div className="flex items-center gap-2 text-sm">
                <Text style={{ color: theme.colors.textSecondary }}>Grid:</Text>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleGridResize('columns', gridConfig.columns - 1)}
                  >
                    −
                  </Button>
                  <span className="w-8 text-center" style={{ color: theme.colors.textPrimary }}>
                    {gridConfig.columns}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleGridResize('columns', gridConfig.columns + 1)}
                  >
                    +
                  </Button>
                </div>
                <Text style={{ color: theme.colors.textSecondary }}>×</Text>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleGridResize('rows', gridConfig.rows - 1)}
                  >
                    −
                  </Button>
                  <span className="w-8 text-center" style={{ color: theme.colors.textPrimary }}>
                    {gridConfig.rows}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleGridResize('rows', gridConfig.rows + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            )}

            {/* Botón del sidebar */}
            <Button
              variant="outline"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              disabled={editMode !== 'edit'}
              style={{ borderColor: theme.colors.border }}
            >
              📊 Widgets {isSidebarOpen ? '←' : '→'}
            </Button>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDashboardManager(true)}
              >
                � Administrar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex">
        {/* Grid Area */}
        <div className="flex-1 p-6">
          <div 
            className="relative mx-auto"
            style={{ 
              width: gridWidth, 
              height: gridHeight,
              minHeight: '600px'
            }}
          >
            {/* Grid de fondo */}
            <div
              ref={gridRef}
              className="absolute inset-0 border-2 border-dashed rounded-lg"
              style={{ borderColor: editMode === 'edit' ? theme.colors.border : 'transparent' }}
              onDrop={handleGridDrop}
              onDragOver={handleGridDragOver}
            >
              {renderGridCells()}
            </div>

            {/* Widgets */}
            {widgets.map(renderWidget)}

            {/* Mensaje cuando no hay widgets */}
            {widgets.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                    Tu dashboard está vacío
                  </h3>
                  <Text style={{ color: theme.colors.textSecondary }}>
                    {editMode === 'edit' 
                      ? 'Arrastra widgets desde el panel lateral para comenzar'
                      : 'Activa el modo edición para agregar widgets'
                    }
                  </Text>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar con widgets */}
        <WidgetSidebar
          isOpen={isSidebarOpen && editMode === 'edit'}
          onClose={() => setIsSidebarOpen(false)}
          onWidgetAdd={handleWidgetAdd}
          onWidgetDragStart={handleWidgetDragStart}
        />
      </div>

      {/* Dashboard Manager */}
      <DashboardManager
        isOpen={showDashboardManager}
        onClose={() => setShowDashboardManager(false)}
        currentWidgets={widgets}
        currentGridConfig={gridConfig}
        onLoad={handleDashboardLoad}
      />
    </div>
  )
}