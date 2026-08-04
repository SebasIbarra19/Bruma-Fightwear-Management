// ================================================
// 🔗 HOOK useVariantsData - Patrón A
// ================================================

import { useEffect, useState } from 'react';
import type {
  VariantWithProduct,
  ProductForFilter,
} from '@/lib/database/adapters/variants-adapter';

interface UseVariantsDataResult {
  variants: VariantWithProduct[];
  products: ProductForFilter[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  toggleStatus: (id: number, currentStatus: boolean) => Promise<void>;
  deleteVariant: (id: number) => Promise<void>;
}

export function useVariantsData(projectId: string): UseVariantsDataResult {
  const [variants, setVariants] = useState<VariantWithProduct[]>([]);
  const [products, setProducts] = useState<ProductForFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    fetch(`/api/variants?projectId=${projectId}&includeProducts=true`)
      .then((r) => r.json())
      .then((result) => {
        if (result.error) setError(result.error);
        else {
          setVariants(result.data ?? []);
          setProducts(result.products ?? []);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, refreshKey]);

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    await fetch('/api/variants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !currentStatus }),
    });
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, is_active: !currentStatus } : v))
    );
  };

  const deleteVariant = async (id: number) => {
    await fetch(`/api/variants?id=${id}`, { method: 'DELETE' });
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  return { variants, products, loading, error, refetch, toggleStatus, deleteVariant };
}
