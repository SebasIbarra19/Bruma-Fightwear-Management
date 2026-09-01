"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FormModal, FieldLabel, TextInput, SubmitBar } from "@/components/figma-shared/Modal";
import { cn, formatColones } from "@/lib/utils";

export interface OrderLineOption {
  id: number;
  label: string;
  price: number;
  stock: number;
}

export interface StatusOption {
  id: number;
  label: string;
}

interface NewOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lineOptions: OrderLineOption[];
  statusOptions: StatusOption[];
  onSubmit: (payload: {
    cliente_nombre: string;
    cliente_email?: string;
    cliente_telefono?: string;
    cliente_instagram?: string;
    id_estado: number;
    items: { id_producto_talla: number; cantidad: number; precio_unitario: number }[];
  }) => Promise<void>;
}

export function NewOrderModal({ open, onOpenChange, lineOptions, statusOptions, onSubmit }: NewOrderModalProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [instagram, setInstagram] = useState("");
  const [selected, setSelected] = useState<Map<number, number>>(new Map());
  const [statusId, setStatusId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setNombre("");
      setEmail("");
      setTelefono("");
      setInstagram("");
      setSelected(new Map());
      setStatusId(null);
      setError(null);
    }
  }, [open]);

  const effectiveStatusId = statusId ?? statusOptions[0]?.id ?? null;

  const toggleLine = (id: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, 1);
      return next;
    });
  };

  const setLineQuantity = (id: number, qty: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(id, Math.max(1, qty));
      return next;
    });
  };

  const reset = () => {
    setNombre("");
    setEmail("");
    setTelefono("");
    setInstagram("");
    setSelected(new Map());
    setStatusId(null);
    setError(null);
  };

  /**
   * Líneas que piden más de lo que hay. No impiden registrar el pedido —solo se
   * avisan— porque la venta ya ocurrió; ver el comentario en `handleSubmit`.
   */
  const faltantes = useMemo(
    () =>
      Array.from(selected)
        .map(([id, qty]) => {
          const opt = lineOptions.find((o) => o.id === id);
          if (!opt || qty <= opt.stock) return null;
          return { label: opt.label, falta: qty - opt.stock, disponible: opt.stock };
        })
        .filter((f): f is { label: string; falta: number; disponible: number } => f !== null),
    [selected, lineOptions]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre del cliente es requerido");
      return;
    }
    if (selected.size === 0) {
      setError("Selecciona al menos un producto");
      return;
    }
    // Ya NO se corta por falta de stock. El pedido es un hecho del negocio: si
    // el cliente pidió 5, pidió 5, y negarlo no hace aparecer las unidades que
    // faltan — solo obliga a no registrar la venta. El faltante se avisa arriba
    // (ver `faltantes`) y queda visible como stock negativo en Inventory y en
    // el panel de reposición del dashboard.
    if (!effectiveStatusId) {
      setError("No hay estados disponibles para asignar");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = lineOptions
        .filter((o) => selected.has(o.id))
        .map((o) => ({ id_producto_talla: o.id, cantidad: selected.get(o.id) || 1, precio_unitario: o.price }));
      await onSubmit({
        cliente_nombre: nombre.trim(),
        cliente_email: email.trim() || undefined,
        cliente_telefono: telefono.trim() || undefined,
        cliente_instagram: instagram.trim() || undefined,
        id_estado: effectiveStatusId,
        items,
      });
      reset();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Error al crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal open={open} onOpenChange={onOpenChange} eyebrow="New Drop" title="New Order">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Customer Name</FieldLabel>
            <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <FieldLabel>Email (Optional)</FieldLabel>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@email.com" />
          </div>
          <div>
            <FieldLabel>Phone (Optional)</FieldLabel>
            <TextInput type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="8888-0000" />
          </div>
          <div>
            <FieldLabel>Instagram (Optional)</FieldLabel>
            <TextInput value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" />
          </div>
        </div>

        <div>
          <FieldLabel>Products</FieldLabel>
          <div className="max-h-48 overflow-y-auto border border-bone/15 rounded-[2px] divide-y divide-bone/10">
            {lineOptions.length === 0 && (
              <p className="px-3 py-4 text-xs text-bone/40 font-geist">No products with available stock.</p>
            )}
            {lineOptions.map((opt) => {
              const qty = selected.get(opt.id);
              return (
                <div
                  key={opt.id}
                  className="flex items-center justify-between px-3 py-2.5 text-sm font-geist text-bone hover:bg-bone/5"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selected.has(opt.id)}
                      onChange={() => toggleLine(opt.id)}
                      className="accent-ember shrink-0"
                    />
                    <span className="truncate">{opt.label}</span>
                    <span className="text-bone/40 text-xs shrink-0">({opt.stock} in stock)</span>
                  </label>
                  <div className="flex items-center gap-3 shrink-0">
                    {qty !== undefined && (
                      <div className="flex items-center border border-bone/20 rounded-[2px]">
                        <button
                          type="button"
                          onClick={() => setLineQuantity(opt.id, qty - 1)}
                          className="w-6 h-6 flex items-center justify-center text-bone/60 hover:text-ember text-xs"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setLineQuantity(opt.id, qty + 1)}
                          className="w-6 h-6 flex items-center justify-center text-bone/60 hover:text-ember text-xs"
                        >
                          +
                        </button>
                      </div>
                    )}
                    <span className="text-bone/60 w-14 text-right">{formatColones(opt.price)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel>Status</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusId(s.id)}
                className={cn(
                  "px-3 py-1.5 rounded-[2px] text-[10px] uppercase tracking-widest font-geist font-bold transition-all border",
                  effectiveStatusId === s.id
                    ? "bg-ember text-obsidian border-ember"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Aviso, no bloqueo: el pedido se registra igual. Va en ámbar y no en
            rojo a propósito — rojo se lee como "error, no podés seguir", y acá
            sí podés. Lo que comunica es una consecuencia: vas a quedar debiendo
            stock. */}
        {faltantes.length > 0 && (
          <div className="rounded-[2px] border border-amber-500/40 bg-amber-500/10 px-4 py-3">
            <p className="font-geist text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Stock insuficiente — el pedido se registra igual
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {faltantes.map((f) => (
                <li key={f.label} className="font-geist text-xs text-bone/80">
                  <span className="text-amber-400 font-bold">{f.label}</span>
                  {" — "}faltan {f.falta} {f.falta === 1 ? "unidad" : "unidades"}
                  {" "}(hay {f.disponible})
                </li>
              ))}
            </ul>
            <p className="mt-2 font-geist text-[10px] text-bone/50">
              Quedará como stock negativo hasta que repongas.
            </p>
          </div>
        )}

        <SubmitBar submitLabel="Place Order" loading={loading} error={error} />
      </form>
    </FormModal>
  );
}
