'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeSelector } from '@/components/ui/theme-selector'
import BrumaLogo from '@/components/bruma/BrumaLogo'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface UnifiedHeaderProps {
  breadcrumbs: BreadcrumbItem[]
  showBackButton?: boolean
  backButtonHref?: string
  backButtonLabel?: string
}

export function UnifiedHeader({ 
  breadcrumbs, 
  showBackButton = false, 
  backButtonHref = '/dashboard',
  backButtonLabel = 'Dashboard Personal'
}: UnifiedHeaderProps) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <header className="border-b" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
      <div className="px-6 py-4">
        {/* Top row: Logo + User controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <BrumaLogo className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold" style={{ color: theme.colors.textPrimary }}>
                BRUMA Fightwear
              </h1>
              <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                ecommerce
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeSelector />
            
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-xl transition-all duration-200"
                style={{ 
                  backgroundColor: theme.colors.surface + '80',
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                    color: 'white'
                  }}
                >
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                  {user?.email?.split('@')[0]}
                </span>
              </button>

              {userDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50"
                    style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                  >
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-opacity-10 transition-colors"
                        style={{ color: theme.colors.textPrimary }}
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row: Breadcrumbs */}
        <div className="flex items-center space-x-2">
          {showBackButton && (
            <>
              <button
                onClick={() => router.push(backButtonHref)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors text-sm"
                style={{ 
                  backgroundColor: 'transparent',
                  color: theme.colors.textSecondary
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>{backButtonLabel}</span>
              </button>
              <div className="h-4 w-px" style={{ backgroundColor: theme.colors.border }}></div>
            </>
          )}

          <nav className="flex items-center space-x-2">
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                {index > 0 && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: theme.colors.textTertiary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                {item.href ? (
                  <button
                    onClick={() => router.push(item.href!)}
                    className="text-sm font-medium hover:underline transition-colors"
                    style={{ color: theme.colors.primary }}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span 
                    className="text-sm font-medium"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}