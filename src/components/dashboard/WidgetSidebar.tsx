'use client'

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { WIDGET_CATEGORIES, createDefaultWidget } from './WidgetDefinitions'
import type { WidgetDefinition } from '@/types/dashboard'

interface WidgetSidebarProps {
  isOpen: boolean
  onClose: () => void
  onWidgetAdd: (widget: any) => void
  onWidgetDragStart: (widget: WidgetDefinition) => void
}

export function WidgetSidebar({ 
  isOpen, 
  onClose, 
  onWidgetAdd, 
  onWidgetDragStart 
}: WidgetSidebarProps) {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<keyof typeof WIDGET_CATEGORIES>('kpis')
  const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({})

  const categories = Object.entries(WIDGET_CATEGORIES)
  const activeCategory = WIDGET_CATEGORIES[activeTab]

  // Manejar carrusel
  const handleCarouselNext = (categoryKey: string) => {
    const category = WIDGET_CATEGORIES[categoryKey as keyof typeof WIDGET_CATEGORIES]
    const currentIndex = carouselIndex[categoryKey] || 0
    const maxIndex = Math.ceil(category.widgets.length / 6) - 1
    
    setCarouselIndex(prev => ({
      ...prev,
      [categoryKey]: currentIndex >= maxIndex ? 0 : currentIndex + 1
    }))
  }

  const handleCarouselPrev = (categoryKey: string) => {
    const category = WIDGET_CATEGORIES[categoryKey as keyof typeof WIDGET_CATEGORIES]
    const currentIndex = carouselIndex[categoryKey] || 0
    const maxIndex = Math.ceil(category.widgets.length / 6) - 1
    
    setCarouselIndex(prev => ({
      ...prev,
      [categoryKey]: currentIndex <= 0 ? maxIndex : currentIndex - 1
    }))
  }

  // Obtener widgets para mostrar en el carrusel
  const getCarouselWidgets = (categoryKey: string) => {
    const category = WIDGET_CATEGORIES[categoryKey as keyof typeof WIDGET_CATEGORIES]
    const currentIndex = carouselIndex[categoryKey] || 0
    const startIndex = currentIndex * 6
    return category.widgets.slice(startIndex, startIndex + 6)
  }

  // Renderizar widget en el sidebar
  const renderWidgetItem = (widget: WidgetDefinition) => (
    <div
      key={widget.id}
      className="p-3 border rounded-lg cursor-move hover:shadow-md transition-all duration-200 hover:scale-105"
      style={{ 
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.border
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'widget',
          widgetDefinition: widget
        }))
        onWidgetDragStart(widget)
      }}
      onClick={() => {
        const newWidget = createDefaultWidget(widget.id)
        if (newWidget) {
          onWidgetAdd(newWidget)
        }
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{widget.icon}</span>
        <div className="flex-1 min-w-0">
          <Text className="font-medium text-sm truncate" style={{ color: theme.colors.textPrimary }}>
            {widget.name}
          </Text>
          <Text className="text-xs" style={{ color: theme.colors.textSecondary }}>
            {widget.minWidth}x{widget.minHeight} - {widget.maxWidth}x{widget.maxHeight}
          </Text>
        </div>
      </div>
      <Text className="text-xs leading-tight" style={{ color: theme.colors.textTertiary }}>
        {widget.description}
      </Text>
    </div>
  )

  if (!isOpen) return null

  return (
    <div 
      className="w-80 border-l min-h-screen flex flex-col"
      style={{ 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: theme.colors.border }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: theme.colors.textPrimary }}>
            📊 Widgets Disponibles
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            style={{ borderColor: theme.colors.border }}
          >
            ✕
          </Button>
        </div>

        {/* Tabs de categorías */}
        <div className="flex gap-1 border-b pb-2" style={{ borderColor: theme.colors.border }}>
          {categories.map(([key, category]) => (
            <Button
              key={key}
              variant={activeTab === key ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs py-1 px-2"
              onClick={() => setActiveTab(key as keyof typeof WIDGET_CATEGORIES)}
              style={{
                backgroundColor: activeTab === key ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.border,
                color: activeTab === key ? theme.colors.textInverse : theme.colors.textSecondary
              }}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Contenido de widgets */}
      <div className="flex-1 p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium" style={{ color: theme.colors.textPrimary }}>
              {activeCategory.icon} {activeCategory.name}
            </h4>
            
            {/* Controles de carrusel */}
            {activeCategory.widgets.length > 6 && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => handleCarouselPrev(activeTab)}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => handleCarouselNext(activeTab)}
                >
                  →
                </Button>
              </div>
            )}
          </div>

          {/* Grid de widgets */}
          <div className="grid grid-cols-1 gap-3">
            {getCarouselWidgets(activeTab).map(renderWidgetItem)}
          </div>

          {/* Indicadores de carrusel */}
          {activeCategory.widgets.length > 6 && (
            <div className="flex justify-center gap-1 mt-3">
              {Array.from({ length: Math.ceil(activeCategory.widgets.length / 6) }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === (carouselIndex[activeTab] || 0) ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Instrucciones */}
        <div className="mt-6 p-3 rounded-lg" style={{ backgroundColor: theme.colors.background }}>
          <Text className="text-xs font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
            💡 Instrucciones:
          </Text>
          <div className="space-y-1 text-xs" style={{ color: theme.colors.textSecondary }}>
            <div>• 🖱️ <strong>Clic:</strong> Agregar widget al grid</div>
            <div>• 🤏 <strong>Arrastrar:</strong> Mover a posición específica</div>
            <div>• ⌌ <strong>Esquinas:</strong> Redimensionar widget</div>
            <div>• ✕ <strong>Eliminar:</strong> Quitar del dashboard</div>
          </div>
        </div>

        {/* Configuración rápida */}
        <div className="mt-4 space-y-2">
          <Text className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
            🚀 Accesos Rápidos
          </Text>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              // Agregar dashboard completo básico
              const basicWidgets = [
                createDefaultWidget('kpi-revenue'),
                createDefaultWidget('kpi-customers'),
                createDefaultWidget('kpi-orders'),
                createDefaultWidget('chart-sales-trend')
              ].filter(Boolean)
              
              basicWidgets.forEach((widget, index) => {
                if (widget) {
                  widget.x = (index % 2) * 3
                  widget.y = Math.floor(index / 2) * 2
                  onWidgetAdd(widget)
                }
              })
            }}
          >
            ⚡ Dashboard Básico
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              // Agregar dashboard ejecutivo completo
              const execWidgets = [
                createDefaultWidget('dashboard-executive'),
                createDefaultWidget('chart-top-products'),
                createDefaultWidget('dashboard-predictive'),
                createDefaultWidget('text-notes')
              ].filter(Boolean)
              
              execWidgets.forEach((widget, index) => {
                if (widget) {
                  if (index === 0) { // Dashboard ejecutivo grande
                    widget.width = 6
                    widget.height = 4
                    widget.x = 0
                    widget.y = 0
                  } else {
                    widget.x = (index === 1) ? 6 : 0
                    widget.y = (index === 1) ? 0 : 4
                  }
                  onWidgetAdd(widget)
                }
              })
            }}
          >
            👔 Dashboard Ejecutivo
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              // Limpiar todos los widgets
              // Esta función debe ser pasada desde el componente padre
            }}
          >
            🗑️ Limpiar Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}