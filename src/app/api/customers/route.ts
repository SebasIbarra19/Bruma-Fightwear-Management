import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { CustomersAdapter, ListCustomersParams } from '@/lib/database/adapters/customers-adapter';

async function getCustomersHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const params: ListCustomersParams = {
    limit: parseInt(searchParams.get('limit') || '50', 10),
    offset: parseInt(searchParams.get('offset') || '0', 10),
    search: searchParams.get('search'),
    solo_activos: searchParams.get('solo_activos') === 'true'
  };

  const adapter = new CustomersAdapter();
  const customers = await adapter.listCustomers(params);
  
  return ApiResponse.success(customers);
}

export const GET = withErrorHandling(getCustomersHandler);
