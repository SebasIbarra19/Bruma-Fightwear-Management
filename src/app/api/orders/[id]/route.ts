import { NextRequest } from 'next/server';
import { withErrorHandling, withAuth } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { OrdersAdapter } from '@/lib/database/adapters/orders-adapter';
import { ValidationError } from '@/lib/api/error-handler';

// Autenticada: lee cookies de sesion, asi que nunca puede prerenderizarse.
// Sin esto Next intenta hacerlo en el build y escupe 'Dynamic server usage'.
export const dynamic = 'force-dynamic';


async function getOrderDetailHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw new ValidationError('id debe ser numérico');

  const adapter = new OrdersAdapter();
  const detail = await adapter.getOrderDetails(id);
  return ApiResponse.success(detail);
}

async function patchOrderStatusHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw new ValidationError('id debe ser numérico');

  const body = await request.json();
  const statusId = parseInt(body.id_estado, 10);
  if (isNaN(statusId)) throw new ValidationError('id_estado es requerido y debe ser numérico');

  const adapter = new OrdersAdapter();
  await adapter.updateOrderStatus(id, statusId);
  return ApiResponse.success({ id_estado: statusId });
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(withAuth(async (req: NextRequest) => {
    return getOrderDetailHandler(req, context)
  }))(request)
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(withAuth(async (req: NextRequest) => {
    return patchOrderStatusHandler(req, context)
  }))(request)
}
