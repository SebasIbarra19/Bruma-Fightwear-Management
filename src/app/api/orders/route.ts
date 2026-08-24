import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { ValidationError } from '@/lib/api/error-handler';
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

interface CreateOrderItemInput {
  id_producto_talla: number;
  cantidad: number;
  precio_unitario: number;
}

async function postOrdersHandler(request: NextRequest) {
  const body = await request.json();
  const { cliente_nombre, cliente_email, cliente_telefono, cliente_instagram, id_estado, items } = body as {
    cliente_nombre?: string;
    cliente_email?: string;
    cliente_telefono?: string;
    cliente_instagram?: string;
    id_estado?: number;
    items?: CreateOrderItemInput[];
  };

  if (!cliente_nombre || !String(cliente_nombre).trim()) {
    throw new ValidationError('cliente_nombre es requerido');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('items debe tener al menos un producto');
  }

  const total = items.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0);

  const adapter = new OrdersAdapter();
  const order = await adapter.createOrder({
    id_estado: id_estado || 1,
    cliente_nombre,
    cliente_email,
    cliente_telefono,
    cliente_instagram,
    total,
  });

  for (const item of items) {
    await adapter.addOrderItem({
      id_pedido: order.id_pedido,
      id_producto_talla: item.id_producto_talla,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
    });
  }

  return ApiResponse.success(order);
}

export const GET = withErrorHandling(getOrdersHandler);
export const POST = withErrorHandling(postOrdersHandler);
