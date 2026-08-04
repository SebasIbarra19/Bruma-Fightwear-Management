'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const NAV_LINKS = [
  { href: '#filosofia', label: 'Filosofía' },
  { href: '#raices', label: 'Raíces' },
  { href: '#contacto', label: 'Contacto' },
]

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`nav-horizontal-wall fixed top-0 left-0 w-full z-50 px-6 md:px-12 py-4 flex justify-between items-center${scrolled ? ' scrolled' : ''}`}
    >
      <Link
        href="/"
        className="font-fraunces font-black text-2xl tracking-tighter uppercase cursor-pointer hover:text-ember transition-colors duration-300 relative z-10 text-bone"
      >
        BRUMA
      </Link>

      <nav className="hidden md:flex gap-3 relative z-10">
        <a href="#" className="header-btn active font-geist text-[9px] uppercase tracking-[0.2em] font-bold select-none block">
          Inicio
        </a>
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="header-btn font-geist text-[9px] uppercase tracking-[0.2em] font-bold select-none block"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-4 md:gap-6 relative z-10">
        <button
          onClick={() => router.push('/auth/login')}
          className="header-btn font-geist text-[9px] uppercase tracking-[0.2em] font-bold select-none block"
        >
          Iniciar Sesión
        </button>
      </div>
    </header>
  )
}
