"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Download, 
  Send 
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { Skeleton } from "@/components/ui/skeleton";

const INVOICES = [
  { id: "INV-2025-0187", customer: "Kenji Morales", email: "kenji@email.com", total: 234.97, status: "paid", date: "2025-07-10", due: "2025-07-24", items: [{ name: "Ryū Oversized Hoodie", qty: 1, price: 89.99 }, { name: "Tiger Palm Tee", qty: 1, price: 39.99 }, { name: "Koi Snapback", qty: 1, price: 34.99 }] },
  { id: "INV-2025-0186", customer: "Valentina Cruz", email: "val.cruz@email.com", total: 164.98, status: "pending", date: "2025-07-09", due: "2025-07-23", items: [{ name: "Dragon Back Bomber", qty: 1, price: 159.99 }, { name: "Gold Tiger Beanie", qty: 1, price: 29.99 }] },
  { id: "INV-2025-0185", customer: "Sofía Nakamura", email: "sofia.n@email.com", total: 312.96, status: "paid", date: "2025-07-08", due: "2025-07-22", items: [{ name: "Bruma Windbreaker", qty: 1, price: 144.99 }, { name: "Kumite Gi Pants", qty: 1, price: 89.99 }, { name: "Ceiba Spirit Tee", qty: 1, price: 37.99 }, { name: "Warrior Waist Bag", qty: 1, price: 44.99 }] },
  { id: "INV-2025-0184", customer: "Mateo Tanaka", email: "m.tanaka@email.com", total: 174.98, status: "overdue", date: "2025-07-07", due: "2025-07-14", items: [{ name: "Kata Track Jacket", qty: 1, price: 129.99 }, { name: "Monteverde Cargo Pants", qty: 1, price: 74.99 }] },
  { id: "INV-2025-0183", customer: "Andrés Kim", email: "andres.k@email.com", total: 197.97, status: "pending", date: "2025-07-06", due: "2025-07-20", items: [{ name: "Rising Sun Crewneck", qty: 1, price: 79.99 }, { name: "Pura Vida Shorts", qty: 1, price: 49.99 }, { name: "Dojo Long Sleeve", qty: 1, price: 54.99 }] },
];

