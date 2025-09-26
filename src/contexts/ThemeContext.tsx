'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type ThemeName = 'light' | 'dark' | 'forest' | 'ocean'

export interface ThemePalette {
  name: string
  displayName: string
  colors: {
    // Fondos
    background: string
    surface: string
    surfaceHover: string
    surfaceActive: string
    
    // Textos
    textPrimary: string
    textSecondary: string
    textTertiary: string
    textInverse: string
    
    // Bordes
    border: string
    borderHover: string
    
    // Colores del sistema
    primary: string
    primaryHover: string
    secondary: string
    secondaryHover: string
    success: string
    successHover: string
    warning: string
    warningHover: string
    error: string
    errorHover: string
    info: string
    infoHover: string
    
    // UI adicionales
    shadow: string
    overlay: string
    
    // Gráficos
    chart: {
      primary: string
      secondary: string
      tertiary: string
      quaternary: string
    }
  }
}

// Paletas de colores definidas
export const themes: Record<ThemeName, ThemePalette> = {
  light: {
    name: 'light',
    displayName: 'Claro',
    colors: {
      background: '#ffffff',
      surface: '#f8fafc',
      surfaceHover: '#f1f5f9',
      surfaceActive: '#e2e8f0',
      
      textPrimary: '#1e293b',
      textSecondary: '#475569',
      textTertiary: '#64748b',
      textInverse: '#ffffff',
      
      border: '#e2e8f0',
      borderHover: '#cbd5e1',
      
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      secondary: '#6366f1',
      secondaryHover: '#4f46e5',
      success: '#10b981',
      successHover: '#059669',
      warning: '#f59e0b',
      warningHover: '#d97706',
      error: '#ef4444',
      errorHover: '#dc2626',
      info: '#06b6d4',
      infoHover: '#0891b2',
      
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.5)',
      
      chart: {
        primary: '#3b82f6',
        secondary: '#10b981',
        tertiary: '#f59e0b',
        quaternary: '#ef4444'
      }
    }
  },
  
  dark: {
    name: 'dark',
    displayName: 'Oscuro',
    colors: {
      background: '#0f172a',
      surface: '#1e293b',
      surfaceHover: '#334155',
      surfaceActive: '#475569',
      
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textTertiary: '#94a3b8',
      textInverse: '#0f172a',
      
      border: '#334155',
      borderHover: '#475569',
      
      primary: '#60a5fa',
      primaryHover: '#3b82f6',
      secondary: '#818cf8',
      secondaryHover: '#6366f1',
      success: '#34d399',
      successHover: '#10b981',
      warning: '#fbbf24',
      warningHover: '#f59e0b',
      error: '#f87171',
      errorHover: '#ef4444',
      info: '#22d3ee',
      infoHover: '#06b6d4',
      
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      overlay: 'rgba(0, 0, 0, 0.7)',
      
      chart: {
        primary: '#60a5fa',
        secondary: '#34d399',
        tertiary: '#fbbf24',
        quaternary: '#f87171'
      }
    }
  },
  
  forest: {
    name: 'forest',
    displayName: 'Bosque',
    colors: {
      background: '#0f1f13',
      surface: '#1a2e20',
      surfaceHover: '#243a2d',
      surfaceActive: '#2d4736',
      
      textPrimary: '#ecfdf5',
      textSecondary: '#bbf7d0',
      textTertiary: '#86efac',
      textInverse: '#0f1f13',
      
      border: '#2d4736',
      borderHover: '#365a42',
      
      primary: '#22c55e',
      primaryHover: '#16a34a',
      secondary: '#2dd4bf',
      secondaryHover: '#0d9488',
      success: '#34d399',
      successHover: '#10b981',
      warning: '#fbbf24',
      warningHover: '#f59e0b',
      error: '#f87171',
      errorHover: '#ef4444',
      info: '#22d3ee',
      infoHover: '#06b6d4',
      
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      overlay: 'rgba(0, 20, 8, 0.8)',
      
      chart: {
        primary: '#22c55e',
        secondary: '#2dd4bf',
        tertiary: '#fbbf24',
        quaternary: '#f87171'
      }
    }
  },
  
  ocean: {
    name: 'ocean',
    displayName: 'Océano',
    colors: {
      background: '#0c1827',
      surface: '#1e2a47',
      surfaceHover: '#2a3f66',
      surfaceActive: '#365285',
      
      textPrimary: '#f0f9ff',
      textSecondary: '#bae6fd',
      textTertiary: '#7dd3fc',
      textInverse: '#0c1827',
      
      border: '#2a3f66',
      borderHover: '#365285',
      
      primary: '#0ea5e9',
      primaryHover: '#0284c7',
      secondary: '#3b82f6',
      secondaryHover: '#2563eb',
      success: '#34d399',
      successHover: '#10b981',
      warning: '#fbbf24',
      warningHover: '#f59e0b',
      error: '#f87171',
      errorHover: '#ef4444',
      info: '#22d3ee',
      infoHover: '#06b6d4',
      
      shadow: '0 4px 6px -1px rgba(0, 20, 40, 0.4)',
      overlay: 'rgba(10, 24, 40, 0.8)',
      
      chart: {
        primary: '#0ea5e9',
        secondary: '#3b82f6',
        tertiary: '#fbbf24',
        quaternary: '#f87171'
      }
    }
  }
}

// Contexto del tema
interface ThemeContextType {
  currentTheme: ThemeName
  theme: ThemePalette
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
  themes: Record<ThemeName, ThemePalette>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Provider del tema
interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: ThemeName
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(defaultTheme)

  // Cargar tema desde localStorage al montar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeName
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme)
    }
  }, [])

  // Guardar tema en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('theme', currentTheme)
    
    // Aplicar variables CSS al documento
    const root = document.documentElement
    const colors = themes[currentTheme].colors
    
    root.style.setProperty('--color-background', colors.background)
    root.style.setProperty('--color-surface', colors.surface)
    root.style.setProperty('--color-text-primary', colors.textPrimary)
    root.style.setProperty('--color-text-secondary', colors.textSecondary)
    root.style.setProperty('--color-border', colors.border)
    root.style.setProperty('--color-primary', colors.primary)
  }, [currentTheme])

  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme)
  }

  const toggleTheme = () => {
    const themeOrder: ThemeName[] = ['light', 'dark', 'forest', 'ocean']
    const currentIndex = themeOrder.indexOf(currentTheme)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setCurrentTheme(themeOrder[nextIndex])
  }

  const value: ThemeContextType = {
    currentTheme,
    theme: themes[currentTheme],
    setTheme,
    toggleTheme,
    themes
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook personalizado para usar el tema
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeProvider