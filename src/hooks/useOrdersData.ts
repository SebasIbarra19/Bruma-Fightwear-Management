import { useEffect, useState } from 'react';
import type { Order } from '@/lib/database/adapters/orders-adapter';

interface UseOrdersDataOptions {
  projectId: string;
  customerId?: string;
  status?: string;
  paymentStatus?: string;
  shippingStatus?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
}

interface UseOrdersDataResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

export function useOrdersData(options: UseOrdersDataOptions): UseOrdersDataResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!options.projectId) {
      setError('No projectId provided');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    fetch(`/api/orders?${params.toString()}`)
      .then(res => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setOrders(result.data);
        } else {
          setError(result.error || 'Error loading orders');
        }
      })
      .catch((err) => {
        setError(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [JSON.stringify(options)]);

  return { orders, loading, error };
}
