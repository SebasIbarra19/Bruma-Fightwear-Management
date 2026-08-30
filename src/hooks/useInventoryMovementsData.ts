// ================================================
// 🔗 HOOK useInventoryMovementsData - Patrón A
// ================================================

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api/fetch-cliente';
import type {
  MovementWithInventory,
} from '@/lib/database/adapters/inventory-movements-adapter';

interface UseInventoryMovementsDataResult {
  movements: MovementWithInventory[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useInventoryMovementsData(): UseInventoryMovementsDataResult {
  const [movements, setMovements] = useState<MovementWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchApi(`/api/inventory-movements`)
      .then((r) => r.json())
      .then((result) => {
        if (result.error) setError(result.error);
        else {
          setMovements(result.data ?? []);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return { movements, loading, error, refetch };
}
