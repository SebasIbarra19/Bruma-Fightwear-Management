'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { NavigationState, NavigationConfig, NavigationSection, SidebarMode } from '@/types/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Truck, 
  Shield, 
  ArrowUpDown, 
  BarChart3,
  Tag
} from 'lucide-react'

// Estado inicial
const initialState: NavigationState = {
  currentProject: undefined,
  activeSection: 'dashboard',
  activePage: 'overview',
  sidebarMode: 'expanded',
  expandedSections: new Set(['main'])
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

// Configuración de navegación Single Tenant (Admin Shell)
const getNavigationSections = (): NavigationSection[] => [
  {
    id: 'main',
    title: 'Gestión Bruma',
    defaultExpanded: true,
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard size={18} />,
        href: '/dashboard',
        section: 'main'
      },
      {
        id: 'inventory',
        label: 'Inventario',
        icon: <Package size={18} />,
        href: '/inventory',
        section: 'main'
      },
      {
        id: 'movements',
        label: 'Movimientos',
        icon: <ArrowUpDown size={18} />,
        href: '/movements',
        section: 'main'
      },
      {
        id: 'catalog',
        label: 'Catálogo',
        icon: <Tag size={18} />,
        href: '/catalog',
        section: 'main'
      },
      {
        id: 'orders',
        label: 'Pedidos',
        icon: <ShoppingCart size={18} />,
        href: '/orders',
        section: 'main'
      },
      {
        id: 'customers',
        label: 'Clientes',
        icon: <Users size={18} />,
        href: '/customers',
        section: 'main'
      },
      {
        id: 'suppliers',
        label: 'Proveedores',
        icon: <Truck size={18} />,
        href: '/suppliers',
        section: 'main'
      },
      {
        id: 'reporting',
        label: 'Reportes',
        icon: <BarChart3 size={18} />,
        href: '/reporting',
        section: 'main'
      }
    ]
  }
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
  
  const sections = getNavigationSections()
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
    const newMode: SidebarMode = state.sidebarMode === 'expanded' ? 'hover' : 'expanded'
    dispatch({ type: 'SET_SIDEBAR_MODE', payload: newMode })
  }, [state.sidebarMode])

  const toggleSection = useCallback((sectionId: string) => {
    dispatch({ type: 'TOGGLE_SECTION', payload: sectionId })
  }, [])

  const navigateToPage = useCallback((href: string, sectionId?: string, pageId?: string) => {
    if (sectionId) setActiveSection(sectionId)
    if (pageId) setActivePage(pageId)
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
