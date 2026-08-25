import { NextRequest } from 'next/server';
import { withErrorHandling, withAuth } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { DashboardAdapter } from '@/lib/database/adapters/dashboard-adapter';

// Autenticada: lee cookies de sesion, asi que nunca puede prerenderizarse.
// Sin esto Next intenta hacerlo en el build y escupe 'Dynamic server usage'.
export const dynamic = 'force-dynamic';


async function getDashboardHandler(_request: NextRequest) {
  const adapter = new DashboardAdapter();
  const stats = await adapter.getDashboardStats();
  return ApiResponse.success(stats);
}

export const GET = withErrorHandling(withAuth(getDashboardHandler));
