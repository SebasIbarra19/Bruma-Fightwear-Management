"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Download, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { InvoiceListItem, InvoiceDetail, DiscountKind } from "@/lib/database/adapters/invoicing-adapter";
import { formatColones } from "@/lib/utils";
import { fetchApi } from '@/lib/api/fetch-cliente';
import { fetchConCache, invalidarCache } from '@/lib/api/cache-cliente';

// Las filas en edición guardan los números como STRING a propósito. Si se guardan
// como number, borrar el campo para escribir otro valor lo convierte en "" ->
// parseFloat("") es NaN -> NaN || 0 = 0, y el input salta de vuelta a 0 sin dejar
// escribir. Se convierten a número solo al calcular y al guardar.
interface EditItemRow {
  key: string;
  descripcion: string;
  cantidad: string;
  precio_unitario: string;
}

interface EditDiscountRow {
  key: string;
  descripcion: string;
  tipo: DiscountKind;
  valor: string;
}

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [editItems, setEditItems] = useState<EditItemRow[]>([]);
  const [editDescuentos, setEditDescuentos] = useState<EditDiscountRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // `usarCache` separa los dos motivos por los que se llama a esto. Al montar
  // conviene lo cacheado —pinta al instante y revalida detras—; despues de
  // guardar o anular una factura NO, porque mostraria el estado anterior al
  // cambio que se acaba de hacer.
  const refetchList = (usarCache = false) => {
    setLoading(true);
    setError(null);
    if (!usarCache) invalidarCache("/api/invoicing");
    fetchConCache<InvoiceListItem[]>("/api/invoicing", (filas) => {
      setInvoices(filas ?? []);
      setLoading(false);
    })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refetchList(true); }, []);

  useEffect(() => {
    if (selectedId === null && invoices.length > 0) setSelectedId(invoices[0].id_factura);
  }, [invoices, selectedId]);

  useEffect(() => {
    if (selectedId === null) { setDetail(null); return; }
    setDetailLoading(true);
    setDetailError(null);
    fetchApi(`/api/invoicing/${selectedId}`)
      .then((r) => r.json())
      .then((result) => {
        if (!result.success) { setDetailError(result.error?.message || "Error cargando factura"); return; }
        setDetail(result.data);
        setEditItems(
          (result.data.items ?? []).map((it: any) => ({
            key: `i${it.id_item}`,
            descripcion: it.descripcion,
            cantidad: String(it.cantidad),
            precio_unitario: String(it.precio_unitario),
          }))
        );
        setEditDescuentos(
          (result.data.descuentos ?? []).map((d: any) => ({
            key: `d${d.id_descuento}`,
            descripcion: d.descripcion,
            tipo: d.tipo,
            valor: String(d.valor),
          }))
        );
      })
      .catch((e) => setDetailError(String(e)))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const matchSearch = !q || inv.numero_factura.toLowerCase().includes(q) || (inv.cliente_nombre || "").toLowerCase().includes(q) || (inv.cliente_email || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || inv.estado_calculado === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  const num = (v: string) => parseFloat(v) || 0;

  const editSubtotal = editItems.reduce((s, i) => s + num(i.cantidad) * num(i.precio_unitario), 0);

  // Un porcentaje siempre se calcula sobre el subtotal bruto, nunca en cascada
  // sobre otro descuento. Mismo criterio que usa update_invoice en la base.
  const discountAmount = (d: EditDiscountRow) =>
    d.tipo === "porcentaje" ? Math.round(editSubtotal * num(d.valor)) / 100 : num(d.valor);

  const editDescuentoTotal = editDescuentos.reduce((s, d) => s + discountAmount(d), 0);
  const editTotal = editSubtotal - editDescuentoTotal;
  const descuentoExcede = editDescuentoTotal > editSubtotal;

  const updateItemField = (idx: number, field: "descripcion" | "cantidad" | "precio_unitario", value: string) => {
    setEditItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const addItem = () => {
    setEditItems((prev) => [...prev, { key: `new-i-${Date.now()}`, descripcion: "", cantidad: "1", precio_unitario: "" }]);
  };

  const removeItem = (idx: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateDiscountField = (idx: number, field: "descripcion" | "tipo" | "valor", value: string) => {
    setEditDescuentos((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        // Cambiar de tipo LIMPIA el valor: un mismo número significa cosas
        // distintas en cada modo y el arrastre pasaba desapercibido. De ₡ a %,
        // 5000 se volvía 5000% (visible, molesto). Al revés —20% tipeado que
        // queda como ₡20— no lo detecta nada, ni la UI ni la base: se factura
        // mal y en silencio. Por eso se limpia en ambos sentidos.
        if (field === "tipo" && value !== d.tipo) {
          return { ...d, tipo: value as DiscountKind, valor: "" };
        }
        return { ...d, [field]: value };
      })
    );
  };

  const addDiscount = () => {
    setEditDescuentos((prev) => [...prev, { key: `new-d-${Date.now()}`, descripcion: "Descuento KIT", tipo: "fijo", valor: "" }]);
  };

  const removeDiscount = (idx: number) => {
    setEditDescuentos((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveChanges = async () => {
    if (!detail) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetchApi(`/api/invoicing/${detail.factura.id_factura}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: editItems.map((it) => ({
            descripcion: it.descripcion,
            cantidad: Math.max(1, parseInt(it.cantidad, 10) || 1),
            precio_unitario: num(it.precio_unitario),
          })),
          descuentos: editDescuentos.map((d) => ({
            descripcion: d.descripcion.trim() || "Descuento",
            tipo: d.tipo,
            valor: num(d.valor),
          })),
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || "Error al guardar");
      setDetail(result.data);
      setEditItems(
        (result.data.items ?? []).map((it: any) => ({
          key: `i${it.id_item}`,
          descripcion: it.descripcion,
          cantidad: String(it.cantidad),
          precio_unitario: String(it.precio_unitario),
        }))
      );
      setEditDescuentos(
        (result.data.descuentos ?? []).map((d: any) => ({
          key: `d${d.id_descuento}`,
          descripcion: d.descripcion,
          tipo: d.tipo,
          valor: String(d.valor),
        }))
      );
      refetchList();
    } catch (e: any) {
      setSaveError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async () => {
    if (!detail) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetchApi(`/api/invoicing/${detail.factura.id_factura}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_paid: true }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || "Error al marcar como pagada");
      setDetail(result.data);
      refetchList();
    } catch (e: any) {
      setSaveError(e.message || "Error al marcar como pagada");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-[1400px] mx-auto">
        <Skeleton className="w-full h-[110px] rounded-[2px]" />
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
        <EmptyState title="Error cargando facturas" description={error} actionLabel="Reintentar" onAction={refetchList} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-4">
      <PageHeader
        label="Finance"
        title="Invoicing"
        sub="Manage and preview customer invoices."
        bgImage="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=300&fit=crop&auto=format"
      />

      <div className="flex flex-col gap-3">
        <div className="relative group">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/40 group-focus-within:text-ember transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer, email..."
            className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
          />
        </div>
        <div className="flex items-center gap-3 bg-obsidian/40 border border-bone/10 p-4 rounded-[4px] backdrop-blur-md">
          <span className="text-[10px] text-bone/50 font-geist uppercase tracking-widest shrink-0">Status:</span>
          <div className="flex flex-wrap gap-2">
            {["all", "paid", "pending", "overdue"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  statusFilter === s ? "bg-ember/10 text-ember border-ember/30 font-bold" : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <FloraGlass className="lg:col-span-2 flex flex-col !overflow-visible">
          <div className="px-6 py-4 border-b border-bone/10">
            <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">All Invoices</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto tactical-scrollbar flex flex-col">
            {filtered.map((inv) => (
              <button
                key={inv.id_factura}
                onClick={() => setSelectedId(inv.id_factura)}
                className={`w-full text-left px-6 py-5 border-b border-bone/5 transition-all hover:bg-bone/5 ${
                  selectedId === inv.id_factura ? "bg-bone/10 border-l-[3px] border-l-ember" : "border-l-[3px] border-l-transparent"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-geist text-[10px] font-bold tracking-widest text-bone/50 uppercase">{inv.numero_factura}</span>
                  <StatusBadge status={inv.estado_calculado} />
                </div>
                <p className="text-lg text-bone font-fraunces font-bold mb-1">{inv.cliente_nombre || "Sin nombre"}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-bone/50 uppercase tracking-widest">Due {new Date(inv.fecha_vencimiento).toLocaleDateString()}</span>
                  <span className="font-geist text-sm text-bone font-medium">{formatColones(inv.total)}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-6 py-10 text-center text-xs text-bone/40 font-geist uppercase tracking-widest">No invoices match filters.</p>
            )}
          </div>
        </FloraGlass>

        {!detail && !detailLoading && (
          <FloraGlass className="lg:col-span-3 flex items-center justify-center p-8">
            <EmptyState title="No Invoice Selected" description="Select an invoice from the list, or generate one from an order's detail panel." />
          </FloraGlass>
        )}

        {detailLoading && <Skeleton className="lg:col-span-3 h-[450px] rounded-[2px]" />}

        {detailError && !detailLoading && (
          <FloraGlass className="lg:col-span-3 p-8">
            <p className="text-sm text-ember font-geist">{detailError}</p>
          </FloraGlass>
        )}

        {detail && !detailLoading && (
          <FloraGlass className="lg:col-span-3 p-8 md:p-10 flex flex-col justify-between">
            <div className="flex grow flex-col">
              <div className="flex items-start justify-between border-b border-bone/10 pb-6">
                <div>
                  <p className="font-geist text-[10px] uppercase tracking-widest text-bone/50 font-bold mb-2">{detail.factura.numero_factura}</p>
                  <h2 className="font-fraunces text-4xl font-bold text-bone">{detail.factura.cliente_nombre}</h2>
                  <p className="text-sm text-bone/60 font-geist mt-1">{detail.factura.cliente_email}</p>
                </div>
                <StatusBadge status={detail.factura.estado_calculado} />
              </div>

              {/* Relleno del sándwich: el bloque opaco abarca TODO el segmento
                  central —de la divisoria del encabezado a la de los botones—,
                  no solo los items. Issued/Due/Order quedaban fuera, leyéndose
                  directamente contra la foto de fondo del FloraGlass.
                  `-mx-8/-mx-10` cancelan el padding del FloraGlass para que la
                  banda sangre hasta el borde de la tarjeta (su `overflow:
                  hidden` la recorta contra el radio); `px-8/px-10` devuelven la
                  alineación del contenido con el encabezado y las divisorias.
                  `grow` la estira hasta la divisoria de los botones cuando
                  sobra alto, para que el relleno siempre toque los dos panes. */}
              <div className="grow bg-obsidian/90 -mx-8 px-8 py-6 md:-mx-10 md:px-10">
                <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                  <div><p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mb-1">Issued</p><p className="text-bone font-geist">{new Date(detail.factura.fecha_emision).toLocaleDateString()}</p></div>
                  <div><p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mb-1">Due</p><p className="text-bone font-geist">{new Date(detail.factura.fecha_vencimiento).toLocaleDateString()}</p></div>
                  <div><p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mb-1">Order</p><p className="text-bone font-geist">#{detail.factura.id_pedido}</p></div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">Items</p>
                  <button type="button" onClick={addItem} className="flex items-center gap-1 text-[10px] text-ember font-geist uppercase tracking-widest hover:text-ember/80">
                    <Plus size={12} /> Add Line
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {editItems.map((item, idx) => (
                    <div key={item.key} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        value={item.descripcion}
                        onChange={(e) => updateItemField(idx, "descripcion", e.target.value)}
                        placeholder="Description"
                        className="col-span-6 px-2 py-1.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-xs font-geist focus:outline-none focus:border-ember"
                      />
                      <input
                        type="number" min="1" value={item.cantidad}
                        onChange={(e) => updateItemField(idx, "cantidad", e.target.value)}
                        className="col-span-2 px-2 py-1.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-xs font-geist focus:outline-none focus:border-ember"
                      />
                      <input
                        type="number" min="0" step="0.01" value={item.precio_unitario} placeholder="0.00"
                        onChange={(e) => updateItemField(idx, "precio_unitario", e.target.value)}
                        className="col-span-3 px-2 py-1.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-xs font-geist focus:outline-none focus:border-ember"
                      />
                      <button type="button" onClick={() => removeItem(idx)} className="col-span-1 flex justify-center text-bone/40 hover:text-ember">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-6 mb-3 pt-4 border-t border-bone/10">
                  <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">Discounts</p>
                  <button type="button" onClick={addDiscount} className="flex items-center gap-1 text-[10px] text-ember font-geist uppercase tracking-widest hover:text-ember/80">
                    <Plus size={12} /> Add Discount
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {editDescuentos.length === 0 && (
                    <p className="text-[10px] text-bone/30 font-geist">Sin descuentos. Usá &ldquo;Add Discount&rdquo; para agregar uno (ej. Descuento KIT).</p>
                  )}
                  {editDescuentos.map((d, idx) => (
                    <div key={d.key} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        value={d.descripcion}
                        onChange={(e) => updateDiscountField(idx, "descripcion", e.target.value)}
                        placeholder="Nombre del descuento"
                        className="col-span-6 px-2 py-1.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-xs font-geist focus:outline-none focus:border-ember"
                      />
                      <div className="col-span-2 flex rounded-[2px] overflow-hidden border border-bone/20">
                        {(["fijo", "porcentaje"] as DiscountKind[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => updateDiscountField(idx, "tipo", t)}
                            className={`flex-1 py-1.5 text-[10px] font-geist font-bold transition-all ${
                              d.tipo === t ? "bg-ember text-obsidian" : "bg-bone/5 text-bone/50 hover:text-bone"
                            }`}
                          >
                            {t === "fijo" ? "₡" : "%"}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number" min="0" step="0.01"
                        // Techo de 100 solo en porcentaje. Es la misma regla que
                        // el CHECK `factura_descuento_porcentaje_max` de la base
                        // (migración 20260825010000): la UI avisa temprano, la
                        // base garantiza que no entre por ningún otro camino.
                        max={d.tipo === "porcentaje" ? 100 : undefined}
                        value={d.valor} placeholder={d.tipo === "porcentaje" ? "10" : "0.00"}
                        onChange={(e) => updateDiscountField(idx, "valor", e.target.value)}
                        className="col-span-2 px-2 py-1.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-xs font-geist focus:outline-none focus:border-ember"
                      />
                      <span className="col-span-1 text-[10px] text-bone/50 font-geist text-right">-{formatColones(discountAmount(d))}</span>
                      <button type="button" onClick={() => removeDiscount(idx)} className="col-span-1 flex justify-center text-bone/40 hover:text-ember">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-bone/40 font-geist uppercase tracking-widest text-[10px]">Subtotal</span>
                      <span className="font-geist text-bone/80">{formatColones(editSubtotal)}</span>
                    </div>
                    {editDescuentos.map((d) => (
                      <div key={d.key} className="flex justify-between text-sm">
                        <span className="text-bone/40 font-geist uppercase tracking-widest text-[10px] truncate pr-2">
                          {d.descripcion.trim() || "Descuento"}{d.tipo === "porcentaje" ? ` (${num(d.valor)}%)` : ""}
                        </span>
                        <span className="font-geist text-bone/80 shrink-0">-{formatColones(discountAmount(d))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3 border-t border-bone/10">
                      <span className="font-fraunces font-bold text-bone text-lg uppercase tracking-tight">Total</span>
                      <span className="font-fraunces font-bold text-ember text-2xl">{formatColones(editTotal)}</span>
                    </div>
                  </div>
                </div>
                {descuentoExcede && (
                  <p className="text-xs text-ember font-geist mt-4">
                    El descuento ({formatColones(editDescuentoTotal)}) no puede superar el subtotal ({formatColones(editSubtotal)}).
                  </p>
                )}
                {saveError && <p className="text-xs text-ember font-geist mt-4">{saveError}</p>}
              </div>
            </div>

            <div className="flex gap-4 border-t border-bone/10 pt-6 mt-auto">
              <button
                type="button" onClick={saveChanges} disabled={saving || descuentoExcede}
                className="flex items-center gap-2 px-6 py-3 bg-ember text-obsidian rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-ember/90 transition-all shadow-[0_0_15px_rgba(255,77,28,0.2)] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {detail.factura.estado_calculado !== "paid" && (
                <button
                  type="button" onClick={markPaid} disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-transparent border border-[#7ddb7d]/50 text-[#7ddb7d] rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-[#7ddb7d]/10 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 size={14} /> Mark Paid
                </button>
              )}
              <a
                href={`/api/invoicing/${detail.factura.id_factura}/pdf`}
                className="flex items-center gap-2 px-6 py-3 bg-transparent border border-bone/30 text-bone rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-bone hover:text-obsidian hover:border-bone transition-all"
              >
                <Download size={14} /> Download PDF
              </a>
            </div>
          </FloraGlass>
        )}
      </div>
    </div>
  );
}
