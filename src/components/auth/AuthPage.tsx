'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthContainer } from '@/components/auth/AuthContainer'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'

function AuthPageInner() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Set initial state based on current pathname
    setIsLogin(pathname === '/auth/login')
  }, [pathname])

  const toggleMode = () => {
    const newIsLogin = !isLogin
    setIsLogin(newIsLogin)
    // Navigate to the new path
    const newPath = newIsLogin ? '/auth/login' : '/auth/register'
    router.push(newPath)
  }

  const handleSuccess = () => {
    router.push('/dashboard')
  }

  return (
    <AuthContainer
      title={isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
      subtitle={isLogin ? 'Ingresa a tu cuenta para continuar' : 'Únete y comienza a gestionar tu negocio'}
      isLogin={isLogin}
      onToggleMode={toggleMode}
    >
      <div className="transition-all duration-500 ease-in-out">
        {isLogin ? (
          <LoginForm onSuccess={handleSuccess} onToggleMode={toggleMode} />
        ) : (
          <RegisterForm onSuccess={handleSuccess} onToggleMode={toggleMode} />
        )}
      </div>
    </AuthContainer>
  )
}

export default function AuthPage() {
  return <AuthPageInner />
}