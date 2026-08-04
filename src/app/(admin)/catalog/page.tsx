"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Eye
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const CATALOG = [
  { id: 2,  name: "Bruma Tee - Black",        price: 39,  category: "Tees",         collection: "BRUMA",    sizes: ["XS","S","M","L"],       stock: 8,  status: "low",      img: "/imports/image-3.png" },
  { id: 3,  name: "Dragon Back Bomber",       price: 159, category: "Jackets",      collection: "TARCOLES", sizes: ["M","L","XL"],           stock: 19, status: "in-stock", img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=580&fit=crop&auto=format" },
  { id: 4,  name: "Monteverde Cargo Pants",   price: 74,  category: "Bottoms",      collection: "TARCOLES", sizes: ["S","M","L","XL","XXL"], stock: 31, status: "in-stock", img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&h=580&fit=crop&auto=format" },
  { id: 5,  name: "Sensei Gi Top",            price: 109, category: "Martial Arts", collection: "TARCOLES", sizes: ["XS","S","M","L","XL"],  stock: 6,  status: "low",      img: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500&h=580&fit=crop&auto=format" },
  { id: 6,  name: "Bruma Windbreaker",        price: 144, category: "Jackets",      collection: "TARCOLES", sizes: ["S","M"],                stock: 0,  status: "out",      img: "https://images.unsplash.com/photo-1539533018257-0768279929f9?w=500&h=580&fit=crop&auto=format" },
  { id: 7,  name: "Koi Snapback",             price: 34,  category: "Headwear",     collection: "BRUMA",    sizes: ["OS"],                   stock: 55, status: "in-stock", img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=580&fit=crop&auto=format" },
  { id: 8,  name: "Flame Script Hoodie",      price: 94,  category: "Hoodies",      collection: "BRUMA",    sizes: ["S","M","L","XL","XXL"], stock: 15, status: "in-stock", img: "https://images.unsplash.com/photo-1565693413579-8ff3fdc1b03b?w=500&h=580&fit=crop&auto=format" },
  { id: 9,  name: "Bruma Tee - White",        price: 37,  category: "Tees",         collection: "BRUMA",    sizes: ["XS","S","M","L","XL"],  stock: 48, status: "in-stock", img: "/imports/image-3.png" },
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

export default function CatalogPage() {
  const [colFilter, setColFilter] = useState<Set<string>>(new Set());
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
  const [sizeFilter, setSizeFilter] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  function toggleCol(c: string) { setColFilter(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; }); }
  function toggleCat(c: string) { setCatFilter(prev => { const next = new Set(prev); next.has(c) ? next.delete(c) : next.add(c); return next; }); }
  function toggleSize(s: string) { setSizeFilter(prev => { const next = new Set(prev); next.has(s) ? next.delete(s) : next.add(s); return next; }); }

  const collections = Array.from(new Set(CATALOG.map(p => p.collection)));
  const categories = Array.from(new Set(CATALOG.map(p => p.category)));
  
  const filtered = useMemo(() => CATALOG.filter(p => {
    const matchCol = colFilter.size === 0 || colFilter.has(p.collection);
    const matchCat = catFilter.size === 0 || catFilter.has(p.category);
    const matchSize = sizeFilter.size === 0 || p.sizes.some(s => sizeFilter.has(s));
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchCol && matchCat && matchSize && matchSearch;
  }), [colFilter, catFilter, sizeFilter, search]);

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

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <PageHeader
        label="Product Line"
        title="Catalog"
        sub="Your full lineup — styled for the street and the mat."
        actionLabel="+ Add Product"
        actionIcon={<Plus size={16} />}
        bgImage="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=300&fit=crop&auto=format"
      />

      {/* Grid: Main Content Left, Filters Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Catalog Content (9 cols) */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          
          {/* Search bar specifically aligned with this column */}
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
                className="group cursor-pointer hover:border-ember/40 transition-colors"
              >
                {/* Image Area with nice overlay */}
                <div className="relative overflow-hidden bg-obsidian/80" style={{ aspectRatio: "3/3.5" }}>
                  <ImageWithFallback
                    src={product.img}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <StatusBadge status={product.status === "in-stock" ? "in-stock" : product.status === "low" ? "low" : "out"} />
                  </div>

                  {/* View details hover overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest font-geist">
                      <Eye size={14} />
                      View Details
                    </div>
                  </div>
                </div>

                {/* Info Block */}
                <div className="p-5">
                  <p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mb-1">{product.category}</p>
                  <h3 className="font-fraunces text-lg font-bold text-bone leading-tight mb-2 truncate">{product.name}</h3>
                  <div className="flex items-end justify-between mb-4">
                    <p className="font-fraunces text-2xl text-ember font-bold leading-none">${product.price}</p>
                    <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">{product.stock} units</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {product.sizes.map(s => {
                      const active = sizeFilter.has(s);
                      return (
                        <span
                          key={s}
                          className={`w-7 h-7 rounded-[2px] flex items-center justify-center font-geist text-[9px] font-bold uppercase border transition-colors ${
                            active 
                              ? "border-ember bg-ember/10 text-ember" 
                              : "border-bone/10 text-bone/40 bg-transparent"
                          }`}
                        >
                          {s}
                        </span>
                      );
                    })}
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
                    setColFilter(new Set());
                    setCatFilter(new Set());
                    setSizeFilter(new Set());
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right-hand Filters Sticky Sidebar (3 cols) */}
        <aside className="lg:col-span-3 lg:sticky lg:top-[120px] flex flex-col gap-6 bg-obsidian/40 border border-bone/10 p-6 rounded-[4px] backdrop-blur-md">
          <div className="flex flex-col gap-6">
            
            <CollectionFilterBar active={colFilter} onToggle={toggleCol} onClear={() => setColFilter(new Set())} collections={collections} />
            
            <div className="h-px bg-bone/10" />

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

            <SizeFilterBar active={sizeFilter} onToggle={toggleSize} onClear={() => setSizeFilter(new Set())} />

          </div>
        </aside>

      </div>
    </div>
  );
}
