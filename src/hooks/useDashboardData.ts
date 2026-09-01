import { useEffect, useState } from 'react';
import { fetchConCache, invalidarCache } from '@/lib/api/cache-cliente';
import type { DashboardPayload } from '@/lib/database/adapters/dashboard-adapter';

interface UseDashboardDataResult {
  data: DashboardPayload | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(): UseDashboardDataResult {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // `refetch` invalida antes de volver a pedir: si no, la caché devolvería lo
  // mismo que ya se está mostrando y el botón de recargar no haría nada.
  const refetch = () => {
    invalidarCache('/api/dashboard');
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    let vigente = true;
    setError(null);

    // `fetchConCache` puede llamar a `onDatos` DOS veces: primero con lo
    // cacheado —en el mismo tick, así volver al dashboard pinta al instante— y
    // después con lo fresco. Por eso `loading` se apaga en la primera: ya hay
    // algo que mostrar, y la revalidación no debe reabrir los esqueletos.
    fetchConCache<DashboardPayload>('/api/dashboard', (payload) => {
      if (!vigente) return;
      setData(payload);
      setLoading(false);
    })
      .catch((e) => {
        if (vigente) setError(e.message);
      })
      .finally(() => {
        if (vigente) setLoading(false);
      });

    return () => {
      vigente = false;
    };
  }, [refreshKey]);

  return { data, loading, error, refetch };
}
