"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search, ArrowUpCircle, ArrowDownCircle, Scale } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from "@/components/figma-shared/Common";
import { Skeleton } from "@/components/ui/skeleton";
import { TacticalTable, Column } from "@/components/ui/TacticalTable";

interface Movement {
  id_movimiento: number;
  id_producto_talla: number;
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo: string | null;
  fecha: string;
  producto_nombre: string;
  variante_nombre: string;
  producto_codigo: string;
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    "entrada": { label: "Entrada", color: "bg-moss/20 text-[#7ddb7d] border border-[#7ddb7d]/30", icon: <ArrowUpCircle size={10} /> },
    "salida": { label: "Salida", color: "bg-ember/10 text-ember border border-ember/30", icon: <ArrowDownCircle size={10} /> },
    "ajuste": { label: "Ajuste", color: "bg-bone/5 text-bone/50 border border-bone/20", icon: <Scale size={10} /> },
  };
  const s = map[type] ?? { label: type, color: "bg-bone/5 text-bone/50 border border-bone/20", icon: null };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[9px] uppercase tracking-widest font-bold ${s.color}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

export default function MovementsView() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;
  const supabase = createClient();

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const { data, error } = await supabase.rpc('get_inventory_movements', {
          p_limit: 100,
          p_offset: 0
        });

        if (error) {
          console.error("Error fetching movements:", error);
        } else {
          setMovements(data || []);
        }
      } catch (err) {
        console.error("Failed to load movements", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, [supabase]);

  const filtered = useMemo(() => movements.filter(m => {
    const matchSearch = 
      (m.producto_nombre || '').toLowerCase().includes(search.toLowerCase()) || 
      (m.producto_codigo || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.motivo || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || m.tipo_movimiento === typeFilter;
    return matchSearch && matchType;
  }), [search, typeFilter, movements]);

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const columns: Column<Movement>[] = [
    {
      key: 'fecha',
      header: 'Date',
      render: (m) => (
        <div>
          <div className="font-geist text-sm text-bone">
            {new Date(m.fecha).toLocaleDateString()}
          </div>
          <div className="font-geist text-[10px] text-bone/40 uppercase tracking-widest mt-0.5">
            {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )
    },
    {
      key: 'producto_nombre',
      header: 'Product',
      render: (m) => (
        <div>
          <p className="font-fraunces text-base font-bold text-bone">{m.producto_nombre}</p>
          <p className="font-geist text-[10px] text-bone/50 uppercase tracking-widest mt-0.5">{m.producto_codigo} • {m.variante_nombre}</p>
        </div>
      )
    },
    {
      key: 'tipo_movimiento',
      header: 'Type',
      render: (m) => <TypeBadge type={m.tipo_movimiento} />
    },
    {
      key: 'cantidad',
      header: 'Qty',
      className: 'font-geist font-bold',
      render: (m) => (
        <span className={m.tipo_movimiento === 'salida' ? 'text-ember' : 'text-[#7ddb7d]'}>
          {m.tipo_movimiento === 'salida' ? '-' : '+'}{m.cantidad}
        </span>
      )
    },
    {
      key: 'motivo',
      header: 'Reason',
      className: 'max-w-xs truncate text-bone/60 font-light',
      render: (m) => m.motivo || '-'
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
        <Skeleton className="w-full h-32 rounded-[2px]" />
        <div className="flex gap-4">
          <Skeleton className="w-full h-12 rounded-[2px]" />
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
        label="Logistics"
        title="Movements"
        sub="Monitor every entrance and exit from the vault. Audit adjustments and track stock flow."
        bgImage="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=300&fit=crop&auto=format"
      />

      {/* Grid: Table Left, Filters Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Table + Search Content (9 cols) */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          
          {/* Compact Search Bar specifically aligned to table */}
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/40 group-focus-within:text-ember transition-colors" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search product, SKU or reason..."
              className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
            />
          </div>

          <TacticalTable
            columns={columns}
            data={paginated}
            keyExtractor={(m) => m.id_movimiento}
            emptyTitle="No Movements Found"
            emptyDescription="No current tactical dispatches match your search parameters."
            emptyActionLabel="Clear Search"
            onEmptyAction={() => {
              setSearch("");
              setTypeFilter("all");
              setPage(0);
            }}
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            onPageChange={(p) => setPage(p)}
            itemsLabel="movements"
          />
        </div>

        {/* Filters Sticky Sidebar (3 cols) */}
        <aside className="lg:col-span-3 lg:sticky lg:top-[120px] flex flex-col gap-6 bg-obsidian/40 border border-bone/10 p-6 rounded-[4px] backdrop-blur-md">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-bone/40 font-geist uppercase tracking-[0.2em] font-bold">Type:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setTypeFilter("all"); setPage(0); }}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  typeFilter === "all"
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setTypeFilter("entrada"); setPage(0); }}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  typeFilter === "entrada"
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                Entradas
              </button>
              <button
                onClick={() => { setTypeFilter("salida"); setPage(0); }}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  typeFilter === "salida"
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                Salidas
              </button>
              <button
                onClick={() => { setTypeFilter("ajuste"); setPage(0); }}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  typeFilter === "ajuste"
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                Ajustes
              </button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
