import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { ValidationError, NotFoundError } from '@/lib/api/error-handler';
import {
  getCatalogProductDetail,
  updateCatalogProductFull,
} from '@/lib/database/adapters/catalog-adapter';

async function getCatalogProductHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw new ValidationError('id debe ser numérico');
  const data = await getCatalogProductDetail(id);
  if (!data) throw new NotFoundError('Producto no encontrado');
  return ApiResponse.success(data);
}

async function patchCatalogProductHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw new ValidationError('id debe ser numérico');
  const input = await request.json();
  const data = await updateCatalogProductFull(id, input);
  return ApiResponse.success(data);
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(async (req: NextRequest) => {
    return getCatalogProductHandler(req, context);
  })(request);
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(async (req: NextRequest) => {
    return patchCatalogProductHandler(req, context);
  })(request);
}
