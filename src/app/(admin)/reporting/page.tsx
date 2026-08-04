"use client";

import React, { useState, useMemo } from "react";
import { Search, Cpu, Shield, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/figma-shared/Common";
import { TacticalTable, Column } from "@/components/ui/TacticalTable";

interface ActivityLog {
  id_log: string;
  timestamp: string;
  operator: string;
  action: 'create' | 'update' | 'delete' | 'alert';
  component: 'product' | 'category' | 'order' | 'inventory' | 'system';
  details: string;
}

const AUDIT_TRAIL: ActivityLog[] = [
  { id_log: "LOG-9284", timestamp: "2026-07-20T21:36:00Z", operator: "Operador Principal (Kenji)", action: "update", component: "inventory", details: "Refactorización y optimización de tabla de inventario a TacticalTable." },
  { id_log: "LOG-9283", timestamp: "2026-07-20T18:45:00Z", operator: "Sistema (Alertas)", action: "alert", component: "system", details: "Alerta de stock crítico: SKU BFW-003-RED-S (Kata Track Jacket) se encuentra en 0 unidades." },
  { id_log: "LOG-9282", timestamp: "2026-07-20T15:20:00Z", operator: "Finanzas (Sofia)", action: "create", component: "order", details: "Generación de nueva factura INV-2025-0187 para Kenji Morales por ₡234.97." },
  { id_log: "LOG-9281", timestamp: "2026-07-19T11:15:00Z", operator: "Logística (Valentina)", action: "update", component: "inventory", details: "Entrada de stock: +50 unidades de Bruma Tee - Black (BFW-002-BLK-L)." },
  { id_log: "LOG-9280", timestamp: "2026-07-19T09:30:00Z", operator: "Administrador (Bruma)", action: "delete", component: "category", details: "Categoría 'Outwear Temp' eliminada por reordenamiento de catálogo." },
  { id_log: "LOG-9279", timestamp: "2026-07-18T16:10:00Z", operator: "Logística (Valentina)", action: "update", component: "order", details: "Estado de orden ORD-7842 cambiado de 'pending' a 'shipped'." },
  { id_log: "LOG-9278", timestamp: "2026-07-18T14:22:00Z", operator: "Sistema (Sync)", action: "update", component: "product", details: "Sincronización de precios con pasarela de pago autorizada de forma externa." }
];

function ActionBadge({ action }: { action: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    "create": { label: "Create", color: "bg-moss/20 text-[#7ddb7d] border border-[#7ddb7d]/30", icon: <Shield size={10} /> },
    "update": { label: "Modify", color: "bg-[#d4a017]/10 text-[#d4a017] border border-[#d4a017]/30", icon: <Cpu size={10} /> },
    "delete": { label: "Purge", color: "bg-destructive/20 text-[#ff8099] border border-[#ff8099]/30", icon: <Shield size={10} /> },
    "alert": { label: "Alert", color: "bg-ember/10 text-ember border border-ember/30", icon: <AlertTriangle size={10} /> },
  };
  const s = map[action] ?? { label: action, color: "bg-bone/5 text-bone/50 border border-bone/20", icon: null };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[9px] uppercase tracking-widest font-bold ${s.color}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

function ComponentBadge({ component }: { component: string }) {
  return (
    <span className="inline-block px-2 py-0.5 bg-bone/5 border border-bone/10 rounded-[2px] text-[9px] uppercase tracking-widest font-geist font-bold text-bone/60">
      {component}
    </span>
  );
}

export default function ReportingView() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const filtered = useMemo(() => {
    return AUDIT_TRAIL.filter(log => {
      const matchSearch = 
        log.details.toLowerCase().includes(search.toLowerCase()) || 
        log.operator.toLowerCase().includes(search.toLowerCase()) ||
        log.id_log.toLowerCase().includes(search.toLowerCase());
      const matchAction = actionFilter === "all" || log.action === actionFilter;
      return matchSearch && matchAction;
    });
  }, [search, actionFilter]);

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const columns: Column<ActivityLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (log) => (
        <div>
          <div className="font-geist text-sm text-bone">
            {new Date(log.timestamp).toLocaleDateString()}
          </div>
          <div className="font-geist text-[10px] text-bone/40 uppercase tracking-widest mt-0.5">
            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )
    },
    {
      key: 'operator',
      header: 'Operative Agent',
      render: (log) => (
        <div>
          <p className="font-fraunces text-base font-bold text-bone">{log.operator}</p>
          <p className="font-geist text-[10px] text-bone/50 uppercase tracking-widest mt-0.5">{log.id_log}</p>
        </div>
      )
    },
    {
      key: 'action',
      header: 'Protocol / Node',
      render: (log) => (
        <div className="flex items-center gap-3">
          <ActionBadge action={log.action} />
          <ComponentBadge component={log.component} />
        </div>
      )
    },
    {
      key: 'details',
      header: 'Directive Execution details',
      className: 'max-w-md text-bone/70 font-light font-geist text-sm leading-relaxed',
      render: (log) => log.details
    }
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <PageHeader
        label="Logistics Audit"
        title="Activity Log"
        sub="Audit chronological subroutines and operations. Track system overrides, price mutations, and clearance alerts."
        bgImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=300&fit=crop&auto=format"
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
              placeholder="Search audit trail logs..."
              className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
            />
          </div>

          <TacticalTable
            columns={columns}
            data={paginated}
            keyExtractor={(log) => log.id_log}
            emptyTitle="No Audit Logs Found"
            emptyDescription="All sectors are clear. No events match your parameters."
            emptyActionLabel="Clear Filters"
            onEmptyAction={() => {
              setSearch("");
              setActionFilter("all");
              setPage(0);
            }}
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            onPageChange={(p) => setPage(p)}
            itemsLabel="audit records"
          />
        </div>

        {/* Filters Sticky Sidebar (3 cols) */}
        <aside className="lg:col-span-3 lg:sticky lg:top-[120px] flex flex-col gap-6 bg-obsidian/40 border border-bone/10 p-6 rounded-[4px] backdrop-blur-md">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-bone/40 font-geist uppercase tracking-[0.2em] font-bold">Protocol:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setActionFilter("all"); setPage(0); }}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  actionFilter === "all"
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setActionFilter("create"); setPage(0); }}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  actionFilter === "create"
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                Creation
              </button>
              <button
                onClick={() => { setActionFilter("update"); setPage(0); }}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  actionFilter === "update"
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                Modify
              </button>
              <button
                onClick={() => { setActionFilter("delete"); setPage(0); }}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  actionFilter === "delete"
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                Purge
              </button>
              <button
                onClick={() => { setActionFilter("alert"); setPage(0); }}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  actionFilter === "alert"
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                Alert
              </button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
