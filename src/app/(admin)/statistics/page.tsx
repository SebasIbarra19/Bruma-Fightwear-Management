"use client";

import React from "react";
import {
  ShoppingCart,
  Coins,
  TrendingUp,
  Package,
  Boxes,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { useStatisticsData, RANGE_PRESETS } from "@/hooks/useStatisticsData";
import { formatColones } from "@/lib/utils";
import { StatisticsCharts } from "@/components/statistics/Charts";

function Metric({
  label,
  value,
  sub,
  icon: Icon,
  loading,
  alert,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  loading: boolean;
  alert?: boolean;
}) {
  return (
    <FloraGlass className="p-6 transition-all hover:border-ember/40">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">{label}</p>
        <Icon size={14} className={alert ? "text-ember" : "text-bone/40"} />
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-bone/10 rounded-[2px] animate-pulse mb-2" />
      ) : (
        <p className="font-fraunces text-3xl font-bold text-bone leading-none mb-2">{value}</p>
      )}
      <p className="text-xs text-bone/40 font-geist">{sub}</p>
    </FloraGlass>
  );
}

export default function StatisticsPage() {
  const { data, loading, error, preset, setPreset } = useStatisticsData();

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <PageHeader
        label="Analytics"
        title="Statistics"
        sub="Métricas y tendencias del negocio."
        bgImage="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=300&fit=crop&auto=format"
      />

      {error && (
        <FloraGlass className="p-4 border-ember/30">
          <p className="text-xs text-ember font-geist">No se pudieron cargar los datos: {error}</p>
        </FloraGlass>
      )}

      {/* El selector es lo que distingue esta pantalla del dashboard: aca las
          ventas se cortan por rango. `get_order_analytics` siempre acepto
          p_start_date/p_end_date; hasta ahora nadie los usaba. */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">
          Período
        </span>
        <div className="flex gap-2 flex-wrap">
          {RANGE_PRESETS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setPreset(r.id)}
              className={`px-3 py-1.5 rounded-[2px] border text-[10px] font-geist font-bold uppercase tracking-widest transition-colors ${
                preset === r.id
                  ? "bg-ember/10 text-ember border-ember/30"
                  : "bg-bone/5 text-bone/60 border-bone/20 hover:border-bone/50 hover:text-bone"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-fraunces text-lg font-bold text-bone mb-3">Ventas del período</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Metric
            label="Pedidos"
            value={data ? String(data.analytics.total_pedidos) : "—"}
            sub="En el período elegido"
            icon={ShoppingCart}
            loading={loading}
          />
          <Metric
            label="Ingresos"
            value={data ? formatColones(data.analytics.total_ingresos) : "—"}
            sub="Suma de los pedidos"
            icon={Coins}
            loading={loading}
          />
          <Metric
            label="Ticket promedio"
            value={data ? formatColones(data.analytics.promedio_pedido) : "—"}
            sub="Por pedido"
            icon={TrendingUp}
            loading={loading}
          />
        </div>
        {!loading && data && data.analytics.total_pedidos === 0 && (
          <p className="text-xs text-bone/40 font-geist mt-3">
            No hubo pedidos en este período. Probá con un rango más amplio.
          </p>
        )}
      </div>

      <StatisticsCharts series={data?.series ?? null} cargando={loading} />

      <div>
        {/* La valuacion NO se filtra por rango a proposito: es una foto del
            inventario a hoy, no un acumulado histórico. */}
        <h3 className="font-fraunces text-lg font-bold text-bone mb-1">Inventario</h3>
        <p className="text-xs text-bone/40 font-geist mb-3">
          Estado actual — no depende del período seleccionado.
        </p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Metric
            label="Valor total"
            value={data ? formatColones(data.valuation.valor_total) : "—"}
            sub="Stock por precio"
            icon={Coins}
            loading={loading}
          />
          <Metric
            label="Productos"
            value={data ? String(data.valuation.total_productos) : "—"}
            sub={data ? `${data.valuation.total_items} filas de stock` : "—"}
            icon={Boxes}
            loading={loading}
          />
          <Metric
            label="Bajo stock"
            value={data ? String(data.valuation.items_bajo_stock) : "—"}
            sub="Entre 1 y 5 unidades"
            icon={Package}
            loading={loading}
            alert={!!data && data.valuation.items_bajo_stock > 0}
          />
          <Metric
            label="Sin stock"
            value={data ? String(data.valuation.items_sin_stock) : "—"}
            sub="Agotados"
            icon={AlertTriangle}
            loading={loading}
            alert={!!data && data.valuation.items_sin_stock > 0}
          />
        </div>
      </div>
    </div>
  );
}
