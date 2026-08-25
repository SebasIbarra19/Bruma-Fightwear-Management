import { NextRequest } from 'next/server';
import { withErrorHandling, withAuth } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { ValidationError } from '@/lib/api/error-handler';
import {
  listProductImages,
  uploadProductImage,
  deleteProductImage,
  setPrimaryProductImage,
} from '@/lib/database/adapters/catalog-adapter';

// Autenticada: lee cookies de sesion, asi que nunca puede prerenderizarse.
export const dynamic = 'force-dynamic';

/**
 * Imágenes de un producto.
 *
 * La subida pasa por acá y no directo del browser al bucket a propósito: el
 * bucket solo acepta escrituras con `service_role`, que vive en el servidor. Así
 * la anon key —que viaja en el bundle— no sirve para llenarlo.
 */

const MAX_BYTES = 5 * 1024 * 1024; // Mismo tope que el bucket.
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

function parseId(raw: string): number {
  const id = parseInt(raw, 10);
  if (isNaN(id)) throw new ValidationError('id debe ser numérico');
  return id;
}

async function getHandler(_req: NextRequest, ctx: { params: { id: string } }) {
  return ApiResponse.success(await listProductImages(parseId(ctx.params.id)));
}

async function postHandler(req: NextRequest, ctx: { params: { id: string } }) {
  const productId = parseId(ctx.params.id);

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    throw new ValidationError('Se esperaba un archivo en el campo "file"');
  }

  // Se valida acá además del bucket para dar un mensaje claro en vez del error
  // crudo de Storage, y para no gastar la transferencia en subir algo inválido.
  if (!TIPOS.includes(file.type)) {
    throw new ValidationError(`Tipo no permitido: ${file.type || 'desconocido'}. Se aceptan JPEG, PNG, WebP y AVIF.`);
  }
  if (file.size > MAX_BYTES) {
    throw new ValidationError(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es 5 MB.`);
  }

  // La primera imagen de un producto queda como principal sin que nadie lo pida.
  const yaTiene = (await listProductImages(productId)).length > 0;
  const isPrimary = form.get('is_primary') === 'true' || !yaTiene;

  return ApiResponse.success(await uploadProductImage(productId, file, isPrimary));
}

async function deleteHandler(req: NextRequest, _ctx: { params: { id: string } }) {
  const imageId = req.nextUrl.searchParams.get('imageId');
  if (!imageId) throw new ValidationError('Falta el parámetro imageId');
  await deleteProductImage(parseId(imageId));
  return ApiResponse.success({ deleted: true });
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(withAuth(async (req: NextRequest) => getHandler(req, context)))(request);
}

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(withAuth(async (req: NextRequest) => postHandler(req, context)))(request);
}

async function patchHandler(req: NextRequest, _ctx: { params: { id: string } }) {
  const imageId = req.nextUrl.searchParams.get('imageId');
  if (!imageId) throw new ValidationError('Falta el parámetro imageId');
  await setPrimaryProductImage(parseId(imageId));
  return ApiResponse.success({ updated: true });
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(withAuth(async (req: NextRequest) => deleteHandler(req, context)))(request);
}

/** Marca una imagen existente como portada. */
export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(withAuth(async (req: NextRequest) => patchHandler(req, context)))(request);
}
