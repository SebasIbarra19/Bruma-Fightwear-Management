// ================================================
// 🔗 HOOK useProductLinesData - Patrón A
// ================================================

import { useEffect, useState } from 'react';
import type { ProductLine } from '@/lib/database/adapters/product-lines-adapter';

interface UseProductLinesDataResult {
  lines: ProductLine[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  toggleStatus: (id: number, currentStatus: boolean) => Promise<void>;
  deleteLine: (id: number) => Promise<void>;
}

export function useProductLinesData(projectId: string): UseProductLinesDataResult {
  const [lines, setLines] = useState<ProductLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    fetch(`/api/product-lines?projectId=${projectId}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.error) setError(result.error);
        else setLines(result.data ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, refreshKey]);

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    // Note: coleccion doesn't have active in new schema
    console.warn('Coleccion does not support active status');
  };

  const deleteLine = async (id: number) => {
    await fetch(`/api/product-lines?id=${id}`, { method: 'DELETE' });
    setLines((prev) => prev.filter((l) => l.id_coleccion !== id));
  };

  return { lines, loading, error, refetch, toggleStatus, deleteLine };
}
