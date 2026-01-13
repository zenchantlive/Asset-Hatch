"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { User, Box, Layers, Bone, Clock } from "lucide-react";
import { parse3DPlan } from "@/lib/3d-plan-parser";
import { cn } from "@/lib/utils";

interface PlanPreview3DProps {
    markdown: string;
    onEdit?: () => void;
    onApprove?: () => void;
    isLoading?: boolean;
}

export function PlanPreview3D({
    markdown,
    onEdit,
    onApprove,
    isLoading = false,
}: PlanPreview3DProps) {
    const parsedPlan = useMemo(() => {
        if (!markdown) return null;
        return parse3DPlan(markdown);
    }, [markdown]);

    const assetCount = useMemo(() => {
        if (!parsedPlan) return { rig: 0, static: 0, total: 0 };
        return {
            rig: parsedPlan.assets.filter((a) => a.type === "rigged").length,
            static: parsedPlan.assets.filter((a) => a.type === "static").length,
            total: parsedPlan.assets.length,
        };
    }, [parsedPlan]);

    if (!markdown) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-cyan-600/20 flex items-center justify-center mb-4">
                    <Box className="h-8 w-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                    No 3D Plan Yet
                </h3>
                <p className="text-sm text-white/50 max-w-sm">
                    Describe your 3D project using the chat. Include{" "}
                    <code className="px-1.5 py-0.5 rounded bg-cyan-600/20 text-cyan-300 text-xs">
                        [RIG]
                    </code>{" "}
                    tags for rigged characters and{" "}
                    <code className="px-1.5 py-0.5 rounded bg-cyan-600/20 text-cyan-300 text-xs">
                        [STATIC]
                    </code>{" "}
                    for static objects.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-white/5 bg-glass-bg/30 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-600/20 flex items-center justify-center">
                            <Layers className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-white">
                                3D Asset Plan
                            </h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1.5 text-xs text-white/50">
                                    <Bone className="h-3 w-3 text-cyan-400" />
                                    {assetCount.rig} Rigged
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-white/50">
                                    <Box className="h-3 w-3 text-teal-400" />
                                    {assetCount.static} Static
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-white/50">
                                    <Clock className="h-3 w-3" />
                                    {assetCount.total} Total
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                            >
                                Edit Plan
                            </button>
                        )}
                        {onApprove && (
                            <button
                                onClick={onApprove}
                                disabled={isLoading}
                                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50"
                            >
                                {isLoading ? "Saving..." : "Approve Plan"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                        components={{
                            h1: ({ children }) => (
                                <h1 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2">
                                    {children}
                                </h1>
                            ),
                            h2: ({ children }) => (
                                <h2 className="text-base font-medium text-cyan-300 mt-6 mb-3">
                                    {children}
                                </h2>
                            ),
                            h3: ({ children }) => (
                                <h3 className="text-sm font-medium text-white/80 mt-4 mb-2">
                                    {children}
                                </h3>
                            ),
                            ul: ({ children }) => (
                                <ul className="space-y-2 my-4">{children}</ul>
                            ),
                            li: ({ children }) => {
                                // Check if this is a RIG or STATIC asset
                                const text = String(children);
                                const isRig = text.includes("[RIG]");
                                const isStatic = text.includes("[STATIC]");

                                return (
                                    <li className="flex items-start gap-3 text-white/70">
                                        {isRig && (
                                            <span className="flex-shrink-0 mt-0.5">
                                                <User className="h-4 w-4 text-cyan-400" />
                                            </span>
                                        )}
                                        {isStatic && (
                                            <span className="flex-shrink-0 mt-0.5">
                                                <Box className="h-4 w-4 text-teal-400" />
                                            </span>
                                        )}
                                        {!isRig && !isStatic && (
                                            <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-white/30" />
                                        )}
                                        <span
                                            className={cn(
                                                "flex-1",
                                                isRig && "text-cyan-100",
                                                isStatic && "text-teal-100"
                                            )}
                                        >
                                            {children}
                                        </span>
                                    </li>
                                );
                            },
                            p: ({ children }) => (
                                <p className="text-white/60 my-3 leading-relaxed">
                                    {children}
                                </p>
                            ),
                            strong: ({ children }) => (
                                <strong className="text-white font-medium">
                                    {children}
                                </strong>
                            ),
                        }}
                    >
                        {markdown}
                    </ReactMarkdown>
                </div>
            </div>

            {/* Animation Summary */}
            {parsedPlan && parsedPlan.animations.length > 0 && (
                <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 bg-glass-bg/20">
                    <h4 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-3">
                        Animation Requirements
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {parsedPlan.animations.map((anim, i) => (
                            <span
                                key={i}
                                className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-600/20 text-cyan-300 border border-cyan-500/20"
                            >
                                {anim}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
