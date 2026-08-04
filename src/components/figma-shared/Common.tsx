import React from "react";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { Fauna } from "@/components/ui/Fauna";

interface PageHeaderProps {
  label: string;
  title: string;
  sub?: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  bgImage?: string;
}

export function PageHeader({ label, title, sub, actionLabel, actionIcon, onAction, bgImage }: PageHeaderProps) {
  return (
    <FloraGlass className="px-4 py-3 md:px-5 md:py-3.5 flex flex-row justify-between items-center relative !overflow-visible group gap-3 rounded-[4px]">
      <div className="relative z-10 min-w-0">
        <div className="flex items-center gap-3 mb-0.5">
          <div className="w-5 h-[1px] bg-ember"></div>
          <p className="font-geist text-[9px] text-ember uppercase tracking-[0.25em] font-bold">{label}</p>
        </div>

        <h1 className="font-fraunces font-black text-xl md:text-2xl uppercase tracking-tighter text-bone leading-tight truncate">{title}</h1>
        {sub && <p className="font-geist text-xs text-bone/60 font-light leading-relaxed hidden md:block">{sub}</p>}
      </div>

      {actionLabel && (
        <button
          onClick={onAction}
          className="relative z-10 flex items-center gap-2 px-4 py-2 bg-ember text-obsidian font-geist text-[10px] font-bold uppercase tracking-[0.15em] rounded-[4px] hover:bg-ember/90 transition-all shadow-[0_0_15px_rgba(255,77,28,0.2)] shrink-0"
        >
          {actionIcon}
          {actionLabel}
        </button>
      )}
    </FloraGlass>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    "in-stock": { label: "In Stock", color: "bg-moss/20 text-[#7ddb7d] border border-[#7ddb7d]/30" },
    "shipped": { label: "Shipped", color: "bg-moss/20 text-[#7ddb7d] border border-[#7ddb7d]/30" },
    "paid": { label: "Paid", color: "bg-moss/20 text-[#7ddb7d] border border-[#7ddb7d]/30" },
    "completed": { label: "Completed", color: "bg-moss/20 text-[#7ddb7d] border border-[#7ddb7d]/30" },
    
    "processing": { label: "Processing", color: "bg-[#d4a017]/10 text-[#d4a017] border border-[#d4a017]/30" },
    
    "low": { label: "Low", color: "bg-ember/10 text-ember border border-ember/30" },
    "pending": { label: "Pending", color: "bg-ember/10 text-ember border border-ember/30" },
    
    "out": { label: "Out", color: "bg-destructive/20 text-[#ff8099] border border-[#ff8099]/30" },
    "cancelled": { label: "Cancelled", color: "bg-destructive/20 text-[#ff8099] border border-[#ff8099]/30" },
    "overdue": { label: "Overdue", color: "bg-destructive/20 text-[#ff8099] border border-[#ff8099]/30" },
    "failed": { label: "Failed", color: "bg-destructive/20 text-[#ff8099] border border-[#ff8099]/30" },
  };
  
  const s = map[status.toLowerCase()] ?? { label: status, color: "bg-bone/5 text-bone/50 border border-bone/20" };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-[2px] text-[9px] uppercase tracking-widest font-bold ${s.color}`}>
      {s.label}
    </span>
  );
}