export default function InvoicingPage() {
  const [selected, setSelected] = useState(INVOICES[0]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const invList = useMemo(() => {
    const q = search.toLowerCase();
    return INVOICES.filter(inv => {
      const matchSearch = !q || inv.id.toLowerCase().includes(q) || inv.customer.toLowerCase().includes(q) || inv.email.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const subtotal = selected.items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = subtotal * 0.13;
  const total = subtotal + tax;

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
        label="Finance"
        title="Invoicing"
        sub="Manage and preview customer invoices with IVA calculation."
        actionLabel="+ New Invoice"
        actionIcon={<Plus size={16} />}
        bgImage="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=300&fit=crop&auto=format"
      />

      <div className="flex flex-col gap-3">
        {/* Search Bar - Full Width */}
        <div className="relative group">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/40 group-focus-within:text-ember transition-colors" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice ID, customer, email..."
            className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
          />
        </div>

        {/* Orders-style Filter Row (Full Width Box below Search - Exact spaces matched) */}
        <div className="flex flex-col gap-4 bg-obsidian/40 border border-bone/10 p-4 rounded-[4px] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-bone/50 font-geist uppercase tracking-widest shrink-0">Status:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  statusFilter === "all"
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("paid")}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  statusFilter === "paid"
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  statusFilter === "pending"
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("overdue")}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  statusFilter === "overdue"
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                Overdue
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        
        {/* Left column - Invoice List */}
        <FloraGlass className="lg:col-span-2 flex flex-col !overflow-visible">
          <div className="px-6 py-4 border-b border-bone/10">
            <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">All Invoices</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto tactical-scrollbar flex flex-col">
            {invList.map(inv => (
              <button
                key={inv.id}
                onClick={() => setSelected(inv)}
                className={`w-full text-left px-6 py-5 border-b border-bone/5 transition-all hover:bg-bone/5 ${
                  selected?.id === inv.id ? "bg-bone/10 border-l-[3px] border-l-ember" : "border-l-[3px] border-l-transparent"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-geist text-[10px] font-bold tracking-widest text-bone/50 uppercase">{inv.id}</span>
                  <StatusBadge status={inv.status} />
                </div>
                <p className="text-lg text-bone font-fraunces font-bold mb-1">{inv.customer}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-bone/50 uppercase tracking-widest">Due {inv.due}</span>
                  <span className="font-geist text-sm text-bone font-medium">${inv.total.toFixed(2)}</span>
                </div>
              </button>
            ))}
            {invList.length === 0 && (
              <p className="px-6 py-10 text-center text-xs text-bone/40 font-geist uppercase tracking-widest">No invoices match filters.</p>
            )}
          </div>
        </FloraGlass>

        {/* Right column - Invoice Detail */}
        {selected && (
          <FloraGlass className="lg:col-span-3 p-8 md:p-10 flex flex-col justify-between">
            <div>
              <div
                className="p-6 border-b border-bone/10 relative rounded-[2px] mb-8"
                style={{ background: "repeating-linear-gradient(135deg, rgba(35, 26, 10, 0.4) 0px, rgba(35, 26, 10, 0.4) 14px, rgba(35, 26, 10, 0.6) 14px, rgba(35, 26, 10, 0.6) 28px)" }}
              >
                {/* Crosshairs deco */}
                <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-bone/20"></div>
                <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-bone/20"></div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-bone/20"></div>
                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-bone/20"></div>
                
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-ember" />
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-ember rounded-[2px] flex items-center justify-center">
                        <span className="font-fraunces font-black text-sm text-obsidian">B</span>
                      </div>
                      <span className="font-fraunces font-black text-xl tracking-tighter text-bone uppercase">Brumafightwear</span>
                    </div>
                    <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">San José, Costa Rica • brumafightwear.cr</p>
                  </div>
                  <div className="text-right">
                    <p className="font-fraunces text-2xl text-bone uppercase tracking-tight leading-none mb-1">Invoice</p>
                    <p className="font-geist text-[10px] text-ember tracking-widest uppercase font-bold">{selected.id}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8 px-2">
                <div>
                  <p className="text-[10px] text-bone/40 font-geist uppercase mb-2 tracking-widest">Bill To</p>
                  <p className="text-bone font-fraunces font-bold text-lg">{selected.customer}</p>
                  <p className="text-sm text-bone/60 font-geist">{selected.email}</p>
                </div>
                <div className="text-right flex justify-end">
                  <div className="inline-grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <span className="text-bone/40 font-geist uppercase tracking-widest text-[10px] text-left">Issued</span>
                    <span className="text-bone font-geist text-sm">{selected.date}</span>
                    <span className="text-bone/40 font-geist uppercase tracking-widest text-[10px] text-left">Due</span>
                    <span className={`font-geist text-sm ${selected.status === "overdue" ? "text-ember font-bold" : "text-bone"}`}>{selected.due}</span>
                  </div>
                </div>
              </div>

              {/* Opaque Scrim behind financial data for 100% legibility */}
              <div className="bg-obsidian/90 border border-bone/5 p-6 rounded-[2px] mb-8 relative">
                {/* Subtle technical corner ticks for HUD detail */}
                <div className="absolute top-2 left-2 w-1 h-1 bg-bone/20"></div>
                <div className="absolute top-2 right-2 w-1 h-1 bg-bone/20"></div>
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-bone/20"></div>
                <div className="absolute bottom-2 right-2 w-1 h-1 bg-bone/20"></div>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-bone/10">
                        {["Item", "Qty", "Unit Price", "Total"].map(h => (
                          <th key={h} className={`pb-3 text-[10px] text-bone/50 font-geist uppercase tracking-widest ${h === "Item" ? "text-left" : "text-right"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item, i) => (
                        <tr key={i} className="border-b border-bone/5">
                          <td className="py-4 text-bone font-fraunces font-bold text-base text-left">{item.name}</td>
                          <td className="py-4 text-right font-geist text-sm text-bone/60">{item.qty}</td>
                          <td className="py-4 text-right font-geist text-sm text-bone/80">${item.price.toFixed(2)}</td>
                          <td className="py-4 text-right font-geist text-sm text-bone/80">${(item.qty * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    {[["Subtotal", `$${subtotal.toFixed(2)}`], ["Tax (13% IVA)", `$${tax.toFixed(2)}`]].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-bone/40 font-geist uppercase tracking-widest text-[10px]">{k}</span>
                        <span className="font-geist text-bone/80">{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3 border-t border-bone/10">
                      <span className="font-fraunces font-bold text-bone text-lg uppercase tracking-tight">Total</span>
                      <span className="font-fraunces font-bold text-primary text-2xl">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 border-t border-bone/10 pt-6 px-2 mt-auto">
              <button className="flex items-center gap-2 px-6 py-3 bg-ember text-obsidian rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-ember/90 transition-all shadow-[0_0_15px_rgba(255,77,28,0.2)]">
                <Download size={14} />
                Download
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-transparent border border-bone/30 text-bone rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-bone hover:text-obsidian hover:border-bone transition-all">
                <Send size={14} />
                Send to Client
              </button>
            </div>
          </FloraGlass>
        )}
      </div>
    </div>
  );
}
