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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg transition-all duration-200 hover:bg-opacity-10"
        style={{
          color: themes[currentTheme].colors.textSecondary,
          backgroundColor: isOpen ? themes[currentTheme].colors.surfaceHover + '20' : 'transparent'
        }}
        title="Cambiar tema"
      >
        {/* Icono de tema simple */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown simple */}
          <div
            className="absolute top-full right-0 mt-2 w-48 rounded-lg shadow-lg z-50 border p-2"
            style={{
              backgroundColor: themes[currentTheme].colors.surface,
              borderColor: themes[currentTheme].colors.border
            }}
          >
            <div className="space-y-1">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => handleThemeSelect(key as ThemeName)}
                  className="w-full flex items-center justify-between p-2 rounded text-sm transition-colors hover:bg-opacity-10"
                  style={{
                    backgroundColor: currentTheme === key 
                      ? themes[currentTheme].colors.primary + '20' 
                      : 'transparent',
                    color: themes[currentTheme].colors.textPrimary
                  }}
                >
                  <span>{theme.displayName}</span>
                  {currentTheme === key && (
                    <span style={{ color: themes[currentTheme].colors.primary }}>✓</span>
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