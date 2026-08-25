"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  FormModal,
  FieldLabel,
  TextInput,
  TextArea,
  ChipPicker,
  InlineAddChip,
  SubmitBar,
} from "@/components/figma-shared/Modal";
import { ProductImages } from "./ProductImages";

const SIZE_OPTIONS = ["OS", "XS", "S", "M", "L", "XL", "XXL"];

interface NamedOption {
  id: number;
  name: string;
}

interface ProductDetail {
  id: number;
  nombre: string;
  descripcion: string | null;
  codigo: string | null;
  id_categoria: number | null;
  id_coleccion: number | null;
  activo: boolean;
  variantes: {
    id_variante: number;
    precio_variante: number | null;
    stock_tallas: { id_producto_talla: number; talla_codigo: string | null; stock: number }[];
  }[];
}

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number | null;
  categories: NamedOption[];
  collections: NamedOption[];
  onCreateCategory: (name: string, prefijo?: string) => Promise<NamedOption>;
  onCreateCollection: (name: string) => Promise<NamedOption>;
  onSaved: () => void;
}

export function EditProductModal({
  open,
  onOpenChange,
  productId,
  categories,
  collections,
  onCreateCategory,
  onCreateCollection,
  onSaved,
}: EditProductModalProps) {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [fetching, setFetching] = useState(false);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [precio, setPrecio] = useState("");
  const [removedSizeIds, setRemovedSizeIds] = useState<Set<number>>(new Set());
  const [newSizes, setNewSizes] = useState<Set<string>>(new Set());
  const [localCategories, setLocalCategories] = useState(categories);
  const [localCollections, setLocalCollections] = useState(collections);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setLocalCategories(categories), [categories]);
  useEffect(() => setLocalCollections(collections), [collections]);

  useEffect(() => {
    if (!open || !productId) {
      setDetail(null);
      return;
    }
    setFetching(true);
    setError(null);
    fetch(`/api/catalog/${productId}`)
      .then((r) => r.json())
      .then((result) => {
        if (!result.success) throw new Error(result.error?.message || 'Error cargando el producto');
        const d: ProductDetail = result.data;
        setDetail(d);
        setNombre(d.nombre);
        setCodigo(d.codigo || "");
        setDescripcion(d.descripcion || "");
        setCategoryId(d.id_categoria);
        setCollectionId(d.id_coleccion);
        setPrecio(String(d.variantes[0]?.precio_variante ?? ""));
        setRemovedSizeIds(new Set());
        setNewSizes(new Set());
      })
      .catch((e) => setError(e.message || "Error cargando el producto"))
      .finally(() => setFetching(false));
  }, [open, productId]);

  const existingSizes = detail?.variantes[0]?.stock_tallas ?? [];
  const existingCodes = new Set(existingSizes.map((s) => s.talla_codigo).filter(Boolean));
  const availableToAdd = SIZE_OPTIONS.filter((s) => !existingCodes.has(s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    if (!nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const variant = detail.variantes[0];
      const res = await fetch(`/api/catalog/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          codigo: codigo.trim() || undefined,
          descripcion: descripcion.trim(),
          id_categoria: categoryId,
          id_coleccion: collectionId,
          variant: variant
            ? { id_variante: variant.id_variante, precio_variante: parseFloat(precio) || 0 }
            : undefined,
          removeSizeIds: Array.from(removedSizeIds),
          addSizes: variant
            ? Array.from(newSizes).map((sizeCode) => ({ codigo: sizeCode, stock: 0, precio: parseFloat(precio) || 0 }))
            : [],
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || 'Error al guardar el producto');
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal open={open} onOpenChange={onOpenChange} eyebrow="Edit Gear" title="Edit Product">
      {fetching && <p className="text-sm text-bone/50 font-geist">Cargando...</p>}
      {!fetching && !detail && error && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ember font-geist">{error}</p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="self-start px-4 py-2 text-xs font-geist uppercase tracking-widest text-bone/60 border border-bone/20 rounded-[2px] hover:border-bone/50 hover:text-bone transition-colors"
          >
            Close
          </button>
        </div>
      )}
      {!fetching && detail && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <FieldLabel>Product Name</FieldLabel>
            <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>

          <div>
            <FieldLabel>Product Code (SKU)</FieldLabel>
            <TextInput value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </div>

          <div>
            <FieldLabel>Images</FieldLabel>
            <ProductImages productId={detail.id} />
          </div>

          <div>
            <FieldLabel>Price (₡)</FieldLabel>
            <TextInput type="number" min="0" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </div>

          <div>
            <FieldLabel>Collection</FieldLabel>
            <ChipPicker
              options={localCollections.map((c) => ({ id: c.id, label: c.name }))}
              selected={collectionId !== null ? new Set([collectionId]) : new Set()}
              onToggle={(id) => setCollectionId(id as number)}
            />
            <InlineAddChip
              placeholder="New collection name..."
              onAdd={async (name) => {
                const created = await onCreateCollection(name);
                setLocalCollections((prev) => [...prev, created]);
                setCollectionId(created.id);
              }}
            />
          </div>

          <div>
            <FieldLabel>Category</FieldLabel>
            <ChipPicker
              options={localCategories.map((c) => ({ id: c.id, label: c.name }))}
              selected={categoryId !== null ? new Set([categoryId]) : new Set()}
              onToggle={(id) => setCategoryId(id as number)}
            />
            <InlineAddChip
              placeholder="New category name..."
              extraPlaceholder="SKU"
              extraMaxLength={3}
              onAdd={async (name, prefijo) => {
                const created = await onCreateCategory(name, prefijo);
                setLocalCategories((prev) => [...prev, created]);
                setCategoryId(created.id);
              }}
            />
          </div>

          <div>
            <FieldLabel>Existing Sizes</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {existingSizes.map((s) => {
                const marked = removedSizeIds.has(s.id_producto_talla);
                return (
                  <button
                    key={s.id_producto_talla}
                    type="button"
                    disabled={s.stock > 0}
                    title={s.stock > 0 ? "Reduce stock to 0 in Inventory before removing" : "Click to remove"}
                    onClick={() =>
                      setRemovedSizeIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(s.id_producto_talla)) next.delete(s.id_producto_talla);
                        else next.add(s.id_producto_talla);
                        return next;
                      })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-[10px] uppercase tracking-widest font-geist font-bold transition-all border ${
                      marked
                        ? "bg-red-500/10 text-red-400 border-red-500/30 line-through"
                        : "bg-bone/5 border-bone/20 text-bone/70"
                    } ${s.stock > 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-ember/50"}`}
                  >
                    {s.talla_codigo || "?"} · {s.stock} in stock
                    {s.stock === 0 && <X size={10} />}
                  </button>
                );
              })}
              {existingSizes.length === 0 && (
                <p className="text-xs text-bone/40 font-geist">No hay tallas registradas.</p>
              )}
            </div>
          </div>

          {availableToAdd.length > 0 && (
            <div>
              <FieldLabel>Add New Size</FieldLabel>
              <ChipPicker
                options={availableToAdd.map((s) => ({ id: s, label: s }))}
                selected={newSizes}
                onToggle={(id) =>
                  setNewSizes((prev) => {
                    const next = new Set(prev);
                    if (next.has(id as string)) next.delete(id as string);
                    else next.add(id as string);
                    return next;
                  })
                }
              />
              <p className="text-[10px] text-bone/40 font-geist mt-1">New sizes start at 0 stock — add stock via Inventory.</p>
            </div>
          )}

          <div>
            <FieldLabel>Description</FieldLabel>
            <TextArea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>

          <SubmitBar submitLabel="Save Changes" loading={loading} error={error} />
        </form>
      )}
    </FormModal>
  );
}
