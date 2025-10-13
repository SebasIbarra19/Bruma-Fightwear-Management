'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  content?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  className?: string
  onTabChange?: (tabId: string) => void
}

export function Tabs({ tabs, defaultTab, className = '', onTabChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')
  const { theme } = useTheme()
  
  const activeTabData = tabs.find(tab => tab.id === activeTab)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div 
        className="flex border-b overflow-x-auto scrollbar-hide"
        style={{ borderColor: theme.colors.border }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
              activeTab === tab.id 
                ? 'border-current' 
                : 'border-transparent hover:opacity-70'
            }`}
            style={{ 
              color: activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary,
              borderBottomColor: activeTab === tab.id ? theme.colors.primary : 'transparent'
            }}
          >
            {tab.icon && (
              <span className="w-4 h-4">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTabData?.content || (
          <div className="text-center py-12" style={{ color: theme.colors.textSecondary }}>
            <p>Contenido de &quot;{activeTabData?.label}&quot; próximamente...</p>
          </div>
        )}
      </div>
    </div>
  )
}