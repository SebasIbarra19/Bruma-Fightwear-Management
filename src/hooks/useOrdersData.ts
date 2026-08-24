import { useEffect, useState } from 'react';
import type { Order } from '@/lib/database/adapters/orders-adapter';

interface UseOrdersDataOptions {
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

interface OrderStatus {
  id_estado: number;
  nombre: string;
}

interface UseOrdersDataResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createOrder: (payload: { cliente_nombre: string; cliente_email?: string; cliente_telefono?: string; cliente_instagram?: string; id_estado: number; items: { id_producto_talla: number; cantidad: number; precio_unitario: number }[] }) => Promise<void>;
  statuses: OrderStatus[];
  updateStatus: (orderId: number, statusId: number) => Promise<void>;
}

export function useOrdersData(options: UseOrdersDataOptions = {}): UseOrdersDataResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const createOrder = async (payload: {
    cliente_nombre: string;
    cliente_email?: string;
    cliente_telefono?: string;
    cliente_instagram?: string;
    id_estado: number;
    items: { id_producto_talla: number; cantidad: number; precio_unitario: number }[];
  }) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error?.message || 'Error al crear el pedido');
    refetch();
  };

  const updateStatus = async (orderId: number, statusId: number) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_estado: statusId }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error?.message || 'Error al actualizar el estado');
    refetch();
  };

  useEffect(() => {
    fetch('/api/orders/statuses')
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) setStatuses(result.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
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
          setError(result.error?.message || 'Error loading orders');
        }
      })
      .catch((err) => {
        setError(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [JSON.stringify(options), refreshKey]);

  return { orders, loading, error, refetch, createOrder, statuses, updateStatus };
}
