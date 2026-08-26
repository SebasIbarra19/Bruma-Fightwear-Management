import { SupabaseServiceClient } from '@/lib/api/client'
import { getSessionUser } from '@/lib/api/middleware'

type Severidad = 'info' | 'alerta'

/**
 * Registra en la bitácora una acción que **ningún trigger puede ver**.
 *
 * Los triggers de `20260826000000` cubren los cambios de las 6 tablas del
 * núcleo. Quedan fuera de su alcance, por construcción, dos clases de evento:
 * las lecturas (descargar un PDF no modifica ninguna fila) y el *cómo* de un
 * cambio (el trigger ve el stock nuevo, no que se salteó la guarda de
 * negativos). Eso es lo que se registra acá.
 *
 * Deliberadamente NO se duplica lo que los triggers ya cubren —factura pagada,
 * producto borrado, cambio de estado de pedido—: la bitácora vale por lo que
 * deja ver, y duplicar entierra lo importante bajo ruido.
 *
 * A diferencia de las filas que escriben los triggers, estas **sí nacen
 * diciendo quién**: acá la sesión todavía existe. `getSessionUser` está
 * memoizado por request, así que preguntarlo no cuesta un viaje extra.
 *
 * Nunca lanza: una bitácora que tumba la operación que registra es peor que
 * una bitácora incompleta. Si falla, deja rastro en el log del servidor.
 */
export async function registrarAccion(
  descripcion: string,
  severidad: Severidad = 'info'
): Promise<void> {
  try {
    const user = await getSessionUser()
    const supabase = SupabaseServiceClient.getInstance().getClient()

    const { error } = await (supabase as any).rpc('registrar_evento', {
      p_categoria: 'accion',
      p_descripcion: descripcion,
      p_severidad: severidad,
      p_id_usuario: user?.id ?? null,
      p_email: user?.email ?? null,
    })

    if (error) console.error('[actividad] no se pudo registrar:', error.message)
  } catch (e) {
    console.error('[actividad] no se pudo registrar:', e)
  }
}
