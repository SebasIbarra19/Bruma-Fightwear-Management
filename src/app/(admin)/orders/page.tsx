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
  FileText
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { EmptyState } from "@/components/ui/EmptyState";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrdersData } from "@/hooks/useOrdersData";
import { NewOrderModal, OrderLineOption, StatusOption } from "@/components/orders/NewOrderModal";
import { formatColones } from "@/lib/utils";

export default function OrdersPage() {
  const { orders, loading, error, refetch, createOrder, statuses, updateStatus } = useOrdersData({ limit: 50 });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  // `producto_nombre`/`sku` los agrega el SP `get_order_details` (migración
  // 20260821000000). Opcionales porque salen de LEFT JOINs: una línea que
  // apunte a un producto borrado los trae en null.
  const [orderDetail, setOrderDetail] = useState<{ items: Array<{ id_producto_talla: number; cantidad: number; precio_unitario: number; producto_nombre?: string | null; sku?: string | null }> } | null>(null);
  const [orderDetailError, setOrderDetailError] = useState<string | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  useEffect(() => {
    if (selectedId === null && orders.length > 0) {
      setSelectedId(orders[0].id_pedido);
    }
  }, [orders, selectedId]);

  function toggleStatus(s: string) {
    setStatusFilter(prev => { 
      const next = new Set(prev); 
      next.has(s) ? next.delete(s) : next.add(s); 
      return next; 
    });
  }

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || String(o.id_pedido).includes(q)
        || (o.cliente_nombre || '').toLowerCase().includes(q)
        || (o.cliente_email || '').toLowerCase().includes(q);
      const matchStatus = statusFilter.size === 0 || statusFilter.has((o.estado_nombre || '').toLowerCase());
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, orders]);

  const selected = filtered.find(o => o.id_pedido === selectedId) ?? filtered[0];

  const availableStatuses = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => { if (o.estado_nombre) set.add(o.estado_nombre.toLowerCase()); });
    return Array.from(set);
  }, [orders]);

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [lineOptions, setLineOptions] = useState<OrderLineOption[]>([]);

  const statusOptions: StatusOption[] = useMemo(
    () => statuses.map((s) => ({ id: s.id_estado, label: s.nombre })),
    [statuses]
  );

  useEffect(() => {
    if (!showNewOrderModal) return;
    fetch("/api/inventory/items?limit=200")
      .then((res) => res.json())
      .then((result) => {
        const items = result.data ?? [];
        setLineOptions(
          items.map((i: any) => ({
            id: i.inventory_id,
            label: `${i.sku} — ${i.product_name}`,
            price: Number(i.price) || 0,
            stock: Number(i.current_stock) || 0,
          }))
        );
      });
  }, [showNewOrderModal]);

  useEffect(() => {
    const targetId = selected?.id_pedido;
    if (!targetId) { setOrderDetail(null); setOrderDetailError(null); return; }
    setOrderDetailLoading(true);
    setOrderDetailError(null);
    fetch(`/api/orders/${targetId}`)
      .then(res => res.json())
      .then((result) => {
        if (result.success) setOrderDetail(result.data);
        else setOrderDetailError(result.error?.message || result.error || 'Error cargando detalle');
      })
      .catch((e) => setOrderDetailError(String(e)))
      .finally(() => setOrderDetailLoading(false));
  }, [selected?.id_pedido]);

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

  if (error) {
    return (
      <div className="w-full max-w-[1400px] mx-auto">
        <EmptyState
          title="Error cargando pedidos"
          description={error}
          actionLabel="Reintentar"
          onAction={refetch}
        />
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
        onAction={() => setShowNewOrderModal(true)}
        bgImage="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=1200&h=300&fit=crop&auto=format"
      />

      <NewOrderModal
        open={showNewOrderModal}
        onOpenChange={setShowNewOrderModal}
        lineOptions={lineOptions}
        statusOptions={statusOptions}
        onSubmit={createOrder}
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
              {availableStatuses.map(s => (
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
                key={order.id_pedido}
                onClick={() => setSelectedId(order.id_pedido)}
                className={`w-full text-left px-6 py-5 border-b border-bone/5 transition-all hover:bg-bone/5 ${
                  selected?.id_pedido === order.id_pedido ? "bg-bone/10 border-l-[3px] border-l-ember" : "border-l-[3px] border-l-transparent"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-geist text-[10px] font-bold tracking-widest text-bone/50 uppercase">#{order.id_pedido}</span>
                  <StatusBadge status={(order.estado_nombre || '').toLowerCase()} />
                </div>
                <p className="text-lg text-bone font-fraunces font-bold mb-1">{order.cliente_nombre}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-bone/50 uppercase tracking-widest">{order.items_count} unit{order.items_count !== 1 ? "s" : ""}</span>
                  <span className="font-geist text-sm text-bone font-medium">{formatColones(order.total)}</span>
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
        {!selected && (
          <FloraGlass className="lg:col-span-3 flex items-center justify-center p-8">
            <EmptyState
              title="No Order Selected"
              description="Select an order from the list to view its details."
            />
          </FloraGlass>
        )}
        {selected && (
          <FloraGlass className="lg:col-span-3 p-8 md:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-8 border-b border-bone/10 pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-ember">{statusIcon((selected.estado_nombre || '').toLowerCase())}</div>
                    <span className="font-geist text-[10px] uppercase tracking-widest text-bone/50 font-bold">#{selected.id_pedido}</span>
                  </div>
                  <h2 className="font-fraunces text-4xl font-bold text-bone">{selected.cliente_nombre}</h2>
                  <p className="text-sm text-bone/60 font-geist mt-1">{selected.cliente_email}</p>
                </div>
                <StatusBadge status={(selected.estado_nombre || '').toLowerCase()} />
              </div>

              {/* Opaque Scrim behind detailed data for 100% legibility */}
              <div className="bg-obsidian/90 border border-bone/5 p-6 rounded-[2px] mb-8 relative">
                {/* Subtle technical corner ticks */}
                <div className="absolute top-2 left-2 w-1 h-1 bg-bone/20"></div>
                <div className="absolute top-2 right-2 w-1 h-1 bg-bone/20"></div>
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-bone/20"></div>
                <div className="absolute bottom-2 right-2 w-1 h-1 bg-bone/20"></div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[["Date", new Date(selected.fecha).toLocaleDateString()], ["Units", String(selected.items_count)], ["Total", formatColones(selected.total)]].map(([k, v]) => (
                    <div key={k} className="bg-bone/5 border border-bone/10 rounded-[2px] p-4 flex flex-col justify-center">
                      <p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mb-1">{k}</p>
                      <p className="text-lg font-geist text-bone">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-4">Requisition Details</p>
              <div className="space-y-2 mb-8">
                {orderDetailError && (
                  <p className="text-xs text-ember font-geist">{orderDetailError}</p>
                )}
                {!orderDetailError && (orderDetail?.items ?? []).map((item) => (
                  <div key={item.id_producto_talla} className="flex items-center gap-4 py-3 px-4 bg-obsidian/60 border border-bone/5 rounded-[2px]">
                    <div className="w-8 h-8 bg-bone/5 rounded-[2px] border border-bone/10 flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-bone/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-bone font-geist truncate">
                        {item.producto_nombre ?? `Producto #${item.id_producto_talla}`}
                      </p>
                      {/* `sku` viene del SP `get_order_details` (migración
                          20260821000000). Queda null solo si la línea apunta a
                          un producto borrado — ahí no se muestra nada en vez de
                          un "SKU" vacío. */}
                      {item.sku && (
                        <p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest">
                          {item.sku}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-bone/50 font-geist">x{item.cantidad}</span>
                    <span className="text-sm text-bone font-geist">{formatColones(item.precio_unitario)}</span>
                  </div>
                ))}
                {!orderDetailError && orderDetailLoading && (
                  <p className="text-xs text-bone/40 font-geist">Cargando detalle...</p>
                )}
              </div>
            </div>

            <div className="border-t border-bone/10 pt-6 mt-auto">
              <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-3">Change Status</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {statuses.map((s) => (
                  <button
                    key={s.id_estado}
                    type="button"
                    disabled={statusUpdating}
                    onClick={async () => {
                      if (s.id_estado === selected.id_estado) return;
                      setStatusUpdating(true);
                      try {
                        await updateStatus(selected.id_pedido, s.id_estado);
                      } catch (e: any) {
                        alert(e.message || 'Error al actualizar el estado');
                      } finally {
                        setStatusUpdating(false);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-[2px] text-[10px] uppercase tracking-widest font-geist font-bold transition-all border disabled:opacity-50 ${
                      selected.id_estado === s.id_estado
                        ? "bg-ember text-obsidian border-ember"
                        : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                    }`}
                  >
                    {s.nombre}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={generatingInvoice}
                  onClick={async () => {
                    setGeneratingInvoice(true);
                    try {
                      const res = await fetch("/api/invoicing", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id_pedido: selected.id_pedido }),
                      });
                      const result = await res.json();
                      if (!result.success) throw new Error(result.error?.message || "Error al generar la factura");
                      window.location.href = "/invoicing";
                    } catch (e: any) {
                      alert(e.message || "Error al generar la factura");
                    } finally {
                      setGeneratingInvoice(false);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-transparent border border-bone/30 text-bone rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-bone hover:text-obsidian hover:border-bone transition-all disabled:opacity-50"
                >
                  <FileText size={14} />
                  {generatingInvoice ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
            </div>
          </FloraGlass>
        )}
      </div>
    </div>
  );
}
