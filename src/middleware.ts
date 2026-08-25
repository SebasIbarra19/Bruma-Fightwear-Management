import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

/**
 * Puerta de entrada: sin sesión no se llega a ninguna pantalla ni endpoint.
 *
 * Antes esto era un `return NextResponse.next()` con el comentario "BYPASS TOTAL
 * PARA DESARROLLO" — o sea, nada protegía nada.
 *
 * ⚠️ Este middleware NO es la única defensa, a propósito. CVE-2025-29927 permitía
 * saltear el middleware de Next entero con el header `x-middleware-subrequest`
 * (corregido en 14.2.25, y este proyecto ya corre 14.2.33). La lección se
 * mantiene: cada route handler vuelve a verificar identidad con `withAuth`
 * (`src/lib/api/middleware.ts`). Acá se resuelve la experiencia —redirigir a
 * login— y se refresca la cookie de sesión; la autorización real vive en cada
 * ruta.
 *
 * Se usa `getUser()` y no `getSession()`: el segundo solo decodifica la cookie,
 * mientras que el primero la valida contra el servidor de Auth. En un panel de
 * 1-3 personas el viaje extra no se nota.
 */

/** Rutas alcanzables sin sesión. Todo lo demás exige estar autenticado. */
const PUBLIC_PATHS = ['/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // `createMiddlewareClient` escribe las cookies refrescadas sobre esta respuesta,
  // así que hay que construirla antes y devolverla (o copiar sus cookies al
  // redirigir), o la sesión se pierde en cada request.
  const response = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req: request, res: response })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  if (user) {
    // Ya autenticado: no tiene sentido mostrarle el login.
    if (isPublic) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  if (isPublic) return response

  // Las llamadas de datos esperan JSON, no un documento HTML de login: un 302 acá
  // haría que el fetch del cliente parsee la página de login como si fuera la
  // respuesta de la API.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, error: { message: 'No autenticado' } },
      { status: 401 }
    )
  }

  const loginUrl = new URL('/auth/login', request.url)
  loginUrl.searchParams.set('redirectTo', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
