import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { OrdersAdapter, ListOrdersParams } from '@/lib/database/adapters/orders-adapter';

async function getOrdersHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const params: ListOrdersParams = {
    id_cliente: searchParams.has('id_cliente') ? parseInt(searchParams.get('id_cliente')!, 10) : undefined,
    id_estado: searchParams.has('id_estado') ? parseInt(searchParams.get('id_estado')!, 10) : undefined,
    start_date: searchParams.get('start_date'),
    end_date: searchParams.get('end_date'),
    min_amount: searchParams.has('min_amount') ? parseFloat(searchParams.get('min_amount')!) : undefined,
    max_amount: searchParams.has('max_amount') ? parseFloat(searchParams.get('max_amount')!) : undefined,
    search: searchParams.get('search'),
    limit: parseInt(searchParams.get('limit') || '50', 10),
    offset: parseInt(searchParams.get('offset') || '0', 10),
  };

  const adapter = new OrdersAdapter();
  const orders = await adapter.listOrders(params);
  
  return ApiResponse.success(orders);
}

export const GET = withErrorHandling(getOrdersHandler);
