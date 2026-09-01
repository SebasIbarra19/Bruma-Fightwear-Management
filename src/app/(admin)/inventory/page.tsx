"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { TacticalTable, Column } from "@/components/ui/TacticalTable";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { useInventory } from "@/hooks/useInventory";
import dynamic from "next/dynamic";

// Solo existe cuando se abre; con el import estático viajaba en el bundle de la
// página aunque nadie registrara un movimiento.
const StockMovementModal = dynamic(
  () => import("@/components/inventory/StockMovementModal").then((m) => m.StockMovementModal),
  { ssr: false }
);
import { logInventoryMovement } from "@/lib/inventory-movements-client";
import { formatColones } from "@/lib/utils";
import { fetchApi } from '@/lib/api/fetch-cliente';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  collection: string;
  size: string;
  stock: number;
  price: number;
  status: string;
  /** null mientras `list_inventory_items` no devuelva la imagen del producto. */
  img: string | null;
}

// Nota: `list_inventory_items` todavía no devuelve la imagen del producto. Las
// imágenes viven en `producto_imagen` y hoy se muestran en Catálogo, que es donde
// se administran (ver migración 20260825040000). Acá se deja el placeholder
// explícito en vez del `/imports/image-3.png` inexistente que había antes — ese
// path obligaba a un guard que comparaba contra la ruta rota para no mostrar una
// imagen fallida.

