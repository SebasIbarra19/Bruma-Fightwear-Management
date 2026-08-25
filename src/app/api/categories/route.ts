// ================================================
// 📂 CATEGORIES API ENDPOINT
// GET    /api/categories          - Lista categorías con filtros
// GET    /api/categories?id=...   - Obtiene una categoría por ID
// POST   /api/categories          - Crea nueva categoría
// PATCH  /api/categories          - Actualiza una categoría
// ================================================

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, withAuth } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { CategoriesAdapter, CreateCategoryParams, UpdateCategoryParams } from '@/lib/database/adapters/categories-adapter';
import { ValidationError } from '@/lib/api/error-handler';

// Autenticada: lee cookies de sesion, asi que nunca puede prerenderizarse.
// Sin esto Next intenta hacerlo en el build y escupe 'Dynamic server usage'.
export const dynamic = 'force-dynamic';


async function getCategoriesHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const adapter = new CategoriesAdapter();

  const id = searchParams.get('id');
  if (id) {
    const category = await adapter.getCategoryById(parseInt(id, 10));
    return ApiResponse.success(category);
  }

  const params = {
    limit: parseInt(searchParams.get('limit') || '100', 10),
    offset: parseInt(searchParams.get('offset') || '0', 10),
    search: searchParams.get('search'),
  };
  const categories = await adapter.listCategories(params);
  return ApiResponse.success(categories);
}

async function createCategoryHandler(request: NextRequest) {
  const body = await request.json();
  const params: CreateCategoryParams = {
    nombre: body.nombre,
    codigo: body.codigo,
  };

  if (!params.nombre) {
    throw new ValidationError('El campo nombre es requerido');
  }

  const adapter = new CategoriesAdapter();
  const newCategory = await adapter.createCategory(params);
  return ApiResponse.success(newCategory, 201);
}

async function updateCategoryHandler(request: NextRequest) {
  const body = await request.json();
  const id = body.id;
  if (!id) {
    throw new ValidationError('El campo id es requerido para actualizar');
  }

  const params: UpdateCategoryParams = {
    nombre: body.nombre,
    codigo: body.codigo,
  };

  const adapter = new CategoriesAdapter();
  const updatedCategory = await adapter.updateCategory(id, params);
  return ApiResponse.success(updatedCategory);
}

export const GET = withErrorHandling(withAuth(getCategoriesHandler));
export const POST = withErrorHandling(withAuth(createCategoryHandler));
export const PATCH = withErrorHandling(withAuth(updateCategoryHandler));
