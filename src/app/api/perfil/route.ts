import { NextRequest } from 'next/server'
import { withErrorHandling, withAuth, getSessionUser } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response-builder'
import { ValidationError, AuthenticationError } from '@/lib/api/error-handler'
import { getPerfil, upsertPerfil, uploadAvatar } from '@/lib/database/adapters/perfil-adapter'

// Autenticada: lee cookies de sesión, así que nunca puede prerenderizarse.
export const dynamic = 'force-dynamic'

const CINTURONES = ['white', 'blue', 'purple', 'brown', 'black']
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const TIPOS_AVATAR = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/**
 * El id NUNCA viene del cliente: sale de la sesión.
 *
 * Si se aceptara por body o query, cualquier usuario autenticado podría leer o
 * pisar el perfil de otro con solo cambiar un uuid. Hoy hay una sola cuenta,
 * pero eso es una circunstancia, no una garantía.
 */
async function idDeLaSesion(): Promise<string> {
  const user = await getSessionUser()
  if (!user) throw new AuthenticationError('No autenticado')
  return user.id
}

async function getHandler(_request: NextRequest) {
  const perfil = await getPerfil(await idDeLaSesion())
  if (!perfil) throw new ValidationError('El usuario de la sesión ya no existe')
  return ApiResponse.success(perfil)
}

async function patchHandler(request: NextRequest) {
  const idUsuario = await idDeLaSesion()
  const contentType = request.headers.get('content-type') || ''

  // Subida de avatar: multipart. El resto del perfil viaja como JSON.
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const file = form.get('avatar')
    if (!(file instanceof File)) throw new ValidationError('Falta el archivo "avatar"')
    if (file.size > MAX_AVATAR_BYTES) {
      throw new ValidationError('El avatar no puede pesar más de 2 MB')
    }
    if (!TIPOS_AVATAR.includes(file.type)) {
      throw new ValidationError(`Formato no admitido: ${TIPOS_AVATAR.join(', ')}`)
    }
    const url = await uploadAvatar(idUsuario, file)
    return ApiResponse.success({ avatar_url: url })
  }

  const body = await request.json()

  if (
    body.preferencia_cinturon &&
    !CINTURONES.includes(String(body.preferencia_cinturon))
  ) {
    throw new ValidationError(`preferencia_cinturon debe ser: ${CINTURONES.join(', ')}`)
  }
  // Se acotan al ancho de columna acá además del CHECK de la base: así el
  // usuario recibe un mensaje claro en vez de un error de Postgres crudo.
  if (body.nombre_completo && String(body.nombre_completo).length > 80) {
    throw new ValidationError('El nombre no puede pasar de 80 caracteres')
  }
  if (body.telefono && String(body.telefono).length > 20) {
    throw new ValidationError('El teléfono no puede pasar de 20 caracteres')
  }
  if (body.puesto && String(body.puesto).length > 60) {
    throw new ValidationError('El puesto no puede pasar de 60 caracteres')
  }

  await upsertPerfil(idUsuario, {
    nombre_completo: body.nombre_completo,
    telefono: body.telefono,
    puesto: body.puesto,
    preferencia_cinturon: body.preferencia_cinturon,
  })

  const perfil = await getPerfil(idUsuario)
  return ApiResponse.success(perfil)
}

export const GET = withErrorHandling(withAuth(getHandler))
export const PATCH = withErrorHandling(withAuth(patchHandler))
