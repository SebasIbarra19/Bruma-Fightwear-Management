// ================================================
// 🏭 SUPPLIERS API ENDPOINT
// GET /api/suppliers - Lista proveedores con contacto principal
// ================================================

import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { SuppliersAdapter, ListSuppliersParams } from '@/lib/database/adapters/suppliers-adapter';

async function getSuppliersHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const params: ListSuppliersParams = {
    limit: parseInt(searchParams.get('limit') || '100', 10),
    offset: parseInt(searchParams.get('offset') || '0', 10),
    search: searchParams.get('search'),
  };

  const adapter = new SuppliersAdapter();
  const suppliers = await adapter.listSuppliers(params);
  
  return ApiResponse.success(suppliers);
}

export const GET = withErrorHandling(getSuppliersHandler);
