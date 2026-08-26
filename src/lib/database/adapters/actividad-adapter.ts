import { SupabaseServiceClient } from '@/lib/api/client'

export type CategoriaActividad = 'datos' | 'sesion' | 'accion'

export interface RegistroActividad {
  id_registro: number
  fecha: string
  categoria: CategoriaActividad
  descripcion: string
  severidad: 'info' | 'alerta'
  tabla: string | null
  operacion: 'INSERT' | 'UPDATE' | 'DELETE' | null
  id_afectado: string | null
  usuario_email: string | null
}

export class ActividadAdapter {
  private client: SupabaseServiceClient

  constructor() {
    this.client = SupabaseServiceClient.getInstance()
  }

  /**
   * Bitácora paginada, lo último primero.
   *
   * El SP `list_actividad` (migración 20260826000000) ya acota el `limit` a 200
   * del lado de la base, así que un cliente que pida 10 000 filas no puede
   * arrastrar la tabla entera.
   */
  async list(
    categoria?: CategoriaActividad | null,
    limit = 50,
    offset = 0
  ): Promise<RegistroActividad[]> {
    const supabase = this.client.getClient()
    const { data, error } = await (supabase as any).rpc('list_actividad', {
      p_categoria: categoria ?? null,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) {
      console.error('[ActividadAdapter] error listando:', error)
      throw error
    }

    return (data || []) as RegistroActividad[]
  }
}
