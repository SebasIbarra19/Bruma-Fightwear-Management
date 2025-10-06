'use client'

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeSelector } from '@/components/ui/theme-selector'

interface IconProps {
  className?: string
  color?: string
}

export const Icons = {
  // Navegación
  Home: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 22 5-5 5 5" />
    </svg>
  ),
  Dashboard: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Users: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  Products: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Analytics: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Settings: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  
  // Acciones
  Search: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Notification: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5zm0 0v-8a2 2 0 00-2-2H7a2 2 0 00-2 2v8" />
    </svg>
  ),
  Menu: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  
  // BRUMA específicos
  Boxing: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill={color || "currentColor"} viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  ),
  Gym: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Trophy: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  
  // Estados y progreso
  Check: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Warning: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Info: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),

  // Iconos adicionales para navegación completa
  Package: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  ShoppingCart: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 5H3m3 8l1.68 6.64a2 2 0 002 1.36h9.72a2 2 0 002-1.36L21 13" />
    </svg>
  ),
  Receipt: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5l-5-5-5 5v-13a2 2 0 012-2h6a2 2 0 012 2v13z" />
    </svg>
  ),
  Truck: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  Shipping: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7h16z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 13v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
    </svg>
  ),
  Tag: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  TrendingUp: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Location: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Eye: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Plus: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  
  // Usuario
  User: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  LogOut: ({ className, color }: IconProps = {}) => (
    <svg className={`w-5 h-5 ${className || ''}`} fill="none" stroke={color || "currentColor"} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
}

