"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HoldToConfirmButtonProps {
  label: string;
  onConfirm: () => void;
  holdMs?: number;
  disabled?: boolean;
  className?: string;
}

export function HoldToConfirmButton({
  label,
  onConfirm,
  holdMs = 3000,
  disabled = false,
  className,
}: HoldToConfirmButtonProps) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setHolding(false);
    setProgress(0);
  }, []);

  const tick = useCallback(() => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(1, elapsed / holdMs);
    setProgress(pct);
    if (pct >= 1) {
      stop();
      onConfirm();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [holdMs, onConfirm, stop]);

  const start = useCallback(() => {
    if (disabled || rafRef.current !== null) return;
    setHolding(true);
    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [disabled, tick]);

  useEffect(() => stop, [stop]);

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={start}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={start}
      onTouchEnd={stop}
      className={cn(
        "relative w-full py-3 overflow-hidden bg-red-950/40 border border-red-500/50 text-red-300 font-geist text-xs font-bold uppercase tracking-[0.15em] rounded-[4px] transition-colors disabled:opacity-50 select-none",
        holding ? "text-obsidian" : "hover:bg-red-950/60",
        className
      )}
    >
      <span
        className="absolute inset-y-0 left-0 bg-red-500 transition-none"
        style={{ width: `${progress * 100}%` }}
      />
      <span className="relative z-10">{holding ? "Hold to confirm..." : label}</span>
    </button>
  );
}
