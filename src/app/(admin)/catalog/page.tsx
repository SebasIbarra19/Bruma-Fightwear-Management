"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Eye,
  ImageIcon
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalogData } from "@/hooks/useCatalogData";
import dynamic from "next/dynamic";

// Los dos modales solo existen cuando se abren; con el import estático viajaban
// en el bundle de la página aunque nadie creara ni editara un producto.
const AddProductModal = dynamic(
  () => import("@/components/catalog/AddProductModal").then((m) => m.AddProductModal),
  { ssr: false }
);
const EditProductModal = dynamic(
  () => import("@/components/catalog/EditProductModal").then((m) => m.EditProductModal),
  { ssr: false }
);

function catalogStatus(stockTotal: number): "in-stock" | "low" | "out" {
  if (stockTotal <= 0) return "out";
  if (stockTotal <= 10) return "low";
  return "in-stock";
}

export default function CatalogPage() {
  const { products, categories, collections, loading, error, refetch, createProduct, createCategory, createCollection } = useCatalogData();
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
  const [collFilter, setCollFilter] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  function toggleCat(c: string) { setCatFilter(prev => { const next = new Set(prev); next.has(c) ? next.delete(c) : next.add(c); return next; }); }
  function toggleColl(c: string) { setCollFilter(prev => { const next = new Set(prev); next.has(c) ? next.delete(c) : next.add(c); return next; }); }

  const categoryNames = categories.map(c => c.name);
  const collectionNames = [...collections.map(c => c.name), "Sin colección"];

  const filtered = useMemo(() => products.filter(p => {
    const matchCat = catFilter.size === 0 || (p.category_name && catFilter.has(p.category_name));
    const matchColl = collFilter.size === 0 || collFilter.has(p.collection_name || "Sin colección");
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category_name || '').toLowerCase().includes(q);
    return matchCat && matchColl && matchSearch;
  }), [products, catFilter, collFilter, search]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
        <Skeleton className="w-full h-32 rounded-[2px]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-9 flex flex-col gap-8">
            <Skeleton className="w-full h-12 rounded-[2px]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-obsidian/40 border border-bone/10 p-5 rounded-[4px] flex flex-col gap-4">
                  <Skeleton className="w-full aspect-[3/3.5] rounded-[2px]" />
                  <Skeleton className="w-24 h-4 rounded-[2px]" />
                  <Skeleton className="w-full h-6 rounded-[2px]" />
                  <Skeleton className="w-16 h-8 rounded-[2px]" />
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="lg:col-span-3 h-[400px] rounded-[4px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[1400px] mx-auto">
        <EmptyState
          title="Error cargando catálogo"
          description={error}
          actionLabel="Reintentar"
          onAction={refetch}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <PageHeader
        label="Product Line"
        title="Catalog"
        sub="Your full lineup — styled for the street and the mat."
        actionLabel="+ Add Product"
        actionIcon={<Plus size={16} />}
        onAction={() => setShowAddModal(true)}
        bgImage="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=300&fit=crop&auto=format"
      />

      {/* El montaje condicional es lo que hace efectivo el `dynamic`: montados
          siempre con `open={false}`, los chunks se descargarían igual al entrar
          a la página. */}
      {showAddModal && (
        <AddProductModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          categories={categories}
          collections={collections}
          onCreateCategory={createCategory}
          onCreateCollection={createCollection}
          onSubmit={createProduct}
        />
      )}

      {showEditModal && (
        <EditProductModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          productId={editingProductId}
          categories={categories}
          collections={collections}
          onCreateCategory={createCategory}
          onCreateCollection={createCollection}
          onSaved={refetch}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <div className="lg:col-span-9 flex flex-col gap-4">

          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/40 group-focus-within:text-ember transition-colors" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search catalog products..."
              className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(product => (
              <FloraGlass
                key={product.id}
                onClick={() => { setEditingProductId(product.id); setShowEditModal(true); }}
                className="group cursor-pointer hover:border-ember/40 transition-colors"
              >
                <div className="relative overflow-hidden bg-obsidian/80" style={{ aspectRatio: "3/3.5" }}>
                  {/* Antes: src="/imports/image-3.png" hardcodeado para TODOS los
                      productos, y ese archivo no existe en public/ — cada tarjeta
                      rendereaba el SVG de imagen rota. Ahora viene de
                      producto_imagen (imagen principal), y si el producto no tiene
                      ninguna se muestra un vacío honesto en vez de un error. */}
                  {product.image_url ? (
                    <ImageWithFallback
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-bone/25">
                      <ImageIcon size={28} strokeWidth={1.5} />
                      <span className="font-geist text-[9px] uppercase tracking-widest">Sin imagen</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />

                  <div className="absolute top-3 left-3">
                    <StatusBadge status={catalogStatus(product.stock_total)} />
                  </div>

                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest font-geist">
                      <Eye size={14} />
                      View Details
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mb-1">{product.category_name || 'Sin categoría'}</p>
                  <h3 className="font-fraunces text-lg font-bold text-bone leading-tight mb-2 truncate">{product.name}</h3>
                  <div className="flex items-end justify-between mb-4">
                    <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">{product.stock_total} units</p>
                    <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">{product.variante_count} variantes</p>
                  </div>
                </div>
              </FloraGlass>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  title="Sector Clear"
                  description="No catalog products match your search or filter parameters."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearch("");
                    setCatFilter(new Set());
                    setCollFilter(new Set());
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-3 lg:sticky lg:top-[120px] flex flex-col gap-6 bg-obsidian/40 border border-bone/10 p-6 rounded-[4px] backdrop-blur-md">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-bone/40 font-geist uppercase tracking-[0.2em] font-bold">Collection:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCollFilter(new Set())}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  collFilter.size === 0
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                All
              </button>
              {collectionNames.map(c => (
                <button
                  key={c}
                  onClick={() => toggleColl(c)}
                  className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                    collFilter.has(c)
                      ? "bg-ember/10 text-ember border-ember/30 font-bold"
                      : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-bone/40 font-geist uppercase tracking-[0.2em] font-bold">Category:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCatFilter(new Set())}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  catFilter.size === 0
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                All
              </button>
              {categoryNames.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                    catFilter.has(c)
                      ? "bg-ember/10 text-ember border-ember/30 font-bold"
                      : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
