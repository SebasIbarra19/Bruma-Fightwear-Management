import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/middleware';
import {
  listInventoryMovements,
  listInventoryItems,
} from '@/lib/database/adapters/inventory-movements-adapter';

// Autenticada: lee cookies de sesion, asi que nunca puede prerenderizarse.
// Sin esto Next intenta hacerlo en el build y escupe 'Dynamic server usage'.
export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  const includeItems = req.nextUrl.searchParams.get('includeItems') === 'true';
  try {
    const [movements, items] = await Promise.all([
      listInventoryMovements(),
      includeItems ? listInventoryItems() : Promise.resolve([]),
    ]);
    return NextResponse.json({ data: movements, inventoryItems: items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
