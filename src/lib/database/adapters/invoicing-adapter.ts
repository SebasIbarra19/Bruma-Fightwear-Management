import { SupabaseServiceClient } from '@/lib/api/client';
import { DatabaseError, ValidationError } from '@/lib/api/error-handler';

// Postgres `RAISE EXCEPTION` (código P0001) es cómo las stored procedures
// expresan reglas de negocio (ej. "este pedido ya tiene una factura"). Son
// errores del usuario, no fallas del servidor: se convierten en ValidationError
// para que salgan como 400 con su mensaje real, en vez de un 500 genérico que
// esconde el motivo bajo "Database error occurred".
function throwRpcError(error: any, fallbackMessage: string): never {
  if (error?.code === 'P0001' && error?.message) {
    throw new ValidationError(error.message);
  }
  throw new DatabaseError(fallbackMessage, { originalError: error });
}

export interface InvoiceListItem {
  id_factura: number;
  numero_factura: string;
  id_pedido: number;
  cliente_nombre: string | null;
  cliente_email: string | null;
  fecha_emision: string;
  fecha_vencimiento: string;
  total: number;
  estado: string;
  estado_calculado: string;
}

export interface InvoiceItem {
  id_item: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  orden: number;
}

export type DiscountKind = 'fijo' | 'porcentaje';

export interface InvoiceDiscount {
  id_descuento: number;
  descripcion: string;
  tipo: DiscountKind;
  /** Para 'fijo' es el monto; para 'porcentaje' es el porcentaje (ej. 10 = 10%). */
  valor: number;
  /** Monto ya calculado por la base de datos contra el subtotal actual. */
  monto: number;
  orden: number;
}

export interface InvoiceDetail {
  factura: {
    id_factura: number;
    numero_factura: string;
    id_pedido: number;
    fecha_emision: string;
    fecha_vencimiento: string;
    subtotal: number;
    descuento: number;
    iva: number;
    total: number;
    estado: string;
    estado_calculado: string;
    notas: string | null;
    cliente_nombre: string | null;
    cliente_email: string | null;
    cliente_telefono: string | null;
  };
  items: InvoiceItem[];
  descuentos: InvoiceDiscount[];
}

const db = () => SupabaseServiceClient.getInstance().getClient();

export class InvoicingAdapter {
  async listInvoices(idPedido?: number): Promise<InvoiceListItem[]> {
    const { data, error } = await (db() as any).rpc('list_invoices', {
      p_limit: 100,
      p_offset: 0,
      p_id_pedido: idPedido ?? null,
    });
    if (error) throwRpcError(error, 'Failed to list invoices');
    return data ?? [];
  }

  async getInvoiceDetail(id: number): Promise<InvoiceDetail | null> {
    const { data, error } = await (db() as any).rpc('get_invoice_detail', { p_id_factura: id });
    if (error) throwRpcError(error, 'Failed to get invoice detail');
    return data ?? null;
  }

  async createFromOrder(idPedido: number, diasVencimiento: number = 14): Promise<InvoiceDetail> {
    const { data, error } = await (db() as any).rpc('create_invoice_from_order', {
      p_id_pedido: idPedido,
      p_dias_vencimiento: diasVencimiento,
    });
    if (error) throwRpcError(error, 'Failed to create invoice');
    return data;
  }

  async updateInvoice(
    id: number,
    items: { descripcion: string; cantidad: number; precio_unitario: number }[],
    descuentos: { descripcion: string; tipo: DiscountKind; valor: number }[],
    notas?: string
  ): Promise<InvoiceDetail> {
    const { data, error } = await (db() as any).rpc('update_invoice', {
      p_id_factura: id,
      p_items: items,
      p_descuentos: descuentos,
      p_notas: notas ?? null,
    });
    if (error) throwRpcError(error, 'Failed to update invoice');
    return data;
  }

  async markPaid(id: number): Promise<InvoiceDetail> {
    const { data, error } = await (db() as any).rpc('mark_invoice_paid', { p_id_factura: id });
    if (error) throwRpcError(error, 'Failed to mark invoice as paid');
    return data;
  }
}
