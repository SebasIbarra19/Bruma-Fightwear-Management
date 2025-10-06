export interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; color?: string }>
  href?: string
  children?: NavigationItem[]
  badge?: {
    text: string
    variant: 'default' | 'success' | 'warning' | 'error' | 'info'
  }
  permissions?: string[]
  section: 'main' | 'project' | 'admin' | 'user'
}

export interface NavigationSection {
  id: string
  title: string
  items: NavigationItem[]
  collapsible?: boolean
  defaultExpanded?: boolean
}

export type SidebarMode = 'expanded' | 'collapsed' | 'hover'

export interface NavigationState {
  currentProject?: {
    id: string
    name: string
    slug: string
    type: string
  }
  activeSection: string
  activePage: string
  sidebarMode: SidebarMode
  expandedSections: Set<string>
}

export interface NavigationConfig {
  sections: NavigationSection[]
  state: NavigationState
}