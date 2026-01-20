"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface PinnedContextItem {
  label: string;
  value: string;
}

interface PinnedContextProps {
  title: string;
  summary?: string;
  items?: PinnedContextItem[];
  defaultCollapsed?: boolean;
  className?: string;
}

export function PinnedContext({
  title,
  summary,
  items = [],
  defaultCollapsed = false,
  className,
}: PinnedContextProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const hasDetails = items.length > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_0_1.5rem_-1rem_rgba(0,0,0,0.6)]",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={!collapsed}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
            {title}
          </p>
          {summary ? (
            <p className="mt-1 text-sm text-white/80">{summary}</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-white/60 transition-transform",
            collapsed ? "-rotate-90" : "rotate-0"
          )}
        />
      </button>
      {!collapsed && hasDetails ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={`${item.label}-${item.value}`}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70"
            >
              <span className="text-white/50">{item.label}:</span>
              <span>{item.value}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
