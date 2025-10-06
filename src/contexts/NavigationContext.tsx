'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { NavigationState, NavigationConfig, NavigationSection, SidebarMode } from '@/types/navigation'
import { Icons } from '@/components/ui/navigation'

// Estado inicial
const initialState: NavigationState = {
  currentProject: undefined,
  activeSection: 'dashboard',
  activePage: 'overview',
  sidebarMode: 'expanded',
  expandedSections: new Set(['main', 'project'])
}

// Tipos de acciones
type NavigationAction = 
  | { type: 'SET_CURRENT_PROJECT'; payload: NavigationState['currentProject'] }
  | { type: 'SET_ACTIVE_SECTION'; payload: string }
  | { type: 'SET_ACTIVE_PAGE'; payload: string }
  | { type: 'SET_SIDEBAR_MODE'; payload: SidebarMode }
  | { type: 'TOGGLE_SECTION'; payload: string }

// Reducer
function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload }
    
    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.payload }
    
    case 'SET_ACTIVE_PAGE':
      return { ...state, activePage: action.payload }
    
    case 'SET_SIDEBAR_MODE':
      return { ...state, sidebarMode: action.payload }
    
    case 'TOGGLE_SECTION':
      const newExpanded = new Set(state.expandedSections)
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload)
      } else {
        newExpanded.add(action.payload)
      }
      return { ...state, expandedSections: newExpanded }
    
    default:
      return state
  }
}

// Configuración de navegación
const getNavigationSections = (currentProject?: NavigationState['currentProject']): NavigationSection[] => [
  {
    id: 'main',
    title: 'Principal',
    defaultExpanded: true,
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard Personal',
        icon: Icons.Dashboard,
        href: '/dashboard',
        section: 'main'
      },


    ]
  },
  ...(currentProject ? [{
    id: 'project',
    title: `Proyecto: ${currentProject.name}`,
    defaultExpanded: true,
    items: [
      {
        id: 'project-dashboard',
        label: 'Dashboard del Proyecto',
        icon: Icons.Dashboard,
        href: `/projects/${currentProject.slug}/dashboard`,
        section: 'project' as const
      },
      {
        id: 'customers',
        label: 'Clientes',
        icon: Icons.Users,
        href: `/projects/${currentProject.slug}/customers`,
        section: 'project' as const
      },
      {
        id: 'products',
        label: 'Productos',
        icon: Icons.Boxing,
        href: `/projects/${currentProject.slug}/products`,
        section: 'project' as const
      },

      {
        id: 'inventory',
        label: 'Inventario',
        icon: Icons.Package,
        href: `/projects/${currentProject.slug}/inventory`,
        section: 'project' as const
      },
      {
        id: 'orders',
        label: 'Pedidos',
        icon: Icons.ShoppingCart,
        href: `/projects/${currentProject.slug}/orders`,
        section: 'project' as const
      },

      {
        id: 'suppliers',
        label: 'Proveedores',
        icon: Icons.Truck,
        href: `/projects/${currentProject.slug}/suppliers`,
        section: 'project' as const
      },
      {
        id: 'shipping',
        label: 'Envíos',
        icon: Icons.Shipping,
        href: `/projects/${currentProject.slug}/shipping`,
        section: 'project' as const
      }
    ]
  }] : []),

]

// Context
interface NavigationContextType {
  state: NavigationState
  config: NavigationConfig
  setCurrentProject: (project: NavigationState['currentProject']) => void
  setActiveSection: (section: string) => void
  setActivePage: (page: string) => void
  setSidebarMode: (mode: SidebarMode) => void
  toggleSidebar: () => void
  toggleSection: (sectionId: string) => void
  navigateToPage: (href: string, sectionId?: string, pageId?: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

// Provider
export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(navigationReducer, initialState)
  
  const sections = getNavigationSections(state.currentProject)
  const config: NavigationConfig = { sections, state }

  const setCurrentProject = useCallback((project: NavigationState['currentProject']) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: project })
  }, [])

  const setActiveSection = useCallback((section: string) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', payload: section })
  }, [])

  const setActivePage = useCallback((page: string) => {
    dispatch({ type: 'SET_ACTIVE_PAGE', payload: page })
  }, [])

  const setSidebarMode = useCallback((mode: SidebarMode) => {
    dispatch({ type: 'SET_SIDEBAR_MODE', payload: mode })
  }, [])

  const toggleSidebar = useCallback(() => {
    // Alternamos entre expanded y hover cuando se hace toggle
    const newMode: SidebarMode = state.sidebarMode === 'expanded' ? 'hover' : 'expanded'
    dispatch({ type: 'SET_SIDEBAR_MODE', payload: newMode })
  }, [state.sidebarMode])

  const toggleSection = useCallback((sectionId: string) => {
    dispatch({ type: 'TOGGLE_SECTION', payload: sectionId })
  }, [])

  const navigateToPage = useCallback((href: string, sectionId?: string, pageId?: string) => {
    if (sectionId) setActiveSection(sectionId)
    if (pageId) setActivePage(pageId)
    
    // Aquí podrías agregar navegación programática si es necesario
    window.location.href = href
  }, [setActiveSection, setActivePage])

  const value: NavigationContextType = {
    state,
    config,
    setCurrentProject,
    setActiveSection,
    setActivePage,
    setSidebarMode,
    toggleSidebar,
    toggleSection,
    navigateToPage
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

// Hook
export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}