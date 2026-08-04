"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  X, 
  Package, 
  ChevronRight, 
  Truck, 
  FileText 
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { EmptyState } from "@/components/ui/EmptyState";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { Skeleton } from "@/components/ui/skeleton";

const ORDERS = [
  { id: "ORD-7842", customer: "Kenji Morales", email: "kenji@email.com", items: 3, total: 234.97, status: "shipped", date: "2025-07-10", products: ["Ryū Oversized Hoodie", "Tiger Palm Tee", "Koi Snapback"] },
  { id: "ORD-7841", customer: "Valentina Cruz", email: "val.cruz@email.com", items: 2, total: 164.98, status: "processing", date: "2025-07-09", products: ["Dragon Back Bomber", "Gold Tiger Beanie"] },
  { id: "ORD-7840", customer: "Daisuke Quesada", email: "dai.q@email.com", items: 1, total: 109.99, status: "pending", date: "2025-07-09", products: ["Sensei Gi Top"] },
  { id: "ORD-7839", customer: "Sofía Nakamura", email: "sofia.n@email.com", items: 4, total: 312.96, status: "shipped", date: "2025-07-08", products: ["Bruma Windbreaker", "Kumite Gi Pants", "Ceiba Spirit Tee", "Warrior Waist Bag"] },
  { id: "ORD-7838", customer: "Mateo Tanaka", email: "m.tanaka@email.com", items: 2, total: 174.98, status: "cancelled", date: "2025-07-07", products: ["Kata Track Jacket", "Monteverde Cargo Pants"] },
  { id: "ORD-7837", customer: "Yuki Solano", email: "yuki.s@email.com", items: 1, total: 94.99, status: "shipped", date: "2025-07-07", products: ["Flame Script Hoodie"] },
  { id: "ORD-7836", customer: "Andrés Kim", email: "andres.k@email.com", items: 3, total: 197.97, status: "processing", date: "2025-07-06", products: ["Rising Sun Crewneck", "Pura Vida Shorts", "Dojo Long Sleeve"] },
  { id: "ORD-7835", customer: "Lucía Watanabe", email: "lucia.w@email.com", items: 2, total: 82.98, status: "pending", date: "2025-07-06", products: ["Jungle Noise Tee", "Gold Tiger Beanie"] },
];

