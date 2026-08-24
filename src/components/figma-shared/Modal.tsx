"use client";

import React, { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as SelectPrimitive from "@radix-ui/react-select";
import { X, Plus, Minus, ChevronDown } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function FormModal({
  open,
  onOpenChange,
  eyebrow,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-obsidian/80 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "bg-obsidian border border-bone/20 rounded-[4px] shadow-[0_0_40px_rgba(0,0,0,0.6)]",
            "max-h-[85vh] overflow-y-auto"
          )}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-bone/10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-5 h-[1px] bg-ember" />
                <p className="font-geist text-[9px] text-ember uppercase tracking-[0.25em] font-bold">{eyebrow}</p>
              </div>
              <DialogPrimitive.Title asChild>
                <h2 className="font-fraunces font-black text-xl uppercase tracking-tighter text-bone">{title}</h2>
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Description className="sr-only">{eyebrow} — {title} form</DialogPrimitive.Description>
            <DialogPrimitive.Close className="text-bone/40 hover:text-bone transition-colors">
              <X size={18} />
            </DialogPrimitive.Close>
          </div>
          <div className="px-6 py-5 flex flex-col gap-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] text-bone/40 font-geist uppercase tracking-[0.2em] font-bold mb-2">
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full px-3 py-2.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-sm font-geist focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all",
        props.className
      )}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full px-3 py-2.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-sm font-geist focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all resize-none",
        props.className
      )}
    />
  );
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center border border-bone/20 rounded-[2px] bg-bone/5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-10 flex items-center justify-center text-bone/60 hover:text-ember transition-colors"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Math.max(min, parseInt(e.target.value, 10) || 0))}
        className="w-full text-center bg-transparent text-bone text-sm font-geist font-bold focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-9 h-10 flex items-center justify-center text-bone/60 hover:text-ember transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export function DropdownField<T extends string | number>({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: T | null;
  onChange: (value: T) => void;
  placeholder: string;
  options: { value: T; label: string }[];
}) {
  const isNumeric = typeof options[0]?.value === "number";
  return (
    <SelectPrimitive.Root
      value={value !== null ? String(value) : undefined}
      onValueChange={(v) => onChange((isNumeric ? Number(v) : v) as T)}
    >
      <SelectPrimitive.Trigger className="w-full flex items-center justify-between px-3 py-2.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-sm font-geist focus:outline-none focus:border-ember data-[placeholder]:text-bone/30">
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown size={14} className="text-bone/40" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 w-[var(--radix-select-trigger-width)] max-h-72 overflow-y-auto bg-obsidian border border-bone/20 rounded-[2px] shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={String(opt.value)}
                value={String(opt.value)}
                className="px-3 py-2 text-sm font-geist text-bone rounded-[2px] outline-none cursor-pointer data-[highlighted]:bg-ember/10 data-[highlighted]:text-ember data-[state=checked]:text-ember"
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export function ChipPicker({
  options,
  selected,
  onToggle,
}: {
  options: { id: string | number; label: string }[];
  selected: Set<string | number>;
  onToggle: (id: string | number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onToggle(opt.id)}
          className={cn(
            "px-3 py-1.5 rounded-[2px] text-[10px] uppercase tracking-widest font-geist font-bold transition-all border",
            selected.has(opt.id)
              ? "bg-ember text-obsidian border-ember"
              : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function InlineAddChip({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(value.trim());
      setValue("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-1.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-xs font-geist focus:outline-none focus:border-ember"
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={submitting}
        className="px-3 py-1.5 bg-ember/10 text-ember border border-ember/30 rounded-[2px] text-[10px] uppercase font-geist font-bold hover:bg-ember/20 transition-colors disabled:opacity-50"
      >
        + Add
      </button>
    </div>
  );
}

export function SubmitBar({
  submitLabel,
  loading,
  error,
}: {
  submitLabel: string;
  loading: boolean;
  error?: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      {error && (
        <div className="px-3 py-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-[2px] font-geist">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-ember text-obsidian font-geist text-xs font-bold uppercase tracking-[0.15em] rounded-[4px] hover:bg-ember/90 transition-all shadow-[0_0_15px_rgba(255,77,28,0.2)] disabled:opacity-50"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
