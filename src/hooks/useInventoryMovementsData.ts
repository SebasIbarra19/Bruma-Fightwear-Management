// ================================================
// 🔗 HOOK useInventoryMovementsData - Patrón A
// ================================================

import { useEffect, useState } from 'react';
import type {
  MovementWithInventory,
  InventoryItemForFilter,
} from '@/lib/database/adapters/inventory-movements-adapter';

interface UseInventoryMovementsDataResult {
  movements: MovementWithInventory[];
  inventoryItems: InventoryItemForFilter[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useInventoryMovementsData(
  projectId: string
): UseInventoryMovementsDataResult {
  const [movements, setMovements] = useState<MovementWithInventory[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemForFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    fetch(`/api/inventory-movements?projectId=${projectId}&includeItems=true`)
      .then((r) => r.json())
      .then((result) => {
        if (result.error) setError(result.error);
        else {
          setMovements(result.data ?? []);
          setInventoryItems(result.inventoryItems ?? []);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, refreshKey]);

  return { movements, inventoryItems, loading, error, refetch };
}
