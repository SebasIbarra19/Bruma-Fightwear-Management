'use client'

import { useEffect, useState } from 'react'
import AuthPage from '@/components/auth/AuthPage'

export default function LoginPage() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    setIsInitialized(true)
    
    if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
      window.history.replaceState({}, '', '/auth/login')
    }
  }, [])

  if (!isInitialized) {
    return null
  }

  return <AuthPage />
}