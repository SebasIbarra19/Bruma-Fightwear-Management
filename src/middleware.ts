import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Redireccionar rutas globales de Fase 2 a project-scoped
  // Por defecto usamos el proyecto BRUMA como fallback
  const defaultProject = 'bruma-fightwear'

  if (pathname === '/suppliers') {
    return NextResponse.redirect(new URL(`/projects/${defaultProject}/suppliers`, request.url))
  }

  if (pathname === '/inventory') {
    return NextResponse.redirect(new URL(`/projects/${defaultProject}/inventory`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/suppliers',
    '/inventory'
  ]
}