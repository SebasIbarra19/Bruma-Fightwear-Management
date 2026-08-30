import { fetchApi } from '@/lib/api/fetch-cliente'
import { useEffect, useState } from 'react';
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

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchApi('/api/dashboard')
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setData(result.data);
        else setError(result.error?.message || 'Error loading dashboard stats');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return { data, loading, error, refetch };
}
