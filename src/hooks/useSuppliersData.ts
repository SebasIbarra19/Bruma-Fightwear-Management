// ================================================
// 🔗 HOOK useSuppliersData - Patrón A
// Page → Hook → fetch("/api/suppliers") → Route Handler → Adapter → Supabase
// ================================================

import { useEffect, useState } from 'react';
import type { Supplier } from '@/lib/database/adapters/suppliers-adapter';

interface UseSuppliersDataOptions {
  projectId?: string;
  search?: string;
  onlyActive?: boolean;
}

interface UseSuppliersDataResult {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSuppliersData({
  projectId,
  search,
  onlyActive,
}: UseSuppliersDataOptions): UseSuppliersDataResult {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!projectId) {
      setError('No projectId provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ projectId });
    if (search) params.set('search', search);
    if (onlyActive) params.set('onlyActive', 'true');

    fetch(`/api/suppliers?${params}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setSuppliers(result.data);
        } else {
          setError(result.error || 'Error loading suppliers');
        }
      })
      .catch((err) => {
        setError(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId, search, onlyActive, refreshKey]);

  return { suppliers, loading, error, refetch };
}
