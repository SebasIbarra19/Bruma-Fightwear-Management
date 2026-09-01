import { fetchApi } from '@/lib/api/fetch-cliente'
import { fetchConCache, invalidarCache } from '@/lib/api/cache-cliente'
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

  // Invalida antes de volver a pedir. Sin esto, crear un pedido o cambiar un
  // estado repintaria la lista con lo cacheado de hace un segundo — o sea, sin
  // el cambio que acaba de hacerse.
  const refetch = () => {
    invalidarCache('/api/orders');
    setRefreshKey((k) => k + 1);
  };

  const createOrder = async (payload: {
    cliente_nombre: string;
    cliente_email?: string;
    cliente_telefono?: string;
    cliente_instagram?: string;
    id_estado: number;
    items: { id_producto_talla: number; cantidad: number; precio_unitario: number }[];
  }) => {
    const res = await fetchApi('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error?.message || 'Error al crear el pedido');
    refetch();
  };

  const updateStatus = async (orderId: number, statusId: number) => {
    const res = await fetchApi(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_estado: statusId }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error?.message || 'Error al actualizar el estado');
    refetch();
  };

  useEffect(() => {
    // Tabla de consulta: los estados no cambian entre pantallas, asi que
    // pedirlos en cada montaje era la ultima peticion que quedaba disparandose
    // siempre. Se ignora el error a proposito: sin estados la pantalla sigue
    // sirviendo, solo se queda sin el selector.
    fetchConCache<OrderStatus[]>('/api/orders/statuses', (filas) => {
      if (Array.isArray(filas)) setStatuses(filas);
    }).catch(() => {});
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
    // Sin filtros la URL queda `/api/orders`, no `/api/orders?`: la cache se
    // indexa por URL y esa interrogacion suelta era una clave distinta de la
    // que calienta la precarga del nav, asi que el trabajo no se aprovechaba.
    const qs = params.toString();
    const url = qs ? `/api/orders?${qs}` : '/api/orders';

    let vigente = true;
    fetchConCache<Order[]>(url, (filas) => {
      if (!vigente) return;
      setOrders(filas);
      setLoading(false);
    })
      .catch((err) => {
        if (vigente) setError(String(err));
      })
      .finally(() => {
        if (vigente) setLoading(false);
      });

    return () => {
      vigente = false;
    };
  }, [JSON.stringify(options), refreshKey]);

  return { orders, loading, error, refetch, createOrder, statuses, updateStatus };
}
