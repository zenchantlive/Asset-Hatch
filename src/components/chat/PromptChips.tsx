"use client";

import { MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PromptChip {
  id: string;
  label: string;
  prompt: string;
  tone?: "primary" | "neutral";
}

interface PromptChipsProps {
  presets: PromptChip[];
  onSelect: (prompt: string) => void;
  className?: string;
}

export function PromptChips({ presets, onSelect, className }: PromptChipsProps) {
  if (presets.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {presets.map((preset) => {
        const isPrimary = preset.tone === "primary";
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.prompt)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
              isPrimary
                ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 shadow-[0_0_0.625rem_-0.25rem_var(--color-primary)]"
                : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white/70 hover:text-white"
            )}
          >
            <MessageSquare className={cn("h-3 w-3", isPrimary ? "text-primary" : "opacity-60")} />
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
