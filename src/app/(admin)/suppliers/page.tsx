"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, Search, RefreshCw, Mail, Phone, User, ExternalLink } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Supplier {
  id_proveedor: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
}

function PageHeader({ label, title, sub, actionLabel, onAction, bgImage }: { label: string; title: string; sub?: string; actionLabel?: string; onAction?: () => void; bgImage?: string }) {
  return (
    <div className="relative w-full rounded overflow-hidden mb-8" style={{ minHeight: 120 }}>
      <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(135deg, #1e1508 0px, #1e1508 18px, #231a0a 18px, #231a0a 36px)" }} />
      {bgImage && <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.12] mix-blend-luminosity" />}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
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

export default function SuppliersView() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;
  const supabase = createClient();

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const { data, error } = await supabase.rpc('list_suppliers', {
          p_limit: 100,
          p_offset: 0
        });

        if (error) {
          console.error("Error fetching suppliers:", error);
        } else {
          setSuppliers(data || []);
        }
      } catch (err) {
        console.error("Failed to load suppliers", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [supabase]);

  const filtered = useMemo(() => suppliers.filter(s => {
    const matchSearch = 
      (s.nombre || '').toLowerCase().includes(search.toLowerCase()) || 
      (s.contacto || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  }), [search, suppliers]);

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <PageHeader
        label="Supply Chain"
        title="Suppliers"
        sub="Manage your manufacturing partners and material sources. Maintain key contacts and audit history."
        actionLabel="Add Supplier"
        onAction={() => console.log('New supplier')}
        bgImage="https://images.unsplash.com/photo-1530124560676-41bc1275d428?w=1200&h=300&fit=crop&auto=format"
      />

      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name, contact or email..."
            className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-['DM_Sans']"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paginated.length > 0 ? paginated.map((s) => (
          <div key={s.id_proveedor} className="bg-card border border-border rounded-lg overflow-hidden group hover:border-primary/50 transition-all">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-['Anton'] text-2xl uppercase tracking-wide text-foreground group-hover:text-primary transition-colors">{s.nombre}</h3>
                  <p className="text-xs font-['DM_Mono'] text-muted-foreground uppercase tracking-widest">ID: PRV-{s.id_proveedor}</p>
                </div>
                <button className="text-muted-foreground hover:text-foreground"><ExternalLink size={18} /></button>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    <User size={14} />
                  </div>
                  <span className="text-sm font-['DM_Sans']">{s.contacto || 'No contact specified'}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    <Mail size={14} />
                  </div>
                  <span className="text-sm font-['DM_Sans']">{s.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    <Phone size={14} />
                  </div>
                  <span className="text-sm font-['DM_Sans']">{s.telefono || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 flex gap-3">
                <button className="flex-1 py-2 bg-muted hover:bg-muted/80 text-foreground font-['DM_Mono'] text-xs uppercase tracking-widest rounded transition-all">Edit</button>
                <button className="flex-1 py-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-['DM_Mono'] text-xs uppercase tracking-widest rounded transition-all">Orders</button>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center bg-card border border-border rounded-lg">
            <p className="text-muted-foreground italic font-['DM_Sans']">No suppliers found matching your criteria.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="px-6 py-2 rounded bg-muted border border-border text-sm font-['DM_Mono'] uppercase tracking-widest hover:bg-muted/80 disabled:opacity-50 transition-all"
          >
            Prev
          </button>
          <span className="text-sm font-['DM_Mono'] text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-2 rounded bg-muted border border-border text-sm font-['DM_Mono'] uppercase tracking-widest hover:bg-muted/80 disabled:opacity-50 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
