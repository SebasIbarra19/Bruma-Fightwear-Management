import { withErrorHandling, withAuth } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { OrdersAdapter } from '@/lib/database/adapters/orders-adapter';

// Autenticada: lee cookies de sesion, asi que nunca puede prerenderizarse.
// Sin esto Next intenta hacerlo en el build y escupe 'Dynamic server usage'.
export const dynamic = 'force-dynamic';


async function getStatusesHandler() {
  const adapter = new OrdersAdapter();
  const statuses = await adapter.listStatuses();
  return ApiResponse.success(statuses);
}

export const GET = withErrorHandling(withAuth(getStatusesHandler));
