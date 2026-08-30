"use client";

import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, SlidersHorizontal, RotateCcw } from "lucide-react";
import { FormModal, FieldLabel, TextInput, NumberStepper, DropdownField, SubmitBar } from "@/components/figma-shared/Modal";
import { HoldToConfirmButton } from "@/components/figma-shared/HoldToConfirmButton";
import { cn } from "@/lib/utils";

const MOVEMENT_TYPES = [
  { id: "in", label: "Stock In", description: "Received goods", icon: ArrowDown, color: "text-[#7ddb7d] border-[#7ddb7d]/40 bg-[#7ddb7d]/10" },
  { id: "out", label: "Stock Out", description: "Shipped or sold", icon: ArrowUp, color: "text-ember border-ember/40 bg-ember/10" },
  { id: "adjustment", label: "Adjustment", description: "Manual correction", icon: SlidersHorizontal, color: "text-bone border-bone/40 bg-bone/10" },
  { id: "return", label: "Return", description: "Customer return", icon: RotateCcw, color: "text-[#7ddb7d] border-[#7ddb7d]/40 bg-[#7ddb7d]/10" },
] as const;

type MovementTypeId = (typeof MOVEMENT_TYPES)[number]["id"];

export interface SkuOption {
  id: number | null;
  idVariante: number;
  sku: string;
  productName: string;
  currentStock: number;
}

interface StockMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skuOptions: SkuOption[];
  /**
   * SKU preseleccionado al abrir. Lo usa el clic sobre una fila del inventario:
   * si ya elegiste el producto en la tabla, volver a buscarlo en el desplegable
   * es trabajo repetido. Abriendo desde el botón general viene `null` y el
   * formulario arranca vacío, como siempre.
   *
   * Se recibe el SKU y no la clave interna (`id-idVariante`) porque la fila de
   * la tabla no carga `variant_id`; el SKU sí lo tiene y es único por fila de
   * stock, así que alcanza para resolverlo contra `skuOptions`.
   */
  initialSku?: string | null;
  onSubmit: (payload: { inventoryId: number | null; idVariante?: number; quantityChange: number; reason: string; tipoMovimiento?: string; forzar?: boolean }) => Promise<void>;
}

