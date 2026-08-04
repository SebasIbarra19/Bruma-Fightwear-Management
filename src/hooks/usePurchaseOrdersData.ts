// ================================================
// 🔗 HOOK usePurchaseOrdersData - Patrón A
// Page → Hook → fetch("/api/purchase-orders") → Route Handler → Adapter → Supabase
// ================================================

import { useEffect, useState } from 'react';
import type { PurchaseOrderWithSupplier } from '@/lib/database/adapters/purchase-orders-adapter';

interface UsePurchaseOrdersDataOptions {
  projectId: string;
  status?: string;
  supplierId?: string;
  search?: string;
}

interface UsePurchaseOrdersDataResult {
  purchaseOrders: PurchaseOrderWithSupplier[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePurchaseOrdersData({
  projectId,
  status,
  supplierId,
  search,
}: UsePurchaseOrdersDataOptions): UsePurchaseOrdersDataResult {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithSupplier[]>([]);
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
    if (status) params.set('status', status);
    if (supplierId) params.set('supplierId', supplierId);
    if (search) params.set('search', search);

    fetch(`/api/purchase-orders?${params}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setPurchaseOrders(result.data);
        } else {
          setError(result.error || 'Error loading purchase orders');
        }
      })
      .catch((err) => {
        setError(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId, status, supplierId, search, refreshKey]);

  return { purchaseOrders, loading, error, refetch };
}
