import { NextRequest, NextResponse } from 'next/server';
import { createCatalogCollection } from '@/lib/database/adapters/catalog-adapter';
import { requireAuth } from '@/lib/api/middleware';

// Autenticada: lee cookies de sesion, asi que nunca puede prerenderizarse.
// Sin esto Next intenta hacerlo en el build y escupe 'Dynamic server usage'.
export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

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
