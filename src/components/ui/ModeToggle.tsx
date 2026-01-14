"use client";

import * as React from "react";
import { Layers, Box } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
    value: "2d" | "3d";
    onValueChange: (value: "2d" | "3d") => void;
    className?: string;
    disabled?: boolean;
}

export function ModeToggle({
    value,
    onValueChange,
    className,
    disabled = false,
}: ModeToggleProps) {
    return (
        <div
            className={cn(
                "flex items-center p-1 rounded-lg bg-black/20 border border-white/5 backdrop-blur-sm",
                className
            )}
        >
            <button
                type="button"
                onClick={() => onValueChange("2d")}
                disabled={disabled}
                data-state={value === "2d" ? "active" : "inactive"}
                className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-300",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    value === "2d"
                        ? "bg-glass-highlight text-white shadow-sm border border-white/10"
                        : "text-white/40 hover:text-white/70 hover:bg-white/5"
                )}
                aria-pressed={value === "2d"}
            >
                <Layers className="h-3.5 w-3.5" />
                <span>2D</span>
            </button>

            <button
                type="button"
                onClick={() => onValueChange("3d")}
                disabled={disabled}
                data-state={value === "3d" ? "active" : "inactive"}
                className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-300",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    value === "3d"
                        ? "bg-cyan-600/80 text-white shadow-sm border border-cyan-400/30"
                        : "text-white/40 hover:text-white/70 hover:bg-white/5"
                )}
                aria-pressed={value === "3d"}
            >
                <Box className="h-3.5 w-3.5" />
                <span>3D</span>
            </button>
        </div>
    );
}
