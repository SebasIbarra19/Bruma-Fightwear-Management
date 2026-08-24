import { NextRequest, NextResponse } from 'next/server';
import { createCatalogCollection } from '@/lib/database/adapters/catalog-adapter';

export async function POST(req: NextRequest) {
  try {
    const { nombre } = await req.json();
    if (!nombre || !String(nombre).trim()) {
      return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 });
    }
    const data = await createCatalogCollection(String(nombre).trim());
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
