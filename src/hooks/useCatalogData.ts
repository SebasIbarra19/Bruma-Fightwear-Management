// ================================================
// 🔗 HOOK useCatalogData - Patrón A
// ================================================

import { useEffect, useState } from 'react';
import type {
  CatalogProduct,
  CategoryForFilter,
  ProductLineForFilter,
  CollectionForFilter,
} from '@/lib/database/adapters/catalog-adapter';

interface UseCatalogDataResult {
  products: CatalogProduct[];
  categories: CategoryForFilter[];
  productLines: ProductLineForFilter[];
  collections: CollectionForFilter[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  toggleStatus: (id: number, currentStatus: boolean) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  createProduct: (payload: {
    nombre: string;
    codigo?: string;
    descripcion?: string;
    id_categoria?: number | null;
    id_coleccion?: number | null;
    precio: number;
    stockQty: number;
    sizes: string[];
  }) => Promise<void>;
  createCategory: (nombre: string) => Promise<{ id: number; name: string }>;
  createCollection: (nombre: string) => Promise<{ id: number; name: string }>;
}

export function useCatalogData(): UseCatalogDataResult {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CategoryForFilter[]>([]);
  const [productLines, setProductLines] = useState<ProductLineForFilter[]>([]);
  const [collections, setCollections] = useState<CollectionForFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/catalog`)
      .then((r) => r.json())
      .then((result) => {
        if (result.error) setError(result.error);
        else {
          setProducts(result.data ?? []);
          setCategories(result.categories ?? []);
          setProductLines(result.productLines ?? []);
          setCollections(result.collections ?? []);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

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

  const createProduct: UseCatalogDataResult['createProduct'] = async (payload) => {
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    refetch();
  };

  const createCategory: UseCatalogDataResult['createCategory'] = async (nombre) => {
    const res = await fetch('/api/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    setCategories((prev) => [...prev, result.data]);
    return result.data;
  };

  const createCollection: UseCatalogDataResult['createCollection'] = async (nombre) => {
    const res = await fetch('/api/catalog/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    setCollections((prev) => [...prev, result.data]);
    return result.data;
  };

  return {
    products,
    categories,
    productLines,
    collections,
    loading,
    error,
    refetch,
    toggleStatus,
    deleteProduct,
    createProduct,
    createCategory,
    createCollection,
  };
}
