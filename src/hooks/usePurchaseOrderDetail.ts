// ================================================
// 🔗 HOOK usePurchaseOrderDetail - Patrón A
// ================================================

import { useEffect, useState } from 'react';
import type {
  PurchaseOrderDetail,
  AddItemInput,
  UpdateItemInput,
} from '@/lib/database/adapters/purchase-order-detail-adapter';

interface UsePurchaseOrderDetailResult {
  order: PurchaseOrderDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addItem: (input: Omit<AddItemInput, 'purchase_order_id'>) => Promise<void>;
  updateItem: (itemId: string, updates: UpdateItemInput) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
}

export function usePurchaseOrderDetail(
  orderId: string,
  projectId: string
): UsePurchaseOrderDetailResult {
  const [order, setOrder] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!orderId || !projectId) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    fetch(`/api/purchase-orders/${orderId}?projectId=${projectId}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.error) setError(result.error);
        else setOrder(result.data ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orderId, projectId, refreshKey]);

  const addItem = async (input: Omit<AddItemInput, 'purchase_order_id'>) => {
    const res = await fetch(`/api/purchase-orders/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, purchase_order_id: orderId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? 'Error adding item');
    }
    refetch();
  };

  const updateItem = async (itemId: string, updates: UpdateItemInput) => {
    const res = await fetch(`/api/purchase-orders/${orderId}?itemId=${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? 'Error updating item');
    }
    refetch();
  };

  const deleteItem = async (itemId: string) => {
    const res = await fetch(`/api/purchase-orders/${orderId}?itemId=${itemId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? 'Error deleting item');
    }
    refetch();
  };

  return { order, loading, error, refetch, addItem, updateItem, deleteItem };
}
