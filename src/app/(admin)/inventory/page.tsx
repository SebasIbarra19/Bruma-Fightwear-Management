"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getUserProject } from "@/lib/project-resolver";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Fauna } from "@/components/ui/Fauna";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { TacticalTable, Column } from "@/components/ui/TacticalTable";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";

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
  img: string;
}

const mapInventoryImage = (sku: string) => {
  return "/imports/image-3.png"; // Default fallback
};

const FALLBACK_INVENTORY = [
  { sku: "BFW-002-BLK-L",  name: "Bruma Tee - Black",      category: "T-Shirts",     collection: "BRUMA",    size: "L",  stock: 8,  price: 39.99,  status: "low",      img: "/imports/image-3.png" },
  { sku: "BFW-003-RED-S",  name: "Kata Track Jacket",      category: "Jackets",      collection: "TARCOLES", size: "S",  stock: 0,  price: 129.99, status: "out",      img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=580&fit=crop&auto=format" },
  { sku: "BFW-004-GRN-M",  name: "Monteverde Cargo Pants", category: "Bottoms",      collection: "TARCOLES", size: "M",  stock: 31, price: 74.99,  status: "in-stock", img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&h=580&fit=crop&auto=format" },
  { sku: "BFW-005-BLK-OS", name: "Koi Snapback",           category: "Headwear",     collection: "BRUMA",    size: "OS", stock: 55, price: 34.99,  status: "in-stock", img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=580&fit=crop&auto=format" },
  { sku: "BFW-006-ONG-M",  name: "Sensei Gi Top",          category: "Martial Arts", collection: "TARCOLES", size: "M",  stock: 6,  price: 109.99, status: "low",      img: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500&h=580&fit=crop&auto=format" },
];

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
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [colFilter, setColFilter] = useState<Set<string>>(new Set());
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
  const [sizeFilter, setSizeFilter] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const PER_PAGE = 8;
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const project = await getUserProject();
        if (!project) {
          console.error("No project found");
          setLoading(false);
          return;
        }

        // @ts-ignore - Supabase RPC types may be incomplete
        const { data, error } = await supabase.rpc('list_inventory_items', {
          p_incluir_stock_cero: true,
          p_limit: 100,
          p_offset: 0
        });

        if (error || !data || (data as any[]).length === 0) {
          console.error("Error fetching inventory or no data:", error);
          setInventory(FALLBACK_INVENTORY as any);
        } else if (data) {
          const formatted = (data as any[]).map((item: any) => ({
            id: item.inventory_id,
            sku: item.sku,
            name: item.product_name || 'Desconocido',
            category: item.category_name || 'Sin Categoría',
            collection: 'BRUMA',
            size: item.variant_name || 'OS',
            stock: item.current_stock || 0,
            price: item.price || 0,
            status: item.current_stock > 0 ? (item.current_stock > 10 ? 'in-stock' : 'low') : 'out',
            img: mapInventoryImage(item.sku)
          }));
          setInventory(formatted);
        }
      } catch (err) {
        console.error("Failed to load inventory", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, router]);

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
            {item.img && item.img !== "/imports/image-3.png" ? (
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
      render: (item) => `$${item.price.toFixed(2)}`
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />
    }
  ];

  if (loading) {
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
        actionLabel="+ Add Product"
        actionIcon={<Plus size={16} />}
        bgImage="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=300&fit=crop&auto=format"
      />

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