export function StockMovementModal({ open, onOpenChange, skuOptions, onSubmit, initialSku = null }: StockMovementModalProps) {
  const [movementType, setMovementType] = useState<MovementTypeId>("in");
  const [selectedSkuKey, setSelectedSkuKey] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingNegative, setPendingNegative] = useState<{ option: SkuOption; delta: number; tipoMovimiento?: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setMovementType("in");
      setSelectedSkuKey(null);
      setQuantity(1);
      setDirection(1);
      setNote("");
      setError(null);
      setPendingNegative(null);
    }
  }, [open]);

  // La preselección se resuelve acá y no en el estado inicial porque
  // `skuOptions` llega por red DESPUÉS de que el modal se monta: al montarse la
  // lista está vacía y no habría con qué emparejar.
  useEffect(() => {
    if (!open || !initialSku || skuOptions.length === 0) return;
    const opt = skuOptions.find((o) => o.sku === initialSku);
    if (opt) setSelectedSkuKey(`${opt.id ?? 'v'}-${opt.idVariante}`);
  }, [open, initialSku, skuOptions]);

  useEffect(() => {
    setPendingNegative(null);
  }, [selectedSkuKey, quantity, movementType, direction]);

  const activeType = MOVEMENT_TYPES.find((t) => t.id === movementType)!;

  const performSubmit = async (option: SkuOption, delta: number, tipoMovimiento: string | undefined, forzar: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        inventoryId: option.id,
        idVariante: option.id === null ? option.idVariante : undefined,
        quantityChange: delta,
        reason: note.trim() || activeType.description,
        tipoMovimiento,
        forzar,
      });
      setPendingNegative(null);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Error al registrar el movimiento");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedOption = skuOptions.find((o) => `${o.id ?? 'v'}-${o.idVariante}` === selectedSkuKey);
    if (!selectedOption) {
      setError("Selecciona un SKU");
      return;
    }
    if (selectedOption.id === null && movementType !== "in") {
      setError("Este producto no tiene tallas registradas todavía — solo se puede usar Stock In para darlo de alta.");
      return;
    }
    const sign = movementType === "out" ? -1 : movementType === "adjustment" ? direction : 1;
    const delta = sign * quantity;
    const tipoMovimiento = movementType === "adjustment" ? "ajuste" : undefined;

    if (delta < 0 && Math.abs(delta) > selectedOption.currentStock) {
      setPendingNegative({ option: selectedOption, delta, tipoMovimiento });
      return;
    }

    await performSubmit(selectedOption, delta, tipoMovimiento, false);
  };

  return (
    <FormModal open={open} onOpenChange={onOpenChange} eyebrow="Inventory Event" title="Log Movement">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <FieldLabel>Movement Type</FieldLabel>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {MOVEMENT_TYPES.map((t) => {
              const selectedOption = skuOptions.find((o) => `${o.id ?? 'v'}-${o.idVariante}` === selectedSkuKey);
              const disabledForUnstocked = selectedOption?.id === null && t.id !== "in";
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={disabledForUnstocked}
                  onClick={() => setMovementType(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 rounded-[2px] border text-[10px] font-geist uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed",
                    movementType === t.id ? t.color : "text-bone/40 border-bone/15 hover:border-bone/40"
                  )}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className={cn("px-3 py-2 rounded-[2px] border text-xs font-geist", activeType.color)}>
            {activeType.label} — {activeType.description}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <FieldLabel>Product SKU</FieldLabel>
            <DropdownField
              value={selectedSkuKey}
              onChange={(key) => {
                setSelectedSkuKey(key);
                const opt = skuOptions.find((o) => `${o.id ?? 'v'}-${o.idVariante}` === key);
                if (opt?.id === null) setMovementType("in");
              }}
              placeholder="Select SKU..."
              options={skuOptions.map((opt) => ({
                value: `${opt.id ?? 'v'}-${opt.idVariante}`,
                label: opt.id
                  ? `${opt.sku} — ${opt.productName} (${opt.currentStock} in stock)`
                  : `${opt.sku} — ${opt.productName} (no size set yet)`,
              }))}
            />
          </div>
          <div>
            <FieldLabel>{movementType === "adjustment" ? "Quantity (+/-)" : "Quantity"}</FieldLabel>
            <div className="flex gap-2">
              {movementType === "adjustment" && (
                <select
                  value={direction}
                  onChange={(e) => setDirection(Number(e.target.value) as 1 | -1)}
                  className="px-2 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-sm font-geist"
                >
                  <option value={1}>+</option>
                  <option value={-1}>−</option>
                </select>
              )}
              <NumberStepper value={quantity} onChange={setQuantity} min={1} />
            </div>
          </div>
        </div>

        <div>
          <FieldLabel>Note</FieldLabel>
          <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason or reference..." />
        </div>

        {pendingNegative ? (
          <div className="flex flex-col gap-3 pt-2">
            <div className="px-3 py-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-[2px] font-geist">
              Esta acción puede generar stock negativo. ¿Continuar de todas formas?
            </div>
            {error && (
              <div className="px-3 py-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-[2px] font-geist">
                {error}
              </div>
            )}
            <HoldToConfirmButton
              label="SÉ LO QUE HAGO"
              disabled={loading}
              onConfirm={() => performSubmit(pendingNegative.option, pendingNegative.delta, pendingNegative.tipoMovimiento, true)}
            />
          </div>
        ) : (
          <SubmitBar submitLabel="Log It" loading={loading} error={error} />
        )}
      </form>
    </FormModal>
  );
}
