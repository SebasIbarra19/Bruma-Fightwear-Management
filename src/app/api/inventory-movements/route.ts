import { NextRequest, NextResponse } from 'next/server';
import {
  listInventoryMovements,
  listInventoryItems,
} from '@/lib/database/adapters/inventory-movements-adapter';

export async function GET(req: NextRequest) {
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
