export interface GridCell {
  id: string
  x: number
  y: number
  width: number
  height: number
  widgetType?: string
  widgetProps?: any
}

export interface GridConfig {
  columns: number
  rows: number
  cellSize: number
  gap: number
}

export interface WidgetDefinition {
  id: string
  name: string
  icon: string
  description: string
  category: string
  minWidth: number
  minHeight: number
  maxWidth?: number
  maxHeight?: number
  component: React.ComponentType<any>
  defaultProps?: any
}

export interface DashboardLayout {
  id: string
  name: string
  gridConfig: GridConfig
  widgets: GridCell[]
  createdAt: string
  updatedAt: string
}

export type EditMode = 'view' | 'edit' | 'resize'

export interface DragItem {
  type: 'widget' | 'existing-widget'
  widgetDefinition?: WidgetDefinition
  gridCell?: GridCell
}