// Sidebar Navigation Component
interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { theme } = useTheme()
  const menuItems = [
    { icon: Icons.Dashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Icons.Users, label: 'Empleados', href: '/employees' },
    { icon: Icons.Products, label: 'Productos', href: '/products' },
    { icon: Icons.Analytics, label: 'Analytics', href: '/analytics' },
    { icon: Icons.Settings, label: 'Configuración', href: '/settings' },
  ]

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}
      style={{
        backgroundColor: theme.colors.surface,
        borderRight: `1px solid ${theme.colors.border}`
      }}
      >
        {/* Logo */}
        <div 
          className="p-6"
          style={{ borderBottom: `1px solid ${theme.colors.border}` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})` 
              }}
            >
              <Icons.Boxing />
            </div>
            <div>
              <h2 style={{ color: theme.colors.textPrimary }} className="font-bold text-lg">BRUMA</h2>
              <p style={{ color: theme.colors.textSecondary }} className="text-xs">Fightwear Mgmt</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm"
                style={{ 
                  color: theme.colors.textSecondary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.textPrimary
                  e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
                  // También cambiar el color del ícono
                  const iconElement = e.currentTarget.querySelector('svg')
                  if (iconElement) {
                    iconElement.style.stroke = theme.colors.textPrimary
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.textSecondary
                  e.currentTarget.style.backgroundColor = 'transparent'
                  // Restaurar el color del ícono
                  const iconElement = e.currentTarget.querySelector('svg')
                  if (iconElement) {
                    iconElement.style.stroke = theme.colors.textSecondary
                  }
                }}
              >
                <item.icon color={theme.colors.textSecondary} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          
          {/* User Section */}
          <div 
            className="mt-8 pt-6"
            style={{ borderTop: `1px solid ${theme.colors.border}` }}
          >
            <button 
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm"
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.textPrimary
                e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
                // También cambiar el color del ícono
                const iconElement = e.currentTarget.querySelector('svg')
                if (iconElement) {
                  iconElement.style.stroke = theme.colors.textPrimary
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary
                e.currentTarget.style.backgroundColor = 'transparent'
                // Restaurar el color del ícono
                const iconElement = e.currentTarget.querySelector('svg')
                if (iconElement) {
                  iconElement.style.stroke = theme.colors.textSecondary
                }
              }}
            >
              <Icons.User color={theme.colors.textSecondary} />
              <span>Mi Perfil</span>
            </button>
            <button 
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm"
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.error
                e.currentTarget.style.backgroundColor = `${theme.colors.error}20`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Icons.LogOut />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  )
}

// Header Component
interface HeaderProps {
  onMenuClick: () => void
  user?: {
    name: string
    avatar?: string
    role: string
  }
}

export function Header({ onMenuClick, user }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { theme } = useTheme()

  return (
    <header 
      className="border-b px-6 py-4"
      style={{ 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border 
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{ 
              color: theme.colors.textSecondary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.colors.textPrimary
              e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.colors.textSecondary
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Icons.Menu color={theme.colors.textPrimary} />
          </button>
          
          <div className="hidden lg:block">
            <h1 
              className="text-xl font-semibold"
              style={{ color: theme.colors.textPrimary }}
            >
              Sistema BRUMA
            </h1>
            <p 
              className="text-sm"
              style={{ color: theme.colors.textTertiary }}
            >
              Panel de administración
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar..."
                className="pl-10 pr-4 py-2 rounded-lg border focus:outline-none w-64 transition-colors"
                style={{
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.primary
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border
                }}
              />
              <Icons.Search 
                className="absolute left-3 top-2.5"
                color={theme.colors.textSecondary}
              />
            </div>
          </div>

          {/* Theme Selector */}
          <ThemeSelector />

          {/* Notifications */}
          <button 
            className="relative p-2 rounded-lg transition-colors"
            style={{ color: theme.colors.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.colors.textPrimary
              e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
              // Cambiar color del ícono
              const iconElement = e.currentTarget.querySelector('svg')
              if (iconElement) {
                iconElement.style.stroke = theme.colors.textPrimary
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.colors.textSecondary
              e.currentTarget.style.backgroundColor = 'transparent'
              // Restaurar color del ícono
              const iconElement = e.currentTarget.querySelector('svg')
              if (iconElement) {
                iconElement.style.stroke = theme.colors.textSecondary
              }
            }}
          >
            <Icons.Notification color={theme.colors.textSecondary} />
            <span 
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center"
              style={{ 
                backgroundColor: theme.colors.error,
                color: theme.colors.textInverse
              }}
            >
              3
            </span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-lg transition-colors"
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.textPrimary
                e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                  color: theme.colors.textInverse
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p 
                  className="text-sm font-medium"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {user?.name || 'Usuario'}
                </p>
                <p 
                  className="text-xs"
                  style={{ color: theme.colors.textTertiary }}
                >
                  {user?.role || 'Admin'}
                </p>
              </div>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                  style={{ backgroundColor: theme.colors.overlay }}
                />
                <div 
                  className="absolute right-0 mt-2 w-48 border rounded-lg shadow-xl z-50"
                  style={{ 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    boxShadow: theme.colors.shadow
                  }}
                >
                  <div className="p-2">
                    <button 
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                      style={{ color: theme.colors.textSecondary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme.colors.textPrimary
                        e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme.colors.textSecondary
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      Mi Perfil
                    </button>
                    <button 
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                      style={{ color: theme.colors.textSecondary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme.colors.textPrimary
                        e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme.colors.textSecondary
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      Configuración
                    </button>
                    <hr 
                      className="my-2"
                      style={{ borderColor: theme.colors.border }}
                    />
                    <button 
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                      style={{ color: theme.colors.error }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.error + '20'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

// Progress Steps Component
interface ProgressStepsProps {
  steps: Array<{
    title: string
    description?: string
    status: 'completed' | 'current' | 'upcoming'
  }>
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-semibold
                ${step.status === 'completed' 
                  ? 'bg-green-600 border-green-600 text-white' 
                  : step.status === 'current'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-400'
                }
              `}>
                {step.status === 'completed' ? (
                  <Icons.Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${
                  step.status === 'upcoming' ? 'text-gray-400' : 'text-white'
                }`}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                steps[index + 1].status === 'completed' || step.status === 'completed'
                  ? 'bg-green-600'
                  : step.status === 'current'
                  ? 'bg-blue-600'
                  : 'bg-gray-600'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// Project Info Component - Redesigned as Square Card
interface ProjectInfoProps {
  name: string
  logo?: React.ReactNode
  description: string
  status: 'active' | 'inactive' | 'development'
  version?: string
  tags?: string[]
}

export function ProjectInfo({ name, logo, description, status, version, tags }: ProjectInfoProps) {
  const { theme } = useTheme()
  
  return (
    <div 
      className="rounded-xl p-6 aspect-square flex flex-col justify-between hover:opacity-90 transition-all duration-200"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        border: `1px solid ${theme.colors.border}`
      }}
    >
      {/* Header con Logo y Status */}
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(to bottom right, ${theme.colors.surfaceActive}, ${theme.colors.borderHover})`
          }}
        >
          {logo || <Icons.Boxing className="w-6 h-6" color={theme.colors.textInverse} />}
        </div>
        
        <div 
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: status === 'active' ? theme.colors.success + '20' :
                           status === 'development' ? theme.colors.info + '20' :
                           theme.colors.textTertiary + '20',
            color: status === 'active' ? theme.colors.success :
                   status === 'development' ? theme.colors.info :
                   theme.colors.textTertiary
          }}
        >
          {status === 'active' && <Icons.Check className="w-3 h-3 mr-1" />}
          {status === 'development' && <Icons.Info className="w-3 h-3 mr-1" />}
          {status === 'inactive' && <Icons.Warning className="w-3 h-3 mr-1" />}
          {status === 'active' ? 'Activo' : 
           status === 'development' ? 'Dev' : 'Inactivo'}
        </div>
      </div>
      
      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold truncate" style={{ color: theme.colors.textPrimary }}>{name}</h3>
            {version && (
              <span 
                className="text-xs px-2 py-1 rounded shrink-0"
                style={{
                  backgroundColor: theme.colors.surfaceHover,
                  color: theme.colors.textSecondary
                }}
              >
                v{version}
              </span>
            )}
          </div>
          
          <p 
            className="text-sm leading-relaxed overflow-hidden" 
            style={{
              color: theme.colors.textSecondary,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical'
            }}
          >{description}</p>
        </div>
        
        {/* Tags en la parte inferior */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: theme.colors.surfaceActive,
                  color: theme.colors.textSecondary
                }}
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span 
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: theme.colors.surfaceActive,
                  color: theme.colors.textSecondary
                }}
              >
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Login Form Component
export function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  })

  return (
    <div className="w-full max-w-md bg-gray-800 rounded-xl p-8 border border-gray-700">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
          <Icons.Boxing className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Iniciar Sesión</h2>
        <p className="text-gray-400 text-sm">Accede al sistema BRUMA</p>
      </div>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            placeholder="usuario@bruma.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contraseña
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.remember}
              onChange={(e) => setFormData(prev => ({ ...prev, remember: e.target.checked }))}
              className="mr-2 rounded"
            />
            <span className="text-sm text-gray-300">Recordarme</span>
          </label>
          <button type="button" className="text-sm text-blue-400 hover:text-blue-300">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors"
        >
          Iniciar Sesión
        </button>

        <div className="text-center">
          <span className="text-gray-400 text-sm">
            ¿No tienes cuenta? {' '}
            <button type="button" className="text-blue-400 hover:text-blue-300">
              Regístrate
            </button>
          </span>
        </div>
      </form>
    </div>
  )
}

// Register Form Component
export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })

  return (
    <div className="w-full max-w-md bg-gray-800 rounded-xl p-8 border border-gray-700">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
          <Icons.User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Crear Cuenta</h2>
        <p className="text-gray-400 text-sm">Únete al sistema BRUMA</p>
      </div>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nombre completo
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            placeholder="usuario@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contraseña
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confirmar contraseña
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
              className="mt-1"
            />
            <span className="text-sm text-gray-300">
              Acepto los{' '}
              <button type="button" className="text-blue-400 hover:text-blue-300">
                términos y condiciones
              </button>
              {' '}y la{' '}
              <button type="button" className="text-blue-400 hover:text-blue-300">
                política de privacidad
              </button>
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition-colors"
        >
          Crear Cuenta
        </button>

        <div className="text-center">
          <span className="text-gray-400 text-sm">
            ¿Ya tienes cuenta? {' '}
            <button type="button" className="text-blue-400 hover:text-blue-300">
              Inicia sesión
            </button>
          </span>
        </div>
      </form>
    </div>
  )
}