import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { ValidationError } from '@/lib/api/error-handler';
import { InvoicingAdapter } from '@/lib/database/adapters/invoicing-adapter';

async function getInvoicesHandler(request: NextRequest) {
  const idPedidoParam = request.nextUrl.searchParams.get('id_pedido');
  const idPedido = idPedidoParam ? parseInt(idPedidoParam, 10) : undefined;

  const adapter = new InvoicingAdapter();
  const invoices = await adapter.listInvoices(idPedido);
  return ApiResponse.success(invoices);
}

async function postInvoiceHandler(request: NextRequest) {
  const body = await request.json();
  const idPedido = parseInt(body.id_pedido, 10);
  if (isNaN(idPedido)) throw new ValidationError('id_pedido es requerido y debe ser numérico');
  const diasVencimiento = body.dias_vencimiento ? parseInt(body.dias_vencimiento, 10) : 14;

  const adapter = new InvoicingAdapter();
  const invoice = await adapter.createFromOrder(idPedido, diasVencimiento);
  return ApiResponse.success(invoice);
}

export const GET = withErrorHandling(getInvoicesHandler);
export const POST = withErrorHandling(postInvoiceHandler);
