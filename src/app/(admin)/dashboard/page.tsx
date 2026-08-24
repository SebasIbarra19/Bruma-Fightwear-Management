"use client";

import React from "react";
import { TrendingUp, ShoppingCart, Package, Users } from "lucide-react";
import { PageHeader } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";

export default function DashboardView() {
  const kpis = [
    {
      label: "Active Orders",
      value: "Próximamente",
      sub: "Requiere reporte por período",
      icon: ShoppingCart,
      color: "text-bone/40"
    },
    {
      label: "Low Stock Alerts",
      value: "Próximamente",
      sub: "Requiere reporte por período",
      icon: Package,
      color: "text-bone/40"
    },
    {
      label: "Resueltos Hoy",
      value: "Próximamente",
      sub: "Requiere reporte por período",
      icon: TrendingUp,
      color: "text-bone/40"
    },
    {
      label: "New Customers",
      value: "Próximamente",
      sub: "Requiere reporte por período",
      icon: Users,
      color: "text-bone/40"
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

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <FloraGlass
            key={label}
            className="p-6 transition-all hover:border-ember/40 relative group"
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">{label}</p>
              <Icon size={14} className={color} />
            </div>
            <p className="font-fraunces text-3xl font-bold text-bone leading-none mb-2">{value}</p>
            <p className="text-xs text-bone/40 font-geist">{sub}</p>
          </FloraGlass>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <FloraGlass className="xl:col-span-2 p-6 flex flex-col items-center justify-center relative !overflow-visible min-h-[300px]">
          <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-2">Stock Burn Rate</p>
          <p className="font-fraunces text-2xl font-bold text-bone/40 uppercase tracking-tight">Próximamente</p>
          <p className="text-xs text-bone/30 font-geist mt-2 text-center max-w-sm">Requiere seguimiento histórico de consumo por SKU, no disponible en el backend actual.</p>
        </FloraGlass>

        <FloraGlass className="p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
          <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-4 self-start">Monthly Goal</p>
          <p className="font-fraunces text-2xl font-bold text-bone/40 uppercase tracking-tight">Próximamente</p>
          <p className="text-xs text-bone/30 font-geist mt-2 text-center max-w-xs">Requiere definición de metas mensuales por período, no disponible en el backend actual.</p>
        </FloraGlass>
      </div>
    </div>
  );
}
