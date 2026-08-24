"use client";

import React from "react";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";

export default function ReportingView() {
  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <PageHeader
        label="Logistics Audit"
        title="Activity Log"
        sub="Audit chronological subroutines and operations. Track system overrides, price mutations, and clearance alerts."
        bgImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=300&fit=crop&auto=format"
      />

      <FloraGlass className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <ScrollText size={48} className="text-bone/30 mb-6" />
        <h2 className="font-fraunces text-3xl font-bold text-bone mb-3">Próximamente</h2>
        <p className="font-geist text-sm text-bone/50 max-w-md leading-relaxed">
          El registro de actividad requiere una tabla de auditoría dedicada que aún no existe
          en el backend. Se construye como su propio proyecto cuando haya una arquitectura de
          logging definida.
        </p>
      </FloraGlass>
    </div>
  );
}
