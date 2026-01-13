"use client";

import { Layers, Box } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectModeIndicatorProps {
    mode: "2d" | "3d";
    className?: string;
    showLabel?: boolean;
    size?: "sm" | "md" | "lg";
}

export function ProjectModeIndicator({
    mode,
    className,
    showLabel = false,
    size = "md",
}: ProjectModeIndicatorProps) {
    const sizeClasses = {
        sm: {
            container: "px-1.5 py-0.5 gap-1",
            icon: "h-3 w-3",
            label: "text-[10px]",
        },
        md: {
            container: "px-2 py-1 gap-1.5",
            icon: "h-3.5 w-3.5",
            label: "text-xs",
        },
        lg: {
            container: "px-3 py-1.5 gap-2",
            icon: "h-4 w-4",
            label: "text-sm",
        },
    };

    const is3D = mode === "3d";

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full font-medium transition-colors",
                is3D
                    ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/30"
                    : "bg-purple-600/20 text-purple-300 border border-purple-500/30",
                sizeClasses[size].container,
                className
            )}
        >
            {is3D ? (
                <Box className={cn("text-cyan-400", sizeClasses[size].icon)} />
            ) : (
                <Layers className={cn("text-purple-400", sizeClasses[size].icon)} />
            )}
            {showLabel && (
                <span className={sizeClasses[size].label}>
                    {is3D ? "3D" : "2D"}
                </span>
            )}
        </span>
    );
}
