'use client'

import { fetchApi } from '@/lib/api/fetch-cliente'

/**
 * Caché en memoria de respuestas de la API, con revalidación en segundo plano.
 *
 * El problema que resuelve: cada cambio de pestaña volvía a pedir todo desde
 * cero, aunque hubieras estado ahí diez segundos antes. Como cada ruta paga
 * además el viaje a Auth antes de su consulta, eso son ~800 ms de esqueletos
 * cada vez, y navegar entre secciones se siente lento aunque nada esté mal.
 *
 * El patrón es "servir viejo mientras revalida": si hay algo guardado se
 * devuelve **en el mismo tick** —la pantalla aparece con datos, sin
 * parpadeo— y la petición sigue en segundo plano para corregir lo que haya
 * cambiado. La primera visita paga la espera completa; las siguientes no.
 *
 * ⚠️ Vive solo en memoria, a propósito: recargar la página lo vacía. Guardarlo
 * en `localStorage` obligaría a decidir cuándo caduca cada cosa y a lidiar con
 * datos viejos entre sesiones, para un panel donde recargar es raro. Además
 * evita dejar en disco datos de negocio.
 */

type Entrada = { datos: unknown; momento: number; enVuelo?: Promise<unknown> }

const cache = new Map<string, Entrada>()

/** Pasado este tiempo, lo guardado se considera viejo y se revalida. */
const FRESCO_MS = 30_000

/**
 * Descarta lo cacheado. Se llama tras crear, editar o borrar algo: sin esto,
 * volver a una pantalla mostraría el estado anterior al cambio que acabás de
 * hacer, que es peor que esperar.
 *
 * Sin argumento limpia todo; con un prefijo, solo lo que empiece así.
 */
export function invalidarCache(prefijo?: string) {
  if (!prefijo) {
    cache.clear()
    return
  }
  for (const clave of Array.from(cache.keys())) {
    if (clave.startsWith(prefijo)) cache.delete(clave)
  }
}

/**
 * `fetch` que recuerda. `onDatos` puede llamarse **dos veces**: primero con lo
 * cacheado y después con lo fresco. Es intencional — así la pantalla pinta al
 * instante y se corrige sola.
 */
export async function fetchConCache<T>(
  url: string,
  onDatos: (datos: T) => void
): Promise<void> {
  const guardado = cache.get(url)

  if (guardado) {
    onDatos(guardado.datos as T)
    const fresco = Date.now() - guardado.momento < FRESCO_MS
    // Si sigue fresco no se revalida: dentro de esa ventana, ir y volver entre
    // pestañas no genera tráfico ninguno.
    if (fresco) return
  }

  // Si ya hay una petición en curso para esta URL se reusa en vez de lanzar
  // otra: dos componentes que montan a la vez no deben pedir lo mismo dos veces.
  const enVuelo =
    guardado?.enVuelo ??
    fetchApi(url)
      .then((r) => r.json())
      .then((res) => {
        if (!res?.success) throw new Error(res?.error?.message || 'Error de red')
        cache.set(url, { datos: res.data, momento: Date.now() })
        return res.data
      })
      .catch((e) => {
        // Al fallar se borra la marca de "en vuelo" pero se CONSERVA lo
        // cacheado: si la red se cae, seguir mostrando lo último conocido es
        // mejor que vaciar la pantalla.
        const actual = cache.get(url)
        if (actual) cache.set(url, { datos: actual.datos, momento: actual.momento })
        throw e
      })

  if (guardado) cache.set(url, { ...guardado, enVuelo })

  const datos = await enVuelo
  onDatos(datos as T)
}

/**
 * Endpoint que cada pantalla pide al montar.
 *
 * Se usa para precargar al pasar el mouse por el enlace: para cuando el clic
 * ocurre, la respuesta ya viene en camino. Next ya precarga el CODIGO de la
 * ruta por su cuenta; lo que falta —y es lo que realmente se espera— son los
 * DATOS.
 *
 * Solo estan las pantallas cuya carga inicial es una sola peticion previsible.
 * Inventory y Catalog quedan fuera a proposito: arman su URL con filtros que
 * dependen del estado de la pantalla, asi que precargar una variante fija
 * calentaria una clave que despues nadie consulta.
 */
export const DATOS_POR_RUTA: Record<string, string> = {
  '/dashboard': '/api/dashboard',
  '/orders': '/api/orders',
  '/invoicing': '/api/invoicing',
  '/reporting': '/api/actividad?limit=100',
  '/profile': '/api/perfil',
}

/**
 * Calienta la cache de una ruta. Es deliberadamente silencioso: si falla, el
 * usuario ni se entera y la pantalla pedira de nuevo al montar.
 */
export function precargarRuta(ruta: string) {
  const url = DATOS_POR_RUTA[ruta]
  if (!url || cache.has(url)) return
  fetchConCache(url, () => {}).catch(() => {})
}
