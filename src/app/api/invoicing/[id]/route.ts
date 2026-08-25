import { NextRequest } from 'next/server';
import { withErrorHandling, withAuth } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { ValidationError, NotFoundError } from '@/lib/api/error-handler';
import { InvoicingAdapter } from '@/lib/database/adapters/invoicing-adapter';

// Autenticada: lee cookies de sesion, asi que nunca puede prerenderizarse.
// Sin esto Next intenta hacerlo en el build y escupe 'Dynamic server usage'.
export const dynamic = 'force-dynamic';


async function getInvoiceHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw new ValidationError('id debe ser numérico');

  const adapter = new InvoicingAdapter();
  const detail = await adapter.getInvoiceDetail(id);
  if (!detail) throw new NotFoundError('Factura no encontrada');
  return ApiResponse.success(detail);
}

async function patchInvoiceHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw new ValidationError('id debe ser numérico');

  const body = await request.json();
  const adapter = new InvoicingAdapter();

  if (body.mark_paid === true) {
    const updated = await adapter.markPaid(id);
    return ApiResponse.success(updated);
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new ValidationError('items debe tener al menos una línea');
  }
  const descuentos = Array.isArray(body.descuentos) ? body.descuentos : [];
  // Se valida acá y no solo con el CHECK de la tabla: un tipo inválido que llega
  // hasta Postgres vuelve como 500 con la fila cruda en el detalle, en vez de un
  // 400 con un mensaje entendible.
  for (const d of descuentos) {
    if (d.tipo !== 'fijo' && d.tipo !== 'porcentaje') {
      throw new ValidationError(`Tipo de descuento inválido: "${d.tipo}". Debe ser "fijo" o "porcentaje".`);
    }
    if (typeof d.valor !== 'number' || isNaN(d.valor) || d.valor < 0) {
      throw new ValidationError('El valor del descuento debe ser un número mayor o igual a 0');
    }
  }
  const updated = await adapter.updateInvoice(id, body.items, descuentos, body.notas);
  return ApiResponse.success(updated);
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(withAuth(async (req: NextRequest) => {
    return getInvoiceHandler(req, context);
  }))(request);
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(withAuth(async (req: NextRequest) => {
    return patchInvoiceHandler(req, context);
  }))(request);
}
