import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { DashboardAdapter } from '@/lib/database/adapters/dashboard-adapter';

async function getDashboardHandler(_request: NextRequest) {
  const adapter = new DashboardAdapter();
  const stats = await adapter.getDashboardStats();
  return ApiResponse.success(stats);
}

export const GET = withErrorHandling(getDashboardHandler);
