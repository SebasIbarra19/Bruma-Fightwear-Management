'use client'

import { useEffect, useState } from 'react'
import AuthPage from '@/components/auth/AuthPage'

export default function LoginPage() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Set the initial mode to login and mark as initialized
    setIsInitialized(true)
    
    // Ensure URL shows login when this page loads
    if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
      window.history.replaceState({}, '', '/auth/login')
    }
  }, [])

  // Don't render until initialized to prevent hydration issues
  if (!isInitialized) {
    return null
  }

  return <AuthPage />
}