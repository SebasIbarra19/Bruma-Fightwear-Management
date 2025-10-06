'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type ThemeName = 'light' | 'dark' | 'forest' | 'ocean' | 'warm'

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
      background: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceHover: '#2a2a2a',
      surfaceActive: '#3a3a3a',
      
      textPrimary: '#ffffff',
      textSecondary: '#d4d4d4',
      textTertiary: '#a1a1a1',
      textInverse: '#0a0a0a',
      
      border: '#404040',
      borderHover: '#525252',
      
      primary: '#ffffff',
      primaryHover: '#e5e5e5',
      secondary: '#737373',
      secondaryHover: '#525252',
      success: '#22c55e',
      successHover: '#16a34a',
      warning: '#eab308',
      warningHover: '#ca8a04',
      error: '#dc2626',
      errorHover: '#b91c1c',
      info: '#06b6d4',
      infoHover: '#0891b2',
      
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
      overlay: 'rgba(0, 0, 0, 0.8)',
      
      chart: {
        primary: '#ffffff',
        secondary: '#22c55e',
        tertiary: '#eab308',
        quaternary: '#dc2626'
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
  },
  
  warm: {
    name: 'warm',
    displayName: 'Cálido',
    colors: {
      background: '#f0e6d2',
      surface: '#e8dcc6',
      surfaceHover: '#ddd0b8',
      surfaceActive: '#d2c5a9',
      
      textPrimary: '#3e2723',
      textSecondary: '#5d4037',
      textTertiary: '#795548',
      textInverse: '#f0e6d2',
      
      border: '#c7b896',
      borderHover: '#b8a882',
      
      primary: '#c56c00',
      primaryHover: '#a55a00',
      secondary: '#d4810f',
      secondaryHover: '#c56c00',
      success: '#2e7d32',
      successHover: '#1b5e20',
      warning: '#f57c00',
      warningHover: '#ef6c00',
      error: '#d32f2f',
      errorHover: '#c62828',
      info: '#0288d1',
      infoHover: '#0277bd',
      
      shadow: '0 4px 6px -1px rgba(62, 39, 35, 0.2)',
      overlay: 'rgba(62, 39, 35, 0.7)',
      
      chart: {
        primary: '#c56c00',
        secondary: '#2e7d32',
        tertiary: '#f57c00',
        quaternary: '#d32f2f'
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
  defaultTheme = 'warm' 
}) => {
  // Función para aplicar tema inmediatamente al DOM
  const applyThemeToDOM = (themeName: ThemeName) => {
    if (typeof window !== 'undefined') {
      const colors = themes[themeName].colors
      const root = document.documentElement
      
      root.style.setProperty('--color-background', colors.background)
      root.style.setProperty('--color-surface', colors.surface)
      root.style.setProperty('--color-text-primary', colors.textPrimary)
      root.style.setProperty('--color-text-secondary', colors.textSecondary)
      root.style.setProperty('--color-border', colors.border)
      root.style.setProperty('--color-primary', colors.primary)
      root.setAttribute('data-theme', themeName)
    }
  }

  // Función para obtener el tema inicial con PRIORIDAD ABSOLUTA a localStorage
  const getInitialTheme = (): ThemeName => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as ThemeName
      // PRIORIDAD ABSOLUTA: Si hay tema guardado, usarlo SIEMPRE
      if (savedTheme && themes[savedTheme]) {
        // Aplicar inmediatamente al DOM
        applyThemeToDOM(savedTheme)
        return savedTheme
      }
    }
    // Aplicar tema por defecto al DOM
    applyThemeToDOM(defaultTheme)
    return defaultTheme
  }

  const [currentTheme, setCurrentTheme] = useState<ThemeName>(getInitialTheme)
  const [isHydrated, setIsHydrated] = useState(false)

  // Cargar tema desde localStorage al montar - EJECUTAR INMEDIATAMENTE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as ThemeName
      
      if (savedTheme && themes[savedTheme]) {
        // Aplicar inmediatamente sin esperar al estado
        applyThemeToDOM(savedTheme)
        if (savedTheme !== currentTheme) {
          setCurrentTheme(savedTheme)
        }
      }
      
      setIsHydrated(true)
    }
  }, [])

  // Aplicar tema al DOM cuando cambie el estado (respaldo)
  useEffect(() => {
    applyThemeToDOM(currentTheme)
  }, [currentTheme])

  // Hook para mantener tema en navegación SPA
  useEffect(() => {
    const handleRouteChange = () => {
      // Re-aplicar tema en cada cambio de ruta
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const savedTheme = localStorage.getItem('theme') as ThemeName
          if (savedTheme && themes[savedTheme]) {
            applyThemeToDOM(savedTheme)
            if (savedTheme !== currentTheme) {
              setCurrentTheme(savedTheme)
            }
          }
        }
      }, 0)
    }

    // Escuchar cambios de URL (Next.js SPA navigation)
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleRouteChange)
      
      // También verificar en cada render
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            handleRouteChange()
          }
        })
      })
      
      observer.observe(document.body, { childList: true, subtree: true })
      
      return () => {
        window.removeEventListener('popstate', handleRouteChange)
        observer.disconnect()
      }
    }
  }, [currentTheme])

  const setTheme = (theme: ThemeName) => {
    // Aplicar inmediatamente al DOM (sin esperar re-render)
    applyThemeToDOM(theme)
    
    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
    }
    
    // Actualizar estado
    setCurrentTheme(theme)
  }

  const toggleTheme = () => {
    const themeOrder: ThemeName[] = ['light', 'dark', 'forest', 'ocean', 'warm']
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

  // Evitar renderizar hasta que se haya hidratado el tema correcto
  if (!isHydrated) {
    return (
      <ThemeContext.Provider value={value}>
        <div style={{ 
          backgroundColor: 'var(--color-background)', 
          color: 'var(--color-text-primary)',
          minHeight: '100vh'
        }}>
          {children}
        </div>
      </ThemeContext.Provider>
    )
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