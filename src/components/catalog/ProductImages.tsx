"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, Star, Trash2, Upload } from "lucide-react";
import { fetchApi } from '@/lib/api/fetch-cliente';

interface ProductImage {
  id: number;
  url: string;
  is_primary: boolean;
  order: number;
}

/**
 * Galería de imágenes de un producto: subir, ver, marcar principal y borrar.
 *
 * Solo aparece al EDITAR, no al crear: `add_product_image` necesita un
 * `id_producto`, que no existe hasta que el producto se guardó. Pedir la imagen
 * antes obligaría a sostener el archivo en memoria y subirlo después, con el
 * riesgo de perderlo si la creación falla.
 *
 * La subida va contra `/api/catalog/[id]/images`, que corre en el servidor: el
 * bucket solo acepta escrituras con `service_role`, así que la anon key del
 * browser no puede llenarlo.
 */
export function ProductImages({ productId }: { productId: number }) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchApi(`/api/catalog/${productId}/images`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || "No se pudieron cargar las imágenes");
      setImages(result.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      // Secuencial y no en paralelo: la primera imagen se marca principal en el
      // servidor según si el producto ya tenía alguna, y en paralelo dos subidas
      // podrían leer ese estado a la vez y quedar ambas como principal.
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetchApi(`/api/catalog/${productId}/images`, { method: "POST", body });
        const result = await res.json();
        if (!result.success) throw new Error(result.error?.message || "Error al subir la imagen");
      }
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (imageId: number) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchApi(`/api/catalog/${productId}/images?imageId=${imageId}`, { method: "DELETE" });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || "Error al borrar la imagen");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const makePrimary = async (image: ProductImage) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchApi(`/api/catalog/${productId}/images?imageId=${image.id}`, {
        method: "PATCH",
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || "Error al marcar como principal");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <p className="text-xs text-bone/40 font-geist">Cargando imágenes...</p>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-6 border border-dashed border-bone/15 rounded-[2px] text-bone/30">
          <ImageIcon size={24} strokeWidth={1.5} />
          <span className="font-geist text-[10px] uppercase tracking-widest">Sin imágenes</span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className={`group relative aspect-square overflow-hidden rounded-[2px] border ${
                img.is_primary ? "border-ember" : "border-bone/15"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />

              {img.is_primary && (
                <span className="absolute left-1 top-1 rounded-[2px] bg-ember px-1 py-0.5 text-[8px] font-bold uppercase tracking-widest text-obsidian">
                  Portada
                </span>
              )}

              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.is_primary && (
                  <button
                    type="button" onClick={() => makePrimary(img)} disabled={busy}
                    title="Marcar como portada"
                    className="text-bone/70 hover:text-ember disabled:opacity-40"
                  >
                    <Star size={14} />
                  </button>
                )}
                <button
                  type="button" onClick={() => remove(img.id)} disabled={busy}
                  title="Borrar"
                  className="text-bone/70 hover:text-ember disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* `sr-only` y no `hidden`: un input con `display:none` es ignorado por
          `.click()` en varios navegadores, y entonces el explorador de archivos
          no abre nunca. Así queda fuera de la vista pero renderizado. */}
      <input
        ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(e) => upload(e.target.files)}
        className="sr-only" tabIndex={-1} aria-hidden
      />
      <button
        type="button" onClick={() => inputRef.current?.click()} disabled={busy}
        className="flex items-center justify-center gap-2 rounded-[2px] border border-bone/20 bg-bone/5 px-3 py-2 font-geist text-[10px] font-bold uppercase tracking-widest text-bone/60 transition-colors hover:border-ember/40 hover:text-bone disabled:opacity-50"
      >
        <Upload size={12} />
        {busy ? "Subiendo..." : "Subir imagen"}
      </button>

      {error && <p className="font-geist text-xs text-ember">{error}</p>}
    </div>
  );
}