function CollectionFilterBar({ active, onToggle, onClear, collections }: { active: Set<string>; onToggle: (c: string) => void; onClear: () => void; collections: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] text-bone/40 font-geist uppercase tracking-[0.2em] font-bold">Collection:</span>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onClear}
          className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
            active.size === 0
              ? "bg-ember/10 text-ember border-ember/30 font-bold"
              : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
          }`}
        >
          All
        </button>
        {collections.map(c => (
          <button
            key={c}
            onClick={() => onToggle(c)}
            className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
              active.has(c)
                ? "bg-ember/10 text-ember border-ember/30 font-bold"
                : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function SizeFilterBar({ active, onToggle, onClear }: { active: Set<string>; onToggle: (s: string) => void; onClear: () => void }) {
  const SIZES = ["OS", "XS", "S", "M", "L", "XL", "XXL"];
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] text-bone/40 font-geist uppercase tracking-[0.2em] font-bold">Size:</span>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onClear}
          className={`w-8 h-8 flex items-center justify-center rounded-[2px] text-[10px] font-geist font-bold transition-all border ${
            active.size === 0
              ? "bg-ember/10 text-ember border-ember/30 font-bold"
              : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
          }`}
        >
          All
        </button>
        {SIZES.map(s => (
          <button
            key={s}
            onClick={() => onToggle(s)}
            className={`w-8 h-8 flex items-center justify-center rounded-[2px] text-[10px] font-geist font-bold transition-all border ${
              active.has(s)
                ? "bg-ember/10 text-ember border-ember/30 font-bold"
                : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function InventoryView() {
  const { inventory: rawInventory, loadingInventory, error, fetchInventory } = useInventory();
  const [search, setSearch] = useState("");
  const [colFilter, setColFilter] = useState<Set<string>>(new Set());
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
  const [sizeFilter, setSizeFilter] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const PER_PAGE = 8;

  React.useEffect(() => {
    fetchInventory();
  }, []);

  const inventory: InventoryItem[] = useMemo(() => rawInventory.map((item: any) => ({
    id: String(item.inventory_id),
    sku: item.sku || 'SIN-SKU',
    name: item.product_name || 'Desconocido',
    category: item.category_name || 'Sin Categoría',
    collection: item.collection || 'Sin colección',
    size: item.size || item.variant_name || 'OS',
    stock: item.current_stock || 0,
    price: item.price || 0,
    status: item.status,
    img: null as string | null
  })), [rawInventory]);

  const [showMovementModal, setShowMovementModal] = useState(false);
  // SKU con el que se abrió el modal. `null` cuando se abre desde el botón
  // general; con valor cuando se abre clicando una fila de la tabla.
  const [movementSku, setMovementSku] = useState<string | null>(null);

  const [movementSkuOptions, setMovementSkuOptions] = useState<{ id: number | null; idVariante: number; sku: string; productName: string; currentStock: number }[]>([]);

  React.useEffect(() => {
    if (!showMovementModal) return;
    fetchApi('/api/inventory/items?limit=200&includeZeroStock=true&includeUnstocked=true')
      .then((res) => res.json())
      .then((result) => {
        const items = result.data ?? [];
        setMovementSkuOptions(
          items.map((i: any) => ({
            id: i.inventory_id,
            idVariante: i.variant_id,
            sku: i.sku,
            productName: i.product_name,
            currentStock: i.current_stock,
          }))
        );
      });
  }, [showMovementModal]);

  function toggleCol(c: string) { setColFilter(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; }); setPage(0); }
  function toggleCat(c: string) { setCatFilter(prev => { const next = new Set(prev); next.has(c) ? next.delete(c) : next.add(c); return next; }); setPage(0); }
  function toggleSize(s: string) { setSizeFilter(prev => { const next = new Set(prev); next.has(s) ? next.delete(s) : next.add(s); return next; }); setPage(0); }

  const collections = Array.from(new Set(inventory.map(i => i.collection)));
  const categories = Array.from(new Set(inventory.map(i => i.category)));

  const filtered = useMemo(() => inventory.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
    const matchCol = colFilter.size === 0 || colFilter.has(item.collection);
    const matchCat = catFilter.size === 0 || catFilter.has(item.category);
    const matchSize = sizeFilter.size === 0 || sizeFilter.has(item.size);
    return matchSearch && matchCol && matchCat && matchSize;
  }), [search, colFilter, catFilter, sizeFilter, inventory]);

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const columns: Column<InventoryItem>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (item) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[2px] overflow-hidden bg-obsidian border border-bone/10 flex-shrink-0 flex items-center justify-center">
            {item.img ? (
               <ImageWithFallback src={item.img} alt={item.name} className="w-full h-full object-cover" />
            ) : (
               <span className="font-geist text-[8px] uppercase tracking-widest text-bone/30">IMG</span>
            )}
          </div>
          <div>
            <p className="font-fraunces text-base font-bold text-bone">{item.name}</p>
            <p className="font-geist text-[10px] text-bone/50 uppercase tracking-widest mt-0.5">{item.collection}</p>
          </div>
        </div>
      )
    },
    {
      key: 'sku',
      header: 'SKU',
      className: 'font-geist tracking-wider'
    },
    {
      key: 'category',
      header: 'Category'
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="inline-block px-2 py-1 border border-bone/20 rounded-[2px] bg-bone/5 text-[10px] uppercase tracking-widest font-geist text-bone">{item.size}</span>
      )
    },
    {
      key: 'stock',
      header: 'Stock'
    },
    {
      key: 'price',
      header: 'Price',
      render: (item) => formatColones(item.price)
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />
    }
  ];

  if (error) {
    return (
      <div className="w-full max-w-[1400px] mx-auto">
        <EmptyState
          title="Error cargando inventario"
          description={error}
          actionLabel="Reintentar"
          onAction={fetchInventory}
        />
      </div>
    );
  }

  if (loadingInventory) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
        <Skeleton className="w-full h-32 rounded-[2px]" />
        <div className="flex gap-4">
          <Skeleton className="w-full h-12 rounded-[2px]" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="w-32 h-10 rounded-[2px]" />
          <Skeleton className="w-32 h-10 rounded-[2px]" />
          <Skeleton className="w-32 h-10 rounded-[2px]" />
        </div>
        <div className="bg-obsidian/40 border border-bone/10 rounded-[2px] p-4 flex flex-col gap-4">
          <Skeleton className="w-full h-10 rounded-[2px]" />
          <Skeleton className="w-full h-16 rounded-[2px]" />
          <Skeleton className="w-full h-16 rounded-[2px]" />
          <Skeleton className="w-full h-16 rounded-[2px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <PageHeader
        label="Stock Control"
        title="Inventory"
        sub="Track every SKU across the pack. Filter, sort, and spot low stock before the jungle runs dry."
        actionLabel="+ Log Movement"
        actionIcon={<Plus size={16} />}
        onAction={() => { setMovementSku(null); setShowMovementModal(true); }}
        bgImage="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=300&fit=crop&auto=format"
      />

      {/* Montaje condicional: es lo que hace efectivo el `dynamic`. */}
      {showMovementModal && (
        <StockMovementModal
          open={showMovementModal}
          onOpenChange={setShowMovementModal}
          skuOptions={movementSkuOptions}
          initialSku={movementSku}
          onSubmit={async (payload) => {
            await logInventoryMovement(payload);
            await fetchInventory();
          }}
        />
      )}

      {/* Grid: Main Column Left (containing Search + Table), Filters Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column - Search Bar + Table stacked closely together (gap-4) */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          
          {/* Search Bar - Width constrained to the left-hand column */}
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/40 group-focus-within:text-ember transition-colors" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search tactical inventory..."
              className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
            />
          </div>

          <TacticalTable
            columns={columns}
            data={paginated}
            keyExtractor={(item) => item.sku}
            // Clicar una fila abre el mismo formulario que "+ Log Movement",
            // pero con ese SKU ya elegido: si acabás de señalar el producto en
            // la tabla, volver a buscarlo en el desplegable es trabajo repetido.
            onRowClick={(item) => {
              setMovementSku(item.sku);
              setShowMovementModal(true);
            }}
            emptyTitle="Sector Clear"
            emptyDescription="No tactical inventory matches your current search parameters."
            emptyActionLabel="Reset Filters"
            onEmptyAction={() => {
              setSearch("");
              setColFilter(new Set());
              setCatFilter(new Set());
              setSizeFilter(new Set());
              setPage(0);
            }}
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            onPageChange={(p) => setPage(p)}
            itemsLabel="inventory items"
            pageSize={PER_PAGE}
          />
        </div>

        {/* Filters Sticky Sidebar */}
        <aside className="lg:col-span-3 lg:sticky lg:top-[120px] flex flex-col gap-6 bg-obsidian/40 border border-bone/10 p-6 rounded-[4px] backdrop-blur-md">
          <div className="flex flex-col gap-6">
            
            <CollectionFilterBar active={colFilter} onToggle={toggleCol} onClear={() => { setColFilter(new Set()); setPage(0); }} collections={collections} />
            
            <div className="h-px bg-bone/10" />
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-bone/40 font-geist uppercase tracking-[0.2em] font-bold">Category:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setCatFilter(new Set()); setPage(0); }}
                  className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                    catFilter.size === 0
                      ? "bg-ember/10 text-ember border-ember/30 font-bold"
                      : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                  }`}
                >
                  All
                </button>
                {categories.map(c => (
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
            
            <div className="h-px bg-bone/10" />
            
            <SizeFilterBar active={sizeFilter} onToggle={toggleSize} onClear={() => { setSizeFilter(new Set()); setPage(0); }} />
          </div>
        </aside>

      </div>
    </div>
  );
}
