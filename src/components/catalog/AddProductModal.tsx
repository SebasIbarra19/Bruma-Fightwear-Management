"use client";

import React, { useEffect, useState } from "react";
import {
  FormModal,
  FieldLabel,
  TextInput,
  TextArea,
  NumberStepper,
  ChipPicker,
  InlineAddChip,
  SubmitBar,
} from "@/components/figma-shared/Modal";

const SIZE_OPTIONS = ["OS", "XS", "S", "M", "L", "XL", "XXL"].map((s) => ({ id: s, label: s }));

interface NamedOption {
  id: number;
  name: string;
}

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: NamedOption[];
  collections: NamedOption[];
  onCreateCategory: (name: string, prefijo?: string) => Promise<NamedOption>;
  onCreateCollection: (name: string) => Promise<NamedOption>;
  onSubmit: (payload: {
    nombre: string;
    codigo?: string;
    descripcion?: string;
    id_categoria: number | null;
    id_coleccion: number | null;
    precio: number;
    stockQty: number;
    sizes: string[];
  }) => Promise<void>;
}

export function AddProductModal({
  open,
  onOpenChange,
  categories,
  collections,
  onCreateCategory,
  onCreateCollection,
  onSubmit,
}: AddProductModalProps) {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [precio, setPrecio] = useState("");
  const [stockQty, setStockQty] = useState(0);
  const [sizes, setSizes] = useState<Set<string | number>>(new Set());
  const [localCategories, setLocalCategories] = useState(categories);
  const [localCollections, setLocalCollections] = useState(collections);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setLocalCategories(categories), [categories]);
  useEffect(() => setLocalCollections(collections), [collections]);

  useEffect(() => {
    if (!open) {
      setNombre(""); setCodigo(""); setDescripcion("");
      setCategoryId(null); setCollectionId(null);
      setPrecio(""); setStockQty(0); setSizes(new Set());
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        codigo: codigo.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
        id_categoria: categoryId,
        id_coleccion: collectionId,
        precio: parseFloat(precio) || 0,
        stockQty,
        sizes: Array.from(sizes) as string[],
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Error al crear el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal open={open} onOpenChange={onOpenChange} eyebrow="Join the Lineup" title="Add to Catalog">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <FieldLabel>Product Name</FieldLabel>
          <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="e.g. Bruma Tiger Tee" />
        </div>

        <div>
          <FieldLabel>Product Code (SKU)</FieldLabel>
          <TextInput value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Auto-generated if left blank" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Price (₡)</FieldLabel>
            <TextInput type="number" min="0" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <FieldLabel>Stock Qty</FieldLabel>
            <NumberStepper value={stockQty} onChange={setStockQty} />
          </div>
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
          <FieldLabel>Available Sizes</FieldLabel>
          <ChipPicker
            options={SIZE_OPTIONS}
            selected={sizes}
            onToggle={(id) =>
              setSizes((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
          />
        </div>

        <div>
          <FieldLabel>Description</FieldLabel>
          <TextArea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Optional product description" />
        </div>

        <SubmitBar submitLabel="Add to Lineup" loading={loading} error={error} />
      </form>
    </FormModal>
  );
}
