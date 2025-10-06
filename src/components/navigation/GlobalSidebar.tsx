'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { SmartLogo } from '@/components/common/SmartLogo'
import { ThemeSelector } from '@/components/ui/theme-selector'
import type { NavigationItem, NavigationSection, SidebarMode } from '@/types/navigation'

interface GlobalSidebarProps {
  className?: string
}

export function GlobalSidebar({ className = '' }: GlobalSidebarProps) {
  const { theme } = useTheme()
  const { state, config, toggleSection, setSidebarMode } = useNavigation()
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [showCustomization, setShowCustomization] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  // Helper para determinar si el sidebar está colapsado
  const isHoverMode = state.sidebarMode === 'hover'
  const isCollapsed = state.sidebarMode === 'collapsed' || (isHoverMode && !isHovered)
  const shouldExpand = state.sidebarMode === 'expanded' || (isHoverMode && isHovered)

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.href === pathname) return true
    if (item.children) {
      return item.children.some(child => child.href === pathname)
    }
    return false
  }

  const isItemInActivePath = (item: NavigationItem): boolean => {
    if (item.href && pathname.startsWith(item.href)) return true
    if (item.children) {
      return item.children.some(child => child.href && pathname.startsWith(child.href))
    }
    return false
  }

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const IconComponent = item.icon
    const isActive = isItemActive(item)
    const isInPath = isItemInActivePath(item)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = state.expandedSections.has(item.id)

    return (
      <div key={item.id}>
        {item.href ? (
          <Link
            href={item.href}
            className={`
              flex items-center rounded-lg transition-all duration-200 group relative
              ${isActive 
                ? 'text-white' 
                : isInPath 
                  ? 'text-white bg-opacity-20'
                  : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
              }
              px-3 py-3 ${isCollapsed ? 'justify-center' : ''}
            `}
            style={{
              backgroundColor: isActive 
                ? theme.colors.primary
                : isInPath 
                  ? theme.colors.primary + '15'
                  : 'transparent',
              color: isActive 
                ? theme.colors.surface
                : isInPath 
                  ? theme.colors.primary
                  : theme.colors.textSecondary,
              borderRadius: '8px'
            }}
            onMouseEnter={(e) => {
              setHoveredItem(item.id)
              if (!isActive && !isInPath) {
                e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
                e.currentTarget.style.color = theme.colors.textPrimary
              }
            }}
            onMouseLeave={(e) => {
              setHoveredItem(null)
              if (!isActive && !isInPath) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = theme.colors.textSecondary
              }
            }}
          >
            {IconComponent && (
              <IconComponent 
                className="w-6 h-6"
              />
            )}
            
            <span 
              className={`font-medium text-xs whitespace-nowrap transition-all duration-300 overflow-hidden ${
                shouldExpand ? 'opacity-100 max-w-xs ml-3' : 'opacity-0 max-w-0 ml-0'
              }`}
            >
              {item.label}
            </span>

            {hasChildren && shouldExpand && (
              <svg
                className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
            
            {/* Tooltip cuando está colapsado */}
            {!shouldExpand && hoveredItem === item.id && (
              <div 
                className="absolute left-full ml-2 px-2 py-1 text-sm rounded shadow-lg z-50 whitespace-nowrap"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                {item.label}
              </div>
            )}
          </Link>
        ) : (
          <div
            className={`
              flex items-center cursor-pointer transition-all duration-200 group relative
              px-3 py-3 ${!shouldExpand ? 'justify-center' : ''}
            `}
            style={{
              backgroundColor: isActive 
                ? theme.colors.primary
                : isInPath 
                  ? theme.colors.primary + '15'
                  : 'transparent',
              color: isActive 
                ? theme.colors.surface
                : isInPath 
                  ? theme.colors.primary
                  : theme.colors.textSecondary,
              borderRadius: '8px'
            }}
            onClick={() => hasChildren && toggleSection(item.id)}
            onMouseEnter={(e) => {
              setHoveredItem(item.id)
              if (!isActive && !isInPath) {
                e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
                e.currentTarget.style.color = theme.colors.textPrimary
              }
            }}
            onMouseLeave={(e) => {
              setHoveredItem(null)
              if (!isActive && !isInPath) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = theme.colors.textSecondary
              }
            }}
          >
            <IconComponent className="w-6 h-6" />
            
            {shouldExpand && (
              <>
                <span 
                  className={`font-medium text-xs whitespace-nowrap transition-all duration-300 overflow-hidden ${
                    shouldExpand ? 'opacity-100 max-w-xs ml-3' : 'opacity-0 max-w-0 ml-0'
                  }`}
                >
                  {item.label}
                </span>
                
                {hasChildren && (
                  <svg
                    className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </>
            )}
          </div>
        )}
        
        {hasChildren && isExpanded && shouldExpand && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children?.map((child) => renderNavigationItem(child, level + 1))}
          </div>
        )}

        {/* Líneas divisorias sutiles en puntos específicos */}
        {shouldExpand && (
          <>
            {/* Línea después de Dashboard Personal */}
            {item.id === 'personal-dashboard' && (
              <div className="mx-3 my-4 h-px opacity-70" style={{ backgroundColor: theme.colors.border }} />
            )}
            {/* Línea después de Dashboard del Proyecto */}
            {item.id === 'project-dashboard' && (
              <div className="mx-3 my-4 h-px opacity-70" style={{ backgroundColor: theme.colors.border }} />
            )}
          </>
        )}

      </div>
    )
  }

  const renderSidebarContent = () => {
    const sections = config.sections
    
    return (
      <div className="space-y-1">
        {sections.map((section: NavigationSection) => (
          <div key={section.id}>
            {section.items.map((item: NavigationItem) => renderNavigationItem(item))}
          </div>
        ))}
      </div>
    )
  }

  // Popup de customización
  const renderCustomizationPopup = () => {
    if (!showCustomization) return null

    const modes: { mode: SidebarMode; label: string; description: string }[] = [
      { mode: 'expanded', label: 'Expandido', description: 'Sidebar siempre expandido con texto' },
      { mode: 'hover', label: 'Expandir al pasar', description: 'Se expande al pasar el mouse' }
    ]

    return (
      <div 
        className="absolute bottom-12 right-0 rounded-lg shadow-xl z-50 p-3 min-w-[200px]"
        style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`
        }}
      >
        <h3 className="text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
          Modo del Sidebar
        </h3>
        <div className="space-y-2">
          {modes.map(({ mode, label, description }) => (
            <button
              key={mode}
              onClick={() => {
                setSidebarMode(mode)
                setShowCustomization(false)
              }}
              className="w-full text-left p-2 rounded text-sm transition-colors"
              style={{
                backgroundColor: state.sidebarMode === mode
                  ? theme.colors.primary + '20'
                  : 'transparent',
                color: theme.colors.textPrimary
              }}
              onMouseEnter={(e) => {
                if (state.sidebarMode !== mode) {
                  e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
                }
              }}
              onMouseLeave={(e) => {
                if (state.sidebarMode !== mode) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <div className="font-medium">{label}</div>
              <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                {description}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`
      relative
      ${className}
    `}>
      <div
        className={`
          fixed left-0 top-0 h-full shadow-xl z-40 flex flex-col transition-all duration-500 overflow-hidden
          ${shouldExpand ? 'w-64' : 'w-20'} 
        `}
        style={{
          backgroundColor: theme.colors.surface,
          borderRight: `1px solid ${theme.colors.border}`
        }}
        onMouseEnter={() => {
          if (isHoverMode) {
            setIsHovered(true)
          }
        }}
        onMouseLeave={() => {
          if (isHoverMode) {
            setIsHovered(false)
          }
        }}
      >


        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderSidebarContent()}
        </div>

        {/* Footer con controles */}
        <div className="p-4 border-t" style={{ borderColor: theme.colors.border }}>
          <div className="relative">
            {/* Botón de configuración con estilo consistente */}
            <button
              onClick={() => setShowCustomization(!showCustomization)}
              className="w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group relative"
              style={{
                backgroundColor: showCustomization 
                  ? theme.colors.primary + '15'
                  : 'transparent',
                color: showCustomization 
                  ? theme.colors.primary
                  : theme.colors.textSecondary,
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => {
                if (!showCustomization) {
                  e.currentTarget.style.backgroundColor = theme.colors.surfaceHover + '20'
                  e.currentTarget.style.color = theme.colors.textPrimary
                }
              }}
              onMouseLeave={(e) => {
                if (!showCustomization) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = theme.colors.textSecondary
                }
              }}
              title="Personalizar sidebar"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              
              <span 
                className={`font-medium text-xs whitespace-nowrap transition-all duration-300 overflow-hidden ${
                  shouldExpand ? 'opacity-100 max-w-xs ml-3' : 'opacity-0 max-w-0 ml-0'
                }`}
              >
                Configuración
              </span>
            </button>
            
            {renderCustomizationPopup()}
          </div>
        </div>
      </div>
    </div>
  )
}