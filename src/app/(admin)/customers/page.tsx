"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, Search, RefreshCw, Mail, Phone, MapPin, User, ShoppingBag } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

interface Customer {
  id_cliente: number;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  ciudad: string | null;
  total_pedidos: number;
  ultima_fecha_pedido: string | null;
}

function PageHeader({ label, title, sub, actionLabel, onAction, bgImage }: { label: string; title: string; sub?: string; actionLabel?: string; onAction?: () => void; bgImage?: string }) {
  return (
    <div className="relative w-full rounded overflow-hidden mb-8" style={{ minHeight: 120 }}>
      <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(135deg, #0d0e12 0px, #0d0e12 18px, #13151a 18px, #13151a 36px)" }} />
      {bgImage && <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.15] mix-blend-luminosity" />}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
      <div className="relative z-10 flex items-center justify-between px-8 py-7">
        <div>
          <p className="text-primary font-['DM_Mono'] text-xs uppercase tracking-[0.25em] mb-2">{label}</p>
          <h1 className="font-['Anton'] text-5xl uppercase tracking-wider text-foreground leading-none mb-2">{title}</h1>
          <p className="text-muted-foreground text-base font-['DM_Sans']">{sub}</p>
        </div>
        {actionLabel && (
          <button
            onClick={onAction}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-['Anton'] text-base uppercase tracking-wider rounded hover:opacity-90 active:scale-[0.98] transition-all flex-shrink-0"
          >
            <Plus size={16} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 12;
  const supabase = createClient();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase.rpc('list_customers', {
          p_limit: 100,
          p_offset: 0
        });

        if (error) {
          console.error("Error fetching customers:", error);
        } else {
          setCustomers(data || []);
        }
      } catch (err) {
        console.error("Failed to load customers", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [supabase]);

  const filtered = useMemo(() => customers.filter(c => {
    const full = `${c.nombre} ${c.apellido || ''}`.toLowerCase();
    const matchSearch = 
      full.includes(search.toLowerCase()) || 
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.ciudad || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  }), [search, customers]);

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <PageHeader
        label="CRM"
        title="Customers"
        sub="Manage the pack. Track buyer loyalty, order frequency and location insights."
        actionLabel="Add Customer"
        bgImage="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=300&fit=crop&auto=format"
      />

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name, email or city..."
            className="w-full pl-11 pr-4 py-4 bg-card/50 border border-border rounded text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-['DM_Sans'] transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginated.length > 0 ? paginated.map((c) => (
          <div key={c.id_cliente} className="bg-card border border-border rounded-lg overflow-hidden group hover:bg-muted/20 transition-all">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-['Anton'] text-xl uppercase tracking-wide text-foreground">{c.nombre} {c.apellido}</h3>
                  <p className="text-xs font-['DM_Mono'] text-muted-foreground uppercase tracking-widest">ID: CLI-{c.id_cliente}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <Mail size={14} className="text-primary/60" />
                  <span className="text-sm font-['DM_Sans'] truncate">{c.email}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone size={14} className="text-primary/60" />
                  <span className="text-sm font-['DM_Sans']">{c.telefono || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin size={14} className="text-primary/60" />
                  <span className="text-sm font-['DM_Sans']">{c.ciudad || 'Unknown'}</span>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between p-4 bg-muted/40 rounded border border-border/50">
                <div className="text-center">
                  <p className="text-[10px] font-['DM_Mono'] text-muted-foreground uppercase tracking-widest mb-1">Orders</p>
                  <div className="flex items-center gap-1 justify-center font-bold text-foreground">
                    <ShoppingBag size={14} className="text-success" />
                    {c.total_pedidos}
                  </div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-right">
                  <p className="text-[10px] font-['DM_Mono'] text-muted-foreground uppercase tracking-widest mb-1">Last Order</p>
                  <p className="font-bold text-foreground text-sm">
                    {c.ultima_fecha_pedido ? new Date(c.ultima_fecha_pedido).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center bg-card/30 border border-border border-dashed rounded-lg">
            <p className="text-muted-foreground italic font-['DM_Sans']">No members of the pack found matching your search.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="w-10 h-10 flex items-center justify-center rounded bg-card border border-border text-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-all"
          >
            ←
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-10 h-10 rounded text-sm font-['DM_Mono'] border transition-all ${
                  page === i ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="w-10 h-10 flex items-center justify-center rounded bg-card border border-border text-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-all"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