export default function OrdersPage() {
  const [selected, setSelected] = useState(ORDERS[0]);
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  function toggleStatus(s: string) {
    setStatusFilter(prev => { 
      const next = new Set(prev); 
      next.has(s) ? next.delete(s) : next.add(s); 
      return next; 
    });
  }

  const filtered = useMemo(() => {
    return ORDERS.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
      const matchStatus = statusFilter.size === 0 || statusFilter.has(o.status);
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const statusIcon = (s: string) => {
    if (s === "shipped") return <CheckCircle size={15} className="text-green-400" />;
    if (s === "processing") return <Clock size={15} className="text-orange-400" />;
    if (s === "pending") return <AlertTriangle size={15} className="text-yellow-400" />;
    return <X size={15} className="text-red-400" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-[1400px] mx-auto">
        <Skeleton className="w-full h-[110px] rounded-[2px]" />
        <div className="flex flex-col gap-3">
          <Skeleton className="w-full h-10 rounded-[2px]" />
          <Skeleton className="w-full h-16 rounded-[2px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Skeleton className="lg:col-span-2 h-[450px] rounded-[2px]" />
          <Skeleton className="lg:col-span-3 h-[450px] rounded-[2px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-4">
      <PageHeader
        label="Order Center"
        title="Orders"
        sub="Manage and track all customer orders in real time."
        actionLabel="+ New Order"
        actionIcon={<Plus size={16} />}
        bgImage="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=1200&h=300&fit=crop&auto=format"
      />

      <div className="flex flex-col gap-3">
        <div className="relative group">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/40 group-focus-within:text-ember transition-colors" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID, customer, email..."
            className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
          />
        </div>
        <div className="flex flex-col gap-4 bg-obsidian/40 border border-bone/10 p-4 rounded-[4px] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-bone/50 font-geist uppercase tracking-widest shrink-0">Status:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter(new Set())}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  statusFilter.size === 0
                    ? "bg-ember/10 text-ember border-ember/30"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                All
              </button>
              {["pending", "processing", "shipped", "cancelled"].map(s => (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                    statusFilter.has(s)
                      ? "bg-ember/10 text-ember border-ember/30"
                      : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left column - Orders List */}
        <FloraGlass className="lg:col-span-2 flex flex-col !overflow-visible">
          <div className="px-6 py-4 border-b border-bone/10">
            <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">Orders</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto tactical-scrollbar flex flex-col">
            {filtered.map(order => (
              <button
                key={order.id}
                onClick={() => setSelected(order)}
                className={`w-full text-left px-6 py-5 border-b border-bone/5 transition-all hover:bg-bone/5 ${
                  selected?.id === order.id ? "bg-bone/10 border-l-[3px] border-l-ember" : "border-l-[3px] border-l-transparent"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-geist text-[10px] font-bold tracking-widest text-bone/50 uppercase">{order.id}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-lg text-bone font-fraunces font-bold mb-1">{order.customer}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-bone/50 uppercase tracking-widest">{order.items} unit{order.items !== 1 ? "s" : ""}</span>
                  <span className="font-geist text-sm text-bone font-medium">${order.total.toFixed(2)}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-4">
                <EmptyState 
                  title="No Orders Found" 
                  description="No current tactical dispatches match your search or filter parameters." 
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearch("");
                    setStatusFilter(new Set());
                  }}
                />
              </div>
            )}
          </div>
        </FloraGlass>

        {/* Right column - Order Detail */}
        {selected && (
          <FloraGlass className="lg:col-span-3 p-8 md:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-8 border-b border-bone/10 pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-ember">{statusIcon(selected.status)}</div>
                    <span className="font-geist text-[10px] uppercase tracking-widest text-bone/50 font-bold">{selected.id}</span>
                  </div>
                  <h2 className="font-fraunces text-4xl font-bold text-bone">{selected.customer}</h2>
                  <p className="text-sm text-bone/60 font-geist mt-1">{selected.email}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              {/* Opaque Scrim behind detailed data for 100% legibility */}
              <div className="bg-obsidian/90 border border-bone/5 p-6 rounded-[2px] mb-8 relative">
                {/* Subtle technical corner ticks */}
                <div className="absolute top-2 left-2 w-1 h-1 bg-bone/20"></div>
                <div className="absolute top-2 right-2 w-1 h-1 bg-bone/20"></div>
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-bone/20"></div>
                <div className="absolute bottom-2 right-2 w-1 h-1 bg-bone/20"></div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[["Date", selected.date], ["Units", String(selected.items)], ["Total", `$${selected.total.toFixed(2)}`]].map(([k, v]) => (
                    <div key={k} className="bg-bone/5 border border-bone/10 rounded-[2px] p-4 flex flex-col justify-center">
                      <p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mb-1">{k}</p>
                      <p className="text-lg font-geist text-bone">{v}</p>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-4">Requisition Details</p>
                <div className="space-y-2">
                  {selected.products.map((p, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 px-4 bg-obsidian/60 border border-bone/5 rounded-[2px]">
                      <div className="w-8 h-8 bg-bone/5 rounded-[2px] border border-bone/10 flex items-center justify-center flex-shrink-0">
                        <Package size={14} className="text-bone/40" />
                      </div>
                      <span className="text-sm text-bone font-geist flex-1">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 border-t border-bone/10 pt-6 mt-auto">
              <button className="flex items-center gap-2 px-6 py-3 bg-ember text-obsidian rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-ember/90 transition-all shadow-[0_0_15px_rgba(255,77,28,0.2)]">
                <Truck size={14} />
                Mark Dispatched
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-transparent border border-bone/30 text-bone rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-bone hover:text-obsidian hover:border-bone transition-all">
                <FileText size={14} />
                Generate Invoice
              </button>
            </div>
          </FloraGlass>
        )}
      </div>
    </div>
  );
}
