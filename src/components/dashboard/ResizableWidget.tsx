'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import type { GridCell, GridConfig } from '@/types/dashboard'

interface ResizableWidgetProps {
  widget: GridCell
  gridConfig: GridConfig
  isSelected: boolean
  editMode: boolean
  children: React.ReactNode
  onResize: (widgetId: string, newSize: { width: number; height: number }) => void
  onMove: (widgetId: string, newPosition: { x: number; y: number }) => void
  onSelect: (widgetId: string) => void
  onDelete: (widgetId: string) => void
  isPositionOccupied: (x: number, y: number, width: number, height: number, excludeId?: string) => boolean
}

export function ResizableWidget({
  widget,
  gridConfig,
  isSelected,
  editMode,
  children,
  onResize,
  onMove,
  onSelect,
  onDelete,
  isPositionOccupied
}: ResizableWidgetProps) {
  const { theme } = useTheme()
  const [isResizing, setIsResizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, widgetX: 0, widgetY: 0 })
  const widgetRef = useRef<HTMLDivElement>(null)

  // Convertir coordenadas de grid a píxeles
  const gridToPixels = useCallback((x: number, y: number) => {
    return {
      x: x * (gridConfig.cellSize + gridConfig.gap),
      y: y * (gridConfig.cellSize + gridConfig.gap)
    }
  }, [gridConfig])

  // Convertir píxeles a coordenadas de grid
  const pixelsToGrid = useCallback((x: number, y: number) => {
    const cellWithGap = gridConfig.cellSize + gridConfig.gap
    return {
      x: Math.floor(x / cellWithGap),
      y: Math.floor(y / cellWithGap)
    }
  }, [gridConfig])

  const position = gridToPixels(widget.x, widget.y)
  const size = {
    width: widget.width * gridConfig.cellSize + (widget.width - 1) * gridConfig.gap,
    height: widget.height * gridConfig.cellSize + (widget.height - 1) * gridConfig.gap
  }

  // Manejar inicio de redimensionamiento
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!editMode) return

    setIsResizing(true)
    setResizeHandle(handle)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      widgetX: widget.x,
      widgetY: widget.y
    })

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      const cellWithGap = gridConfig.cellSize + gridConfig.gap

      let newWidth = widget.width
      let newHeight = widget.height
      let newX = widget.x
      let newY = widget.y

      switch (handle) {
        case 'se': // Bottom-right
          newWidth = Math.max(1, widget.width + Math.round(deltaX / cellWithGap))
          newHeight = Math.max(1, widget.height + Math.round(deltaY / cellWithGap))
          break
        case 'sw': // Bottom-left
          newWidth = Math.max(1, widget.width - Math.round(deltaX / cellWithGap))
          newHeight = Math.max(1, widget.height + Math.round(deltaY / cellWithGap))
          newX = Math.max(0, widget.x + Math.round(deltaX / cellWithGap))
          break
        case 'ne': // Top-right
          newWidth = Math.max(1, widget.width + Math.round(deltaX / cellWithGap))
          newHeight = Math.max(1, widget.height - Math.round(deltaY / cellWithGap))
          newY = Math.max(0, widget.y + Math.round(deltaY / cellWithGap))
          break
        case 'nw': // Top-left
          newWidth = Math.max(1, widget.width - Math.round(deltaX / cellWithGap))
          newHeight = Math.max(1, widget.height - Math.round(deltaY / cellWithGap))
          newX = Math.max(0, widget.x + Math.round(deltaX / cellWithGap))
          newY = Math.max(0, widget.y + Math.round(deltaY / cellWithGap))
          break
      }

      // Verificar límites del grid
      newWidth = Math.min(newWidth, gridConfig.columns - newX)
      newHeight = Math.min(newHeight, gridConfig.rows - newY)

      // Verificar que no hay colisiones
      if (!isPositionOccupied(newX, newY, newWidth, newHeight, widget.id)) {
        onResize(widget.id, { width: newWidth, height: newHeight })
        if (newX !== widget.x || newY !== widget.y) {
          onMove(widget.id, { x: newX, y: newY })
        }
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeHandle(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Manejar inicio de arrastre
  const handleDragStart = (e: React.MouseEvent) => {
    if (!editMode || isResizing) return

    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      widgetX: widget.x,
      widgetY: widget.y
    })

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      const cellWithGap = gridConfig.cellSize + gridConfig.gap

      const newX = Math.max(0, Math.min(
        gridConfig.columns - widget.width,
        dragStart.widgetX + Math.round(deltaX / cellWithGap)
      ))
      const newY = Math.max(0, Math.min(
        gridConfig.rows - widget.height,
        dragStart.widgetY + Math.round(deltaY / cellWithGap)
      ))

      if (!isPositionOccupied(newX, newY, widget.width, widget.height, widget.id)) {
        onMove(widget.id, { x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Handles de redimensionamiento
  const resizeHandles = editMode && isSelected ? [
    { key: 'nw', style: { top: -4, left: -4, cursor: 'nw-resize' } },
    { key: 'ne', style: { top: -4, right: -4, cursor: 'ne-resize' } },
    { key: 'sw', style: { bottom: -4, left: -4, cursor: 'sw-resize' } },
    { key: 'se', style: { bottom: -4, right: -4, cursor: 'se-resize' } }
  ] : []

  return (
    <div
      ref={widgetRef}
      className={`absolute border-2 rounded-lg transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 shadow-lg'
          : 'border-gray-300'
      } ${editMode ? 'cursor-move hover:shadow-md' : 'cursor-default'}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        backgroundColor: theme.colors.surface,
        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
        zIndex: isSelected ? 10 : 1
      }}
      onMouseDown={handleDragStart}
      onClick={() => editMode && onSelect(widget.id)}
    >
      {/* Botones de control */}
      {editMode && isSelected && (
        <div className="absolute top-1 right-1 flex gap-1 z-20">
          <button
            className="w-6 h-6 bg-white border rounded text-xs hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(widget.id)
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Contenido del widget */}
      <div className="w-full h-full overflow-hidden">
        {children}
      </div>

      {/* Handles de redimensionamiento */}
      {resizeHandles.map(handle => (
        <div
          key={handle.key}
          className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm hover:bg-blue-600"
          style={{
            ...handle.style,
            cursor: handle.style.cursor
          }}
          onMouseDown={(e) => handleResizeStart(e, handle.key)}
        />
      ))}

      {/* Indicador de información del widget */}
      {editMode && isSelected && (
        <div 
          className="absolute bottom-1 left-1 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded"
          style={{ fontSize: '10px' }}
        >
          {widget.width}×{widget.height} @ ({widget.x},{widget.y})
        </div>
      )}
    </div>
  )
}