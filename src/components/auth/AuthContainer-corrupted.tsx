'use client'

import { useState, ReactNode } from 'react'
import { useTheme } from '@/contexts/Th                {/* Decorative Elements */}
                <div className="mt-8 flex items-center justify-center space-x-2 opacity-30">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                  <div className="w-16 h-px bg-white"></div>
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                  <div className="w-16 h-px bg-white"></div>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>'
import { SmartLogoCard } from '@/components/common/SmartLogo'
import { 
  PageContainer,
  Flex 
} from '@/components/ui/layout'
import { 
  PageTitle, 
  Text 
} from '@/components/ui/typography'
import { ThemeSelector } from '@/components/ui/theme-selector'

interface AuthContainerProps {
  children: ReactNode
  title: string
  subtitle?: string
  isLogin?: boolean
  onToggleMode?: () => void
}

export function AuthContainer({ 
  children, 
  title, 
  subtitle, 
  isLogin = true, 
  onToggleMode 
}: AuthContainerProps) {
  const { theme } = useTheme()

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ 
        background: `linear-gradient(135deg, ${theme.colors.primary}15 0%, ${theme.colors.secondary}10 50%, ${theme.colors.background} 100%)` 
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: theme.colors.primary }}
        ></div>
        <div 
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: theme.colors.secondary }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
          style={{ backgroundColor: theme.colors.info }}
        ></div>
      </div>

      {/* Theme Selector - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeSelector />
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-0 min-h-[700px] rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Conditional Panel Order based on isLogin */}
          {isLogin ? (
            <>
              {/* Login: Info Panel LEFT */}
              <div 
                className="relative p-12 flex flex-col justify-center text-center lg:text-left order-1"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` 
                }}
              >
                <div className="absolute inset-0" style={{ backgroundColor: theme.colors.background + '10' }}></div>
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.colors.surface}10, transparent)` }}></div>
                
                <div className="relative z-10">
                  <div className="mb-8 flex justify-center lg:justify-start">
                    <SmartLogoCard size="xl" showText={true} />
                  </div>
                  
                  <PageTitle className="text-white mb-6 text-3xl lg:text-4xl">
                    Bienvenido de vuelta
                  </PageTitle>
                  
                  <Text className="text-white/90 text-lg leading-relaxed mb-8">
                    Accede a tu cuenta y continúa gestionando tu negocio de manera inteligente.
                  </Text>

                  {/* Toggle Button */}
                  <div className="flex justify-center lg:justify-start">
                    <button
                      onClick={onToggleMode}
                      className="px-8 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                    >
                      ¿No tienes cuenta? Regístrate
                    </button>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute bottom-8 left-12 right-12">
                    <div className="flex items-center justify-center space-x-2 opacity-30">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <div className="w-16 h-px bg-white"></div>
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                      <div className="w-16 h-px bg-white"></div>
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login: Form Panel RIGHT */}
              <div 
                className="relative p-12 flex flex-col justify-center backdrop-blur-xl order-2"
                style={{ 
                  backgroundColor: theme.colors.surface + 'f0',
                  borderLeft: `1px solid ${theme.colors.border}30`
                }}
              >
                <div className="absolute inset-0 backdrop-blur-xl" style={{ backgroundColor: theme.colors.background + '40' }}></div>
                
                <div className="relative z-10 max-w-md mx-auto w-full">
                  <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                      {title}
                    </h2>
                    {subtitle && (
                      <Text className="text-lg">
                        {subtitle}
                      </Text>
                    )}
                  </div>

                  {children}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Register: Form Panel LEFT */}
              <div 
                className="relative p-12 flex flex-col justify-center backdrop-blur-xl order-1"
                style={{ 
                  backgroundColor: theme.colors.surface + 'f0',
                  borderRight: `1px solid ${theme.colors.border}30`
                }}
              >
                <div className="absolute inset-0 backdrop-blur-xl" style={{ backgroundColor: theme.colors.background + '40' }}></div>
                
                <div className="relative z-10 max-w-md mx-auto w-full">
                  <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                      {title}
                    </h2>
                    {subtitle && (
                      <Text className="text-lg">
                        {subtitle}
                      </Text>
                    )}
                  </div>

                  {children}
                </div>
              </div>

              {/* Register: Info Panel RIGHT */}
              <div 
                className="relative p-12 flex flex-col justify-center text-center lg:text-right order-2"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.primary})` 
                }}
              >
                <div className="absolute inset-0" style={{ backgroundColor: theme.colors.background + '10' }}></div>
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.colors.surface}10, transparent)` }}></div>
                
                <div className="relative z-10">
                  <div className="mb-8 flex justify-center lg:justify-end">
                    <SmartLogoCard size="xl" showText={true} />
                  </div>
                  
                  <PageTitle className="text-white mb-6 text-3xl lg:text-4xl">
                    ¡Únete a SmartAdmin!
                  </PageTitle>
                  
                  <Text className="text-white/90 text-lg leading-relaxed mb-8">
                    Crea tu cuenta y descubre cómo transformar la gestión de tu negocio.
                  </Text>

                  {/* Toggle Button */}
                  <div className="flex justify-center lg:justify-end">
                    <button
                      onClick={onToggleMode}
                      className="px-8 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                    >
                      ¿Ya tienes cuenta? Inicia sesión
                    </button>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute bottom-8 left-12 right-12">
                    <div className="flex items-center justify-center space-x-2 opacity-30">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <div className="w-16 h-px bg-white"></div>
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                      <div className="w-16 h-px bg-white"></div>
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}