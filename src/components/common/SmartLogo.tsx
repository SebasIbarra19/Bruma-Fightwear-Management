'use client'

import { useProjectContext } from '@/hooks/useProjectContext'
import BrumaLogo from '@/components/bruma/BrumaLogo'

interface SmartLogoProps {
  variant?: 'navbar' | 'hero' | 'card'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  href?: string
  className?: string
}

export function SmartLogo({ 
  variant = 'navbar', 
  size = 'md', 
  showText = true, 
  href, 
  className = '' 
}: SmartLogoProps) {
  const { isBrumaProject, projectName } = useProjectContext()

  // Si estamos en un proyecto BRUMA, mostrar logo de BRUMA
  if (isBrumaProject) {
    return (
      <BrumaLogo
        variant={variant === 'hero' ? 'full' : 'circle'}
        size={size}
        href={href}
        className={className}
        showText={showText}
      />
    )
  }

  // Por defecto, mostrar logo de SmartAdmin
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  }

  const LogoContent = () => (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img 
        src="/images/smartadmin-logo.png" 
        alt="SmartAdmin" 
        className={`${sizeClasses[size]}`}
      />
      {showText && (
        <span className={`font-bold text-gray-900 ${textSizeClasses[size]}`}>
          SmartAdmin
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <a href={href} className="inline-block">
        <LogoContent />
      </a>
    )
  }

  return <LogoContent />
}

// Variantes específicas para casos comunes
export function SmartLogoNavbar(props: Omit<SmartLogoProps, 'variant'>) {
  return <SmartLogo {...props} variant="navbar" size="sm" />
}

export function SmartLogoHero(props: Omit<SmartLogoProps, 'variant'>) {
  return <SmartLogo {...props} variant="hero" size="xl" />
}

export function SmartLogoCard(props: Omit<SmartLogoProps, 'variant'>) {
  return <SmartLogo {...props} variant="card" size="md" />
}