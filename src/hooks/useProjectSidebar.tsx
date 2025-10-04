'use client'

import { usePathname } from 'next/navigation'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  isActive?: boolean
  subItems?: Array<{
    id: string
    label: string
    href: string
  }>
}

interface ProjectSidebarConfig {
  projectSlug: string
}

export function useProjectSidebar({ projectSlug }: ProjectSidebarConfig): SidebarItem[] {
  const pathname = usePathname()

  const sidebarItems: SidebarItem[] = [
    {
      id: 'analytics',
      label: 'Estadísticas y Métricas',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: `/projects/${projectSlug}/dashboard`
    },
    {
      id: 'inventory',
      label: 'Gestión de Inventario',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      href: `/projects/${projectSlug}/inventory`
    },
    {
      id: 'products',
      label: 'Productos y Categorías',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      href: `/projects/${projectSlug}/products`,
      subItems: [
        { id: 'products-list', label: 'Lista de Productos', href: `/projects/${projectSlug}/products` },
        { id: 'categories', label: 'Categorías', href: `/projects/${projectSlug}/categories` }
      ]
    },
    {
      id: 'orders',
      label: 'Gestión de Pedidos',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: `/projects/${projectSlug}/orders`
    },
    {
      id: 'customers',
      label: 'Gestión de Clientes',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
        </svg>
      ),
      href: `/projects/${projectSlug}/customers`
    },
    {
      id: 'suppliers',
      label: 'Gestión de Proveedores',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4" />
        </svg>
      ),
      href: `/projects/${projectSlug}/suppliers`
    },
    {
      id: 'shipping',
      label: 'Gestión de Envíos',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: `/projects/${projectSlug}/shipping`
    }
  ]

  // Determinar cuál item está activo basado en la ruta actual
  return sidebarItems.map(item => ({
    ...item,
    isActive: pathname === item.href || 
              (item.subItems && item.subItems.some(subItem => pathname === subItem.href))
  }))
}