import { useEffect, useState } from 'react'

/**
 * Retrasa la aparición del esqueleto de carga.
 *
 * Los esqueletos no tienen duración fija: duran lo que tarde la petición. Con
 * datos ya cacheados eso puede ser un puñado de milisegundos, y entonces
 * aparecen y desaparecen en un parpadeo — que se percibe **peor** que una
 * pausa breve sin nada, porque el ojo registra el movimiento como un fallo.
 *
 * Devuelve `true` solo si la carga sigue en curso pasados `demoraMs`. Si
 * termina antes, el esqueleto nunca llega a mostrarse.
 *
 * 200 ms por defecto: es aproximadamente el umbral bajo el cual una espera se
 * percibe como respuesta inmediata, así que por debajo de eso no hace falta
 * avisar que algo está cargando.
 */
export function useEsqueletoDemorado(cargando: boolean, demoraMs = 200): boolean {
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    if (!cargando) {
      setMostrar(false)
      return
    }
    const t = setTimeout(() => setMostrar(true), demoraMs)
    return () => clearTimeout(t)
  }, [cargando, demoraMs])

  return mostrar
}
