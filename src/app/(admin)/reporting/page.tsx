"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Database, MousePointerClick } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { EmptyState } from "@/components/ui/EmptyState";
import { TacticalTable, Column } from "@/components/ui/TacticalTable";
import { useActividadData } from "@/hooks/useActividadData";
import type {
  CategoriaActividad,
  RegistroActividad,
} from "@/lib/database/adapters/actividad-adapter";

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

const PER_PAGE = 10;

export default function ReportingView() {
  const { registros, loading, error, categoria, setCategoria, refetch } =
    useActividadData();
  const [page, setPage] = useState(0);

  // El hook pide 100 filas de una sola vez y la bitacora crece sin limite, asi
  // que se pagina en cliente con el mismo patron de Movements e Inventory.
  const paginated = useMemo(
    () => registros.slice(page * PER_PAGE, (page + 1) * PER_PAGE),
    [registros, page]
  );
  const totalPages = Math.ceil(registros.length / PER_PAGE);

  const columns: Column<RegistroActividad>[] = [
    {
      key: "fecha",
      header: "Date",
      className: "whitespace-nowrap align-top",
      render: (r) => (
        // TacticalTable no expone className por fila. Los margenes negativos
        // cancelan el padding de la celda para que la barra ember toque los
        // bordes de la fila: es la senal de `severidad = alerta` a la altura de
        // fila que antes daba el fondo ember/5 de la lista hecha a mano.
        <div
          className={`-my-4 -ml-6 py-4 ${
            r.severidad === "alerta"
              ? "border-l-2 border-ember pl-[22px]"
              : "pl-6"
          }`}
        >
          <div className="font-geist text-sm text-bone">
            {new Date(r.fecha).toLocaleDateString()}
          </div>
          <div className="font-geist text-[10px] text-bone/40 uppercase tracking-widest mt-0.5">
            {new Date(r.fecha).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ),
    },
    {
      key: "descripcion",
      header: "Event",
      className: "align-top w-full",
      render: (r) => {
        const alerta = r.severidad === "alerta";
        const Icono = ICONO[r.categoria] ?? Database;
        return (
          <div className="flex items-start gap-2.5">
            {alerta ? (
              <AlertTriangle size={14} className="text-ember shrink-0 mt-0.5" />
            ) : (
              <Icono size={14} className="text-bone/40 shrink-0 mt-0.5" />
            )}
            <p
              className={`font-geist text-sm ${
                alerta ? "text-ember font-medium" : "text-bone"
              }`}
            >
              {r.descripcion}
            </p>
          </div>
        );
      },
    },
    {
      key: "origen",
      header: "Source",
      className: "align-top",
      render: (r) => (
        // Solo las filas de `datos` traen tabla y operacion; en las demas la
        // categoria es el origen mas preciso que existe.
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={r.operacion ?? r.categoria} />
          {r.tabla && (
            <span className="font-geist text-[10px] text-bone/40 uppercase tracking-widest">
              {r.tabla}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "usuario_email",
      header: "Author",
      className: "align-top whitespace-nowrap",
      render: (r) =>
        r.usuario_email ? (
          <span className="font-geist text-xs text-bone/70">
            {r.usuario_email}
          </span>
        ) : (
          // Un cambio hecho fuera de la app (SQL directo, tarea de servicio)
          // queda sin autor. Es informacion, no un hueco: se nombra en vez de
          // dejar la celda vacia.
          <span className="font-geist text-[10px] text-bone/30 uppercase tracking-widest">
            Sin autor
          </span>
        ),
    },
  ];

  if (error) {
    return (
      <div className="w-full max-w-[1400px] mx-auto">
        <EmptyState
          title="Error cargando la bitácora"
          description={error}
          actionLabel="Reintentar"
          onAction={refetch}
        />
      </div>
    );
  }

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
              onClick={() => {
                setCategoria(f.value);
                setPage(0);
              }}
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

      <TacticalTable
        columns={columns}
        data={paginated}
        loading={loading}
        keyExtractor={(r) => r.id_registro}
        emptyTitle="Sin registros"
        emptyDescription={
          categoria
            ? "Ningún registro de este tipo todavía. Probá con «Todo»."
            : "La bitácora se llena sola a medida que se crean pedidos, se facturan ventas o se mueve inventario."
        }
        emptyActionLabel={categoria ? "Ver todo" : undefined}
        onEmptyAction={
          categoria
            ? () => {
                setCategoria(null);
                setPage(0);
              }
            : undefined
        }
        currentPage={page}
        totalPages={totalPages}
        totalItems={registros.length}
        onPageChange={(p) => setPage(p)}
        itemsLabel="records"
        pageSize={PER_PAGE}
      />
    </div>
  );
}
