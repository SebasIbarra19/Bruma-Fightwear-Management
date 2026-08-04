import { NextRequest, NextResponse } from 'next/server';
import {
  listCatalogProducts,
  listCategoriesForFilter,
  listProductLinesForFilter,
  toggleCatalogProductStatus,
  deleteCatalogProduct,
  createCatalogProduct,
} from '@/lib/database/adapters/catalog-adapter';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId') ?? '';
  try {
    const [products, categories, productLines] = await Promise.all([
      listCatalogProducts(projectId),
      listCategoriesForFilter(projectId),
      listProductLinesForFilter(projectId),
    ]);
    return NextResponse.json({ data: products, categories, productLines });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, ...input } = await req.json();
    const data = await createCatalogProduct(projectId, input);
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
    await deleteCatalogProduct(id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
