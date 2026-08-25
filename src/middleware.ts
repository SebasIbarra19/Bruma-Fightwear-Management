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

/**
 * Pantallas de autenticación. Son alcanzables sin sesión, pero a quien YA tiene
 * sesión no se le muestran: se lo manda al panel.
 */
const AUTH_PATHS = ['/auth']

/**
 * Rutas abiertas a cualquiera, con o sin sesión. Hoy solo el landing (`/`), que
 * es una página de marketing real —hero, secciones y formulario de contacto—,
 * no una antesala del login: tiene que verla un visitante sin cuenta.
 *
 * Se comparan por igualdad exacta a propósito. Un `startsWith` con `'/'` haría
 * pública toda la aplicación.
 */
const PUBLIC_PATHS = ['/']

/**
 * Assets estáticos de `public/`. La exclusión va acá y no en el `matcher`
 * porque el matcher se compila a un `RegExp` de JavaScript, que **no** admite
 * flags de grupo inline (`(?i:...)` es un error de sintaxis y tumba el build).
 * Acá el flag `i` sí funciona, y hace falta: el proyecto mezcla mayúsculas y
 * minúsculas en la extensión (`Nogi-set-model-01.PNG` conviviendo con
 * `Nogi-set-model-02.png`).
 */
const STATIC_ASSET = /\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf|otf)$/i

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Antes de tocar la sesión: `public/` es contenido estático que Next sirve a
  // cualquiera por diseño (el logo del login tiene que cargar sin sesión).
  // Sin esta salida temprana el middleware respondía 307 hacia el login y
  // `next/image` fallaba con "received null" — recibía HTML esperando un PNG.
  if (STATIC_ASSET.test(pathname)) return NextResponse.next()

  // `createMiddlewareClient` escribe las cookies refrescadas sobre esta respuesta,
  // así que hay que construirla antes y devolverla (o copiar sus cookies al
  // redirigir), o la sesión se pierde en cada request.
  const response = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req: request, res: response })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  const isPublic = PUBLIC_PATHS.includes(pathname)

  if (user) {
    // Ya autenticado: no tiene sentido mostrarle el login.
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // El landing sí se le muestra: es contenido, no una antesala.
    return response
  }

  if (isAuthPage || isPublic) return response

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

/**
 * Qué NO pasa por el middleware.
 *
 * ⚠️ Excluir `public/` no sirve de nada y fue un bug real (2026-08-25): Next
 * sirve el contenido de `public/` desde la RAÍZ, así que `public/brand/x.png`
 * se pide como `/brand/x.png` — una URL que empiece con `/public/` no existe
 * jamás. Con esa exclusión inútil, el middleware interceptaba cada imagen,
 * respondía 307 hacia el login, y `next/image` fallaba con "received null"
 * (recibía HTML donde esperaba un PNG). Rompía cinturones, cinta, y hasta los
 * logos de login y register, que son páginas públicas.
 *
 * La exclusión de assets estáticos NO va acá sino dentro de la función, en
 * `STATIC_ASSET`: este patrón se compila a un `RegExp` de JavaScript y no
 * admite flags de grupo inline, así que no hay forma de hacerlo insensible a
 * mayúsculas en este lugar. Ver el comentario de `STATIC_ASSET` arriba.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
