"use client";

import { Wand2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface QuickFixAction {
  id: string;
  label: string;
  prompt: string;
}

interface QuickFixBarProps {
  actions: QuickFixAction[];
  onSelect: (prompt: string) => void;
  className?: string;
}

export function QuickFixBar({ actions, onSelect, className }: QuickFixBarProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2",
        className
      )}
    >
      <div className="flex items-center gap-2 pr-2 text-xs font-semibold uppercase tracking-wide text-white/50">
        <Wand2 className="h-3.5 w-3.5" />
        Quick fixes
      </div>
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onSelect(action.prompt)}
          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/75 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
