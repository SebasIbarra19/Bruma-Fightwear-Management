'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTheme, type ThemeName } from '@/contexts/ThemeContext'

interface ThemeSelectorProps {
  className?: string
}

export function ThemeSelector({ className = '' }: ThemeSelectorProps) {
  const { currentTheme, setTheme, themes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const handleThemeSelect = (themeName: ThemeName) => {
    setTheme(themeName)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200"
        style={{
          color: themes[currentTheme].colors.textSecondary,
          backgroundColor: isOpen ? themes[currentTheme].colors.surfaceHover : 'transparent'
        }}
      >
        <span className="text-lg">🎨</span>
        <span className="hidden md:inline">Tema</span>
        <span className="text-xs opacity-60">
          {isOpen ? '▲' : '▼'}
        </span>
      </Button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            style={{ backgroundColor: themes[currentTheme].colors.overlay }}
          />
          
          {/* Dropdown */}
          <div
            className="absolute top-full right-0 mt-2 w-64 rounded-lg shadow-lg z-50 border"
            style={{
              backgroundColor: themes[currentTheme].colors.surface,
              borderColor: themes[currentTheme].colors.border,
              boxShadow: themes[currentTheme].colors.shadow
            }}
          >
            <div
              className="p-3 border-b"
              style={{ borderColor: themes[currentTheme].colors.border }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: themes[currentTheme].colors.textPrimary }}
              >
                Seleccionar Tema
              </h3>
              <p
                className="text-xs mt-1"
                style={{ color: themes[currentTheme].colors.textTertiary }}
              >
                Elige el tema que más te guste
              </p>
            </div>
            
            <div className="p-2 space-y-1">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => handleThemeSelect(key as ThemeName)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-md transition-all duration-200 text-left
                    ${currentTheme === key ? 'ring-2' : ''}
                  `}
                  style={{
                    backgroundColor: currentTheme === key 
                      ? theme.colors.primary + '20' 
                      : 'transparent',
                    outline: currentTheme === key ? `2px solid ${theme.colors.primary}` : 'none',
                    color: theme.colors.textPrimary
                  }}
                  onMouseEnter={(e) => {
                    if (currentTheme !== key) {
                      e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentTheme !== key) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {/* Preview de colores */}
                  <div className="flex gap-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: theme.colors.success }}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div
                      className="text-sm font-medium"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {theme.displayName}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: theme.colors.textTertiary }}
                    >
                      {key === 'light' && 'Perfecta para trabajar durante el día'}
                      {key === 'dark' && 'Ideal para sesiones nocturnas'}
                      {key === 'forest' && 'Relajante y natural'}
                      {key === 'ocean' && 'Calmante y profesional'}
                    </div>
                  </div>
                  
                  {currentTheme === key && (
                    <div
                      className="text-sm"
                      style={{ color: theme.colors.primary }}
                    >
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <div
              className="p-3 border-t"
              style={{ borderColor: themes[currentTheme].colors.border }}
            >
              <p
                className="text-xs text-center"
                style={{ color: themes[currentTheme].colors.textTertiary }}
              >
                El tema se guardará automáticamente
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}