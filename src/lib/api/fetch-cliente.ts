/**
 * `fetch` para las llamadas del navegador a `/api/*`.
 *
 * Existe por un hueco concreto: tras Fase 0 todas las rutas devuelven 401 sin
 * sesión, pero **los 8 hooks trataban ese 401 como un error cualquiera**. Si la
 * sesión expiraba a mitad de uso, la pantalla quedaba mostrando "No
 * autenticado" en rojo, sin decir qué hacer y sin forma de salir de ahí salvo
 * recargar a mano.
 *
 * Ahora un 401 manda al login conservando dónde estabas, así que al volver a
 * entrar caés en la misma pantalla.
 *
 * Se usa `window.location.href` y no el router de Next a propósito: con la
 * sesión vencida hay estado de cliente que ya no vale (datos a medio cargar,
 * formularios contra un usuario que ya no está). Una navegación dura lo
 * descarta todo, que es justo lo que se quiere.
 */
export async function fetchApi(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init)

  if (res.status === 401 && typeof window !== 'undefined') {
    const yaEnLogin = window.location.pathname.startsWith('/auth')
    if (!yaEnLogin) {
      const destino = window.location.pathname + window.location.search
      window.location.href = `/auth/login?redirectTo=${encodeURIComponent(destino)}`
    }
  }

  return res
}
