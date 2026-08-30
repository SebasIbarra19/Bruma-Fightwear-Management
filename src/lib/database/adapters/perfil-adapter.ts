import { SupabaseServiceClient } from '@/lib/api/client'

const AVATAR_BUCKET = 'avatars'

export interface Perfil {
  id_usuario: string
  email: string
  nombre_completo: string | null
  telefono: string | null
  avatar_url: string | null
  puesto: string | null
  preferencia_cinturon: string | null
  fecha_alta: string
  fecha_actualizacion: string | null
}

/** Campos editables. Omitir uno lo deja como está; mandar '' lo vacía. */
export interface PerfilEditable {
  nombre_completo?: string
  telefono?: string
  puesto?: string
  preferencia_cinturon?: string
  avatar_url?: string
}

function db() {
  return SupabaseServiceClient.getInstance().getClient()
}

/**
 * Perfil del usuario. Siempre devuelve una fila mientras la cuenta exista: el
 * SP hace `LEFT JOIN`, así que un usuario que nunca guardó nada llega con los
 * campos editables en null en vez de no llegar.
 */
export async function getPerfil(idUsuario: string): Promise<Perfil | null> {
  const { data, error } = await (db() as any).rpc('get_perfil', {
    p_id_usuario: idUsuario,
  })
  if (error) throw error
  return (data?.[0] as Perfil) ?? null
}

export async function upsertPerfil(
  idUsuario: string,
  campos: PerfilEditable
): Promise<void> {
  const { error } = await (db() as any).rpc('upsert_perfil', {
    p_id_usuario: idUsuario,
    p_nombre_completo: campos.nombre_completo ?? null,
    p_telefono: campos.telefono ?? null,
    p_avatar_url: campos.avatar_url ?? null,
    p_puesto: campos.puesto ?? null,
    p_preferencia_cinturon: campos.preferencia_cinturon ?? null,
  })
  if (error) throw error
}

/**
 * Sube el avatar y deja la URL pública en el perfil.
 *
 * Mismo patrón que `uploadProductImage` en catalog-adapter: el nombre lo genera
 * el servidor, porque el del archivo original puede traer rutas, acentos o
 * colisionar. Se guarda bajo una carpeta por usuario para que el bucket quede
 * ordenado y borrar una cuenta sea barrer un prefijo.
 *
 * Si el `upsert` falla se borra el archivo recién subido: sin eso quedaría
 * basura en el bucket que nadie referencia.
 */
export async function uploadAvatar(idUsuario: string, file: File): Promise<string> {
  const supabase = db()
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${idUsuario}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: upErr } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (upErr) throw upErr

  const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)

  try {
    await upsertPerfil(idUsuario, { avatar_url: pub.publicUrl })
  } catch (e) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path])
    throw e
  }

  return pub.publicUrl
}
