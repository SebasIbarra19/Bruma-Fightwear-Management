import React from 'react'
import { cn } from '@/lib/utils'

// Tipos para el sidebar
interface SidebarItem {
  id: string
  label: string
  icon?: string
  href?: string
  active?: boolean
  children?: SidebarItem[]
  badge?: {
    text: string
    variant: 'default' | 'success' | 'warning' | 'error'
  }
}

interface SidebarProps {
  items: SidebarItem[]
  className?: string
  collapsed?: boolean
  onToggle?: () => void
  onItemClick?: (item: SidebarItem) => void
  logo?: React.ReactNode
  footer?: React.ReactNode
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  className,
  collapsed = false,
  onToggle,
  onItemClick,
  logo,
  footer
}) => {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const badgeVariants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  }

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)

    return (
      <div key={item.id}>
        <div
          className={cn(
            "flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors",
            item.active ? 
              "bg-blue-600 text-white" : 
              "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
            level > 0 && "ml-4 border-l border-gray-200 pl-4"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            } else {
              onItemClick?.(item)
            }
          }}
          style={{ paddingLeft: `${12 + (level * 16)}px` }}
        >
          {item.icon && (
            <span className="mr-3 text-lg">
              {item.icon}
            </span>
          )}
          
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              
              {item.badge && (
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2",
                  badgeVariants[item.badge.variant]
                )}>
                  {item.badge.text}
                </span>
              )}
              
              {hasChildren && (
                <span className="ml-2 text-gray-400">
                  {isExpanded ? '⌄' : '›'}
                </span>
              )}
            </>
          )}
        </div>
        
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1">
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header con logo y toggle */}
      {(logo || onToggle) && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {logo && (
            <div className={cn("transition-opacity", collapsed && "opacity-0")}>
              {logo}
            </div>
          )}
          
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-500">
                {collapsed ? '→' : '←'}
              </span>
            </button>
          )}
        </div>
      )}
      
      {/* Navigation items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map(item => renderSidebarItem(item))}
      </nav>
      
      {/* Footer */}
      {footer && (
        <div className={cn(
          "p-4 border-t border-gray-200 transition-opacity",
          collapsed && "opacity-0"
        )}>
          {footer}
        </div>
      )}
    </div>
  )
}

// Layout con sidebar
interface SidebarLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
  className?: string
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  sidebar,
  children,
  className
}) => {
  return (
    <div className={cn("min-h-screen flex", className)}>
      {sidebar}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}