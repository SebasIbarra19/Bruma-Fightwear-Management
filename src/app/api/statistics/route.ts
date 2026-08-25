import { NextRequest } from 'next/server';
import { withErrorHandling, withAuth } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { ValidationError } from '@/lib/api/error-handler';
import { DashboardAdapter } from '@/lib/database/adapters/dashboard-adapter';

// Autenticada: lee cookies de sesion, asi que nunca puede prerenderizarse.
// Sin esto Next intenta hacerlo en el build y escupe 'Dynamic server usage'.
export const dynamic = 'force-dynamic';

/** El SP espera `date`, no timestamp. Se valida el formato antes de mandarlo. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

async function getStatisticsHandler(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const start = params.get('start') ?? undefined;
  const end = params.get('end') ?? undefined;

  for (const [nombre, valor] of [['start', start], ['end', end]] as const) {
    if (valor && !ISO_DATE.test(valor)) {
      throw new ValidationError(`${nombre} debe tener formato YYYY-MM-DD`);
    }
  }

  if (start && end && start > end) {
    throw new ValidationError('start no puede ser posterior a end');
  }

  const adapter = new DashboardAdapter();
  const payload = await adapter.getStatisticsPayload(start, end);
  return ApiResponse.success(payload);
}

export const GET = withErrorHandling(withAuth(getStatisticsHandler));
