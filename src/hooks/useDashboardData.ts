import { useEffect, useState } from 'react';
import type { DashboardStats } from '@/lib/database/adapters/dashboard-adapter';

interface UseDashboardDataResult {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(): UseDashboardDataResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setStats(result.data);
        else setError(result.error?.message || 'Error loading dashboard stats');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return { stats, loading, error, refetch };
}
