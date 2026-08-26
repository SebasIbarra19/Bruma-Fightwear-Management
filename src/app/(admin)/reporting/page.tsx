"use client";

import React from "react";
import { ScrollText, AlertTriangle, Database, MousePointerClick } from "lucide-react";
import { PageHeader } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { useActividadData } from "@/hooks/useActividadData";
import type { CategoriaActividad } from "@/lib/database/adapters/actividad-adapter";

const FILTROS: { label: string; value: CategoriaActividad | null }[] = [
  { label: "Todo", value: null },
  { label: "Datos", value: "datos" },
  { label: "Acciones", value: "accion" },
];

// `datos` lo escriben los triggers; `accion`, la aplicacion. El icono distingue
// el origen de un vistazo, que es la pregunta mas frecuente al leer la bitacora.
const ICONO: Record<string, typeof Database> = {
  datos: Database,
  accion: MousePointerClick,
  sesion: MousePointerClick,
};

function fechaCorta(iso: string) {
  const d = new Date(iso);
  return {
    dia: d.toLocaleDateString(),
    hora: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function ReportingView() {
  const { registros, loading, error, categoria, setCategoria } = useActividadData();

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <PageHeader
        label="Logistics Audit"
        title="Activity Log"
        sub="Audit chronological subroutines and operations. Track system overrides, price mutations, and clearance alerts."
        bgImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=300&fit=crop&auto=format"
      />

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mr-2">
          Tipo:
        </span>
        {FILTROS.map((f) => {
          const activo = categoria === f.value;
          return (
            <button
              key={f.label}
              type="button"
              onClick={() => setCategoria(f.value)}
              className={`px-3 py-1.5 rounded-[2px] border text-[10px] font-geist font-bold uppercase tracking-widest transition-colors ${
                activo
                  ? "bg-ember/10 text-ember border-ember/30"
                  : "bg-bone/5 text-bone/60 border-bone/20 hover:border-bone/50 hover:text-bone"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {error && (
        <FloraGlass className="p-4 border-ember/30">
          <p className="text-xs text-ember font-geist">
            No se pudo cargar la bitácora: {error}
          </p>
        </FloraGlass>
      )}

      <FloraGlass className="p-6 min-h-[400px] flex flex-col">
        {loading && (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-bone/5 rounded-[2px] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && registros.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ScrollText size={40} className="text-bone/30 mb-4" />
            <p className="font-fraunces text-xl font-bold text-bone/50 uppercase tracking-tight">
              Sin registros
            </p>
            <p className="text-xs text-bone/30 font-geist mt-2 max-w-sm">
              La bitácora se llena sola a medida que se crean pedidos, se
              facturan ventas o se mueve inventario.
            </p>
          </div>
        )}

        {!loading && registros.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {registros.map((r) => {
              const Icono = ICONO[r.categoria] ?? Database;
              const alerta = r.severidad === "alerta";
              const { dia, hora } = fechaCorta(r.fecha);
              return (
                <div
                  key={r.id_registro}
                  className={`flex items-start gap-4 py-3 px-4 rounded-[2px] border ${
                    alerta
                      ? "bg-ember/5 border-ember/20"
                      : "bg-obsidian/60 border-bone/5"
                  }`}
                >
                  {alerta ? (
                    <AlertTriangle size={14} className="text-ember shrink-0 mt-0.5" />
                  ) : (
                    <Icono size={14} className="text-bone/40 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-geist ${
                        alerta ? "text-ember" : "text-bone"
                      }`}
                    >
                      {r.descripcion}
                    </p>
                    <p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mt-0.5">
                      {r.tabla ? `${r.tabla} · ${r.operacion}` : r.categoria}
                      {/* Las filas de los triggers no saben quien: el token de
                          servicio no lleva identidad (ver 3.1.C en ROADMAP.md). */}
                      {r.usuario_email ? ` · ${r.usuario_email}` : ""}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-bone/60 font-geist">{dia}</p>
                    <p className="text-[10px] text-bone/40 font-geist">{hora}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FloraGlass>
    </div>
  );
}
