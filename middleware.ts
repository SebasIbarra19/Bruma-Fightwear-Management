import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  console.log('🔍 Middleware - Path:', req.nextUrl.pathname)

  try {
    // Intentar múltiples métodos para obtener la sesión
    let session = null
    let error = null

    // Método 1: getSession()
    const sessionResult = await supabase.auth.getSession()
    session = sessionResult.data.session
    error = sessionResult.error

    console.log('🔍 Middleware - Session:', session ? `EXISTS (user: ${session.user.email})` : 'NULL', error ? `Error: ${error.message}` : '')

    // Método 2: Si no hay sesión, intentar getUser() como respaldo
    if (!session) {
      try {
        const userResult = await supabase.auth.getUser()
        if (userResult.data.user && !userResult.error) {
          console.log('🔍 Middleware - Found user via getUser():', userResult.data.user.email)
          // Si encontramos un usuario, probablemente hay una sesión válida
          // Permitir acceso y dejar que el cliente maneje la autenticación
          console.log('✅ Middleware - Allowing request (user found via getUser)')
          return res
        }
      } catch (userError) {
        console.log('🔍 Middleware - getUser() failed:', userError)
      }
    }

    // Si estamos en una ruta protegida y no hay sesión, redirigir a login
    const protectedPaths = ['/projects', '/dashboard', '/profile']
    const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))
    
    console.log('🔍 Middleware - Protected path:', isProtectedPath)
    
    // En desarrollo, ser menos agresivo con las redirecciones
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (isProtectedPath && !session && !isDevelopment) {
      console.log('🚫 Middleware - Redirecting to login (production)')
      const redirectUrl = new URL('/auth/login', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    } else if (isProtectedPath && !session && isDevelopment) {
      console.log('⚠️ Middleware - Protected path without session in development - allowing through')
    }

    // Si estamos en auth y ya hay sesión, redirigir al dashboard
    if (req.nextUrl.pathname.startsWith('/auth') && session) {
      console.log('✅ Middleware - Redirecting authenticated user to dashboard')
      const redirectTo = req.nextUrl.searchParams.get('redirectTo') || '/projects/1/dashboard'
      return NextResponse.redirect(new URL(redirectTo, req.url))
    }

    console.log('✅ Middleware - Allowing request')
    return res
  } catch (error) {
    console.error('❌ Middleware error:', error)
    // En caso de error, permitir el acceso y dejar que el cliente maneje
    console.log('⚠️ Middleware - Allowing request due to error')
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}