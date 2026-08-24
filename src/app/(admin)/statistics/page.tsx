"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";

export default function StatisticsPage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <PageHeader
        label="Analytics"
        title="Statistics"
        sub="Métricas y tendencias del negocio."
        bgImage="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=300&fit=crop&auto=format"
      />

      <FloraGlass className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <BarChart3 size={48} className="text-bone/30 mb-6" />
        <h2 className="font-fraunces text-3xl font-bold text-bone mb-3">Próximamente</h2>
        <p className="font-geist text-sm text-bone/50 max-w-md leading-relaxed">
          Las estadísticas de tendencia de ingresos y desglose por estado de pedido requieren
          un reporte agregado que todavía no existe en el backend. Se construye como su propio
          proyecto cuando haya una arquitectura de procesamiento de datos definida.
        </p>
      </FloraGlass>
    </div>
  );
}
