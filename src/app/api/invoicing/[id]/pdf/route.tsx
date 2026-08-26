import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicingAdapter } from "@/lib/database/adapters/invoicing-adapter";
import { InvoicePdfDocument } from "@/components/invoicing/InvoicePdfDocument";
import { requireAuth } from '@/lib/api/middleware';
import { registrarAccion } from '@/lib/api/actividad';

// Next cachea los GET de route handlers por defecto. Sin esto, editar una factura
// y volver a descargar el PDF devuelve la versión vieja (verificado: el PDF seguía
// mostrando los items y totales previos tras un PATCH). Una factura es un documento
// financiero: siempre debe generarse contra el estado actual.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAuth();
  if (denied) return denied;

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, error: { message: "id debe ser numérico" } }, { status: 400 });
  }

  const adapter = new InvoicingAdapter();
  const detail = await adapter.getInvoiceDetail(id);
  if (!detail) {
    return NextResponse.json({ success: false, error: { message: "Factura no encontrada" } }, { status: 404 });
  }

  const buffer = await renderToBuffer(<InvoicePdfDocument detail={detail} />);

  // Se registra DESPUÉS de generar el PDF: si el render falla, no hubo descarga
  // que registrar. Ningún trigger puede ver esto — es una lectura, no cambia
  // ninguna fila.
  await registrarAccion(
    `Se descargó el PDF de la factura ${detail.factura.numero_factura}`
  );

  // renderToBuffer devuelve un Buffer de Node; las definiciones de tipos actuales
  // no lo aceptan como BodyInit, así que se envuelve en Uint8Array (Buffer ya lo es
  // en runtime, esto solo satisface al compilador).
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${detail.factura.numero_factura}.pdf"`,
    },
  });
}
