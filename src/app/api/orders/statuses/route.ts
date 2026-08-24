import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { OrdersAdapter } from '@/lib/database/adapters/orders-adapter';

async function getStatusesHandler() {
  const adapter = new OrdersAdapter();
  const statuses = await adapter.listStatuses();
  return ApiResponse.success(statuses);
}

export const GET = withErrorHandling(getStatusesHandler);
