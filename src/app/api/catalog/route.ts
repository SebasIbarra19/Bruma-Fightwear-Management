import { NextRequest, NextResponse } from 'next/server';
import {
  listCatalogProducts,
  listCategoriesForFilter,
  listProductLinesForFilter,
  listCollectionsForFilter,
  toggleCatalogProductStatus,
  deleteCatalogProduct,
  createCatalogProductWithStock,
} from '@/lib/database/adapters/catalog-adapter';

export async function GET() {
  try {
    const [products, categories, productLines, collections] = await Promise.all([
      listCatalogProducts(),
      listCategoriesForFilter(),
      listProductLinesForFilter(),
      listCollectionsForFilter(),
    ]);
    return NextResponse.json({ data: products, categories, productLines, collections });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const data = await createCatalogProductWithStock(input);
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, is_active } = await req.json();
    await toggleCatalogProductStatus(id, is_active);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? '';
  try {
    await deleteCatalogProduct(Number(id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
