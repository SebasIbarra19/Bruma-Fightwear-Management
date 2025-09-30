import Image from 'next/image'
import Link from 'next/link'

interface BrumaLogoProps {
  variant?: 'full' | 'circle'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  href?: string
  showText?: boolean
}

const sizeClasses = {
  sm: {
    full: 'h-8 w-auto',
    circle: 'h-8 w-8'
  },
  md: {
    full: 'h-12 w-auto', 
    circle: 'h-12 w-12'
  },
  lg: {
    full: 'h-16 w-auto',
    circle: 'h-16 w-16'
  },
  xl: {
    full: 'h-24 w-auto',
    circle: 'h-24 w-24'
  }
}

export default function BrumaLogo({ 
  variant = 'full', 
  size = 'md', 
  className = '', 
  href,
  showText = false 
}: BrumaLogoProps) {
  const logoSrc = variant === 'full' 
    ? '/images/bruma/logo-full.png'
    : '/images/bruma/logo-circle-original.png'
  
  const logoClasses = `${sizeClasses[size][variant]} ${className}`
  
  const LogoImage = () => (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src={logoSrc}
        alt="BRUMA Fightwear"
        width={variant === 'full' ? 200 : 100}
        height={variant === 'full' ? 80 : 100}
        className={logoClasses}
        priority
      />
      {showText && variant === 'circle' && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gray-900">BRUMA</span>
          <span className="text-sm text-gray-600">fightwear</span>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="flex items-center hover:opacity-80 transition-opacity">
        <LogoImage />
      </Link>
    )
  }

  return <LogoImage />
}

// Variantes específicas para casos comunes
export const BrumaLogoNavbar = ({ href = '/' }: { href?: string }) => (
  <BrumaLogo variant="circle" size="md" href={href} showText className="hover:scale-105 transition-transform" />
)

export const BrumaLogoHero = () => (
  <BrumaLogo variant="full" size="xl" className="mx-auto" />
)

export const BrumaLogoCard = () => (
  <BrumaLogo variant="circle" size="lg" className="mx-auto mb-4" />
)