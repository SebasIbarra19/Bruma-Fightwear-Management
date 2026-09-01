"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart, Package, Coins, AlertTriangle, CheckCircle2, Target } from "lucide-react";
import { PageHeader } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useEsqueletoDemorado } from "@/hooks/useEsqueletoDemorado";
import { formatColones } from "@/lib/utils";

export default function DashboardView() {
  const { data, loading, error } = useDashboardData();
  // Con la cache caliente la respuesta llega en milisegundos: sin este umbral
  // los esqueletos aparecerian y desapareceran en un parpadeo, que se percibe
  // peor que una pausa breve sin nada.
  const mostrarEsqueleto = useEsqueletoDemorado(loading);

  // Los cuatro KPI salen de SPs que ya existian y nadie llamaba
  // (`get_dashboard_stats` y `get_order_analytics`).
  //
  // Se dejo fuera a proposito el contador de `clientes`: la tabla `cliente`
  // no se usa, porque los pedidos guardan los datos de contacto en linea
  // (migracion 20260813000000). Mostrarla daria 0 aunque hubiera pedidos — un
  // dato correcto que se lee como si estuviera roto.
  const kpis = [
    {
      label: "Pedidos",
      value: data ? String(data.stats.pedidos) : "—",
      sub: "Historico total",
      icon: ShoppingCart,
      color: "text-bone/40",
    },
    {
      label: "Ingresos",
      value: data ? formatColones(data.analytics.total_ingresos) : "—",
      sub: "Suma de todos los pedidos",
      icon: Coins,
      color: "text-bone/40",
    },
    {
      // Reemplaza a "Ticket promedio", que era una metrica de analisis y no de
      // "que hago hoy". El promedio sigue disponible en Statistics, que es
      // donde corresponde mirarlo.
      label: "Resueltos hoy",
      value: data ? String(data.stats.resueltos_hoy) : "—",
      sub: "Pedidos entregados",
      icon: CheckCircle2,
      color: data && data.stats.resueltos_hoy > 0 ? "text-[#7ddb7d]" : "text-bone/40",
    },
    {
      label: "Bajo stock",
      value: data ? String(data.stats.productos_bajo_stock) : "—",
      sub: "5 unidades o menos",
      icon: Package,
      color: data && data.stats.productos_bajo_stock > 0 ? "text-ember" : "text-bone/40",
    },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-8 relative">
      <PageHeader
        label="Command Center"
        title="Dashboard"
        sub="Welcome back — here is your brand at a glance."
        bgImage="https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&h=300&fit=crop&auto=format"
      />

      {error && (
        <FloraGlass className="p-4 border-ember/30">
          <p className="text-xs text-ember font-geist">
            No se pudieron cargar los datos: {error}
          </p>
        </FloraGlass>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <FloraGlass
            key={label}
            className="p-6 transition-all hover:border-ember/40 relative group"
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">
                {label}
              </p>
              <Icon size={14} className={color} />
            </div>
            {mostrarEsqueleto ? (
              <div className="h-8 w-24 bg-bone/10 rounded-[2px] animate-pulse mb-2" />
            ) : (
              <p className="font-fraunces text-3xl font-bold text-bone leading-none mb-2">
                {value}
              </p>
            )}
            <p className="text-xs text-bone/40 font-geist">{sub}</p>
          </FloraGlass>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Reemplaza el cartel de "Stock Burn Rate": el consumo historico por SKU
            sigue sin existir, pero el stock bajo si — y es accionable hoy. */}
        <FloraGlass className="xl:col-span-2 p-6 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">
              Necesita reposicion
            </p>
            <Link
              href="/inventory"
              className="text-[10px] text-ember font-geist uppercase tracking-widest hover:text-ember/80"
            >
              Ver inventario
            </Link>
          </div>

          {mostrarEsqueleto && (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 bg-bone/5 rounded-[2px] animate-pulse" />
              ))}
            </div>
          )}

          {!loading && data && data.lowStock.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="font-fraunces text-xl font-bold text-bone/40 uppercase tracking-tight">
                Todo en orden
              </p>
              <p className="text-xs text-bone/30 font-geist mt-2">
                Ningun SKU por debajo del umbral.
              </p>
            </div>
          )}

          {!loading && data && data.lowStock.length > 0 && (
            <div className="flex flex-col gap-2">
              {data.lowStock.map((item) => (
                <div
                  key={item.sku + item.product_name}
                  className="flex items-center gap-4 py-3 px-4 bg-obsidian/60 border border-bone/5 rounded-[2px]"
                >
                  <AlertTriangle
                    size={14}
                    className={
                      item.status === "critical"
                        ? "text-ember shrink-0"
                        : "text-bone/40 shrink-0"
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-bone font-geist truncate">
                      {item.product_name}
                    </p>
                    <p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest">
                      {item.sku}
                    </p>
                  </div>
                  <span
                    className={`font-fraunces font-bold text-lg ${
                      item.status === "critical" ? "text-ember" : "text-bone/80"
                    }`}
                  >
                    {item.current_stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </FloraGlass>

        {/* La meta sale de la tabla `configuracion` (migracion 20260903000000).
            Con meta en 0 no se dibuja una barra al 0% --que se leeria como
            fracaso-- sino una invitacion a definirla. */}
        <FloraGlass className="p-6 flex flex-col min-h-[300px]">
          <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-5">
            Meta del mes
          </p>

          {mostrarEsqueleto && <div className="h-24 bg-bone/5 rounded-[2px] animate-pulse" />}

          {!loading && data && data.stats.meta_mensual <= 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Target size={32} className="text-bone/30 mb-4" />
              <p className="font-fraunces text-xl font-bold text-bone/50 uppercase tracking-tight">
                Sin meta definida
              </p>
              <p className="text-xs text-bone/40 font-geist mt-2 max-w-xs">
                Definila para seguir cuánto falta del mes. Este mes llevás{" "}
                <span className="text-bone/70">{formatColones(data.stats.ingresos_mes)}</span>.
              </p>
            </div>
          )}

          {!loading && data && data.stats.meta_mensual > 0 && (() => {
            const pct = Math.min(
              100,
              Math.round((data.stats.ingresos_mes / data.stats.meta_mensual) * 100)
            );
            const cumplida = data.stats.ingresos_mes >= data.stats.meta_mensual;
            const falta = data.stats.meta_mensual - data.stats.ingresos_mes;
            return (
              <div className="flex-1 flex flex-col justify-center gap-5">
                <div>
                  <p className="font-fraunces text-4xl font-bold text-bone leading-none">
                    {formatColones(data.stats.ingresos_mes)}
                  </p>
                  <p className="text-xs text-bone/40 font-geist mt-2">
                    de {formatColones(data.stats.meta_mensual)}
                  </p>
                </div>

                {/* La barra se corta al 100% pero el texto puede decir que se
                    superó: una barra desbordada no comunica mejor el exceso. */}
                <div>
                  <div className="h-2 w-full rounded-full bg-bone/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        cumplida ? "bg-[#7ddb7d]" : "bg-ember"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p
                    className={`text-[10px] font-geist uppercase tracking-widest mt-2 ${
                      cumplida ? "text-[#7ddb7d]" : "text-bone/50"
                    }`}
                  >
                    {cumplida
                      ? `Meta cumplida — ${pct}%`
                      : `${pct}% · faltan ${formatColones(falta)}`}
                  </p>
                </div>
              </div>
            );
          })()}
        </FloraGlass>
      </div>
    </div>
  );
}
