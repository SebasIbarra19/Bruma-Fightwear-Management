import { NextRequest, NextResponse } from 'next/server';
import { createCatalogCategory } from '@/lib/database/adapters/catalog-adapter';

export async function POST(req: NextRequest) {
  try {
    const { nombre, prefijo } = await req.json();
    if (!nombre || !String(nombre).trim()) {
      return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 });
    }
    // Opcional. Si viene, se acota a 3 alfanuméricos: es el ancho de la columna
    // y el formato que espera `next_product_code`.
    const prefijoLimpio = prefijo
      ? String(prefijo).replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()
      : undefined;
    const data = await createCatalogCategory(String(nombre).trim(), prefijoLimpio);
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
