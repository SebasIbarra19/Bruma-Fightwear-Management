'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  subItems?: SidebarSubItem[]
}

interface SidebarSubItem {
  id: string
  label: string
  href: string
}

interface ModernSidebarProps {
  items: SidebarItem[]
  className?: string
  projectName?: string
  onCollapseChange?: (collapsed: boolean) => void
}

export function ModernSidebar({ items, className = '', projectName, onCollapseChange }: ModernSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { theme } = useTheme()
  const params = useParams()
  const pathname = usePathname()
  
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isActive = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div 
      className={`fixed left-0 top-0 h-full backdrop-blur-md border-r transition-all duration-300 z-40 ${
        collapsed ? 'w-16' : 'w-64'
      } ${className}`}
      style={{ 
        backgroundColor: theme.colors.surface + 'F0',
        borderColor: theme.colors.border
      }}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b" style={{ borderColor: theme.colors.border }}>
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex-1">
              <h2 className="font-bold text-lg truncate" style={{ color: theme.colors.textPrimary }}>
                {projectName || 'BRUMA Dashboard'}
              </h2>
              <p className="text-xs truncate" style={{ color: theme.colors.textSecondary }}>
                Panel de Control
              </p>
            </div>
          )}
          <button
            onClick={() => {
              const newCollapsed = !collapsed
              setCollapsed(newCollapsed)
              onCollapseChange?.(newCollapsed)
            }}
            className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
            style={{ 
              backgroundColor: theme.colors.surfaceHover + '50'
            }}
          >
            <svg 
              className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              style={{ color: theme.colors.textSecondary }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {items.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0
          const isExpanded = expandedItems.includes(item.id)
          const itemIsActive = isActive(item.href)

          return (
            <div key={item.id}>
              {/* Main Item */}
              {hasSubItems ? (
                // Si tiene subitems, es un botón que expande/contrae
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 group ${
                    itemIsActive ? 'shadow-lg' : 'hover:shadow-md'
                  }`}
                  style={{ 
                    backgroundColor: itemIsActive 
                      ? theme.colors.primary + '20' 
                      : 'transparent',
                    color: itemIsActive 
                      ? theme.colors.primary 
                      : theme.colors.textSecondary
                  }}
                >
                  <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="ml-3 font-medium">{item.label}</span>
                      <svg 
                        className={`ml-auto w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              ) : item.href ? (
                // Si no tiene subitems pero tiene href, es un link
                <Link href={item.href}>
                  <div
                    className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 group ${
                      itemIsActive ? 'shadow-lg' : 'hover:shadow-md'
                    }`}
                    style={{ 
                      backgroundColor: itemIsActive 
                        ? theme.colors.primary + '20' 
                        : 'transparent',
                      color: itemIsActive 
                        ? theme.colors.primary 
                        : theme.colors.textSecondary
                    }}
                  >
                    <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <span className="ml-3 font-medium">{item.label}</span>
                    )}
                  </div>
                </Link>
              ) : (
                // Si no tiene href ni subitems, es un botón con onClick
                <button
                  onClick={() => item.onClick?.()}
                  className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 group ${
                    itemIsActive ? 'shadow-lg' : 'hover:shadow-md'
                  }`}
                  style={{ 
                    backgroundColor: itemIsActive 
                      ? theme.colors.primary + '20' 
                      : 'transparent',
                    color: itemIsActive 
                      ? theme.colors.primary 
                      : theme.colors.textSecondary
                  }}
                >
                  <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                </button>
              )}

              {/* Sub Items */}
              {hasSubItems && isExpanded && !collapsed && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.subItems!.map((subItem) => (
                    <Link key={subItem.id} href={subItem.href}>
                      <div
                        className={`flex items-center p-2 rounded-lg transition-all duration-200 ${
                          isActive(subItem.href) ? 'shadow-md' : 'hover:shadow-sm'
                        }`}
                        style={{ 
                          backgroundColor: isActive(subItem.href)
                            ? theme.colors.secondary + '20' 
                            : 'transparent',
                          color: isActive(subItem.href)
                            ? theme.colors.secondary 
                            : theme.colors.textTertiary
                        }}
                      >
                        <span className="text-sm font-medium">{subItem.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}