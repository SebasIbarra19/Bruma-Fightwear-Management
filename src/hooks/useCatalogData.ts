// ================================================
// 🔗 HOOK useCatalogData - Patrón A
// ================================================

import { useEffect, useState } from 'react';
import type {
  CatalogProduct,
  CategoryForFilter,
  ProductLineForFilter,
} from '@/lib/database/adapters/catalog-adapter';

interface UseCatalogDataResult {
  products: CatalogProduct[];
  categories: CategoryForFilter[];
  productLines: ProductLineForFilter[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  toggleStatus: (id: number, currentStatus: boolean) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
}

export function useCatalogData(projectId: string): UseCatalogDataResult {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CategoryForFilter[]>([]);
  const [productLines, setProductLines] = useState<ProductLineForFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    fetch(`/api/catalog?projectId=${projectId}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.error) setError(result.error);
        else {
          setProducts(result.data ?? []);
          setCategories(result.categories ?? []);
          setProductLines(result.productLines ?? []);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, refreshKey]);

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    await fetch('/api/catalog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !currentStatus }),
    });
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
    );
  };

  const deleteProduct = async (id: number) => {
    await fetch(`/api/catalog?id=${id}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    products,
    categories,
    productLines,
    loading,
    error,
    refetch,
    toggleStatus,
    deleteProduct,
  };
}
