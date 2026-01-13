"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { meshStyleSchema, textureQualitySchema } from "@/lib/schemas-3d";
import { db } from "@/lib/client-db";
import type { ProjectQualities } from "@/components/planning/QualitiesBar";

// 3D-specific quality options
const MESH_STYLE_OPTIONS = [
    { value: "realistic", label: "Realistic" },
    { value: "stylized", label: "Stylized" },
    { value: "low_poly", label: "Low Poly" },
    { value: "voxel", label: "Voxel" },
] as const;

const TEXTURE_QUALITY_OPTIONS = [
    { value: "draft", label: "Draft (Fast)" },
    { value: "standard", label: "Standard" },
    { value: "high", label: "High Quality" },
] as const;

const POLY_COUNT_OPTIONS = [
    { value: "auto", label: "Auto" },
    { value: "10k", label: "~10K" },
    { value: "25k", label: "~25K" },
    { value: "50k", label: "~50K" },
    { value: "100k", label: "~100K" },
] as const;

const RIGGING_OPTIONS = [
    { value: "auto", label: "Auto-Rig" },
    { value: "manual", label: "Manual Only" },
    { value: "none", label: "Static (No Rig)" },
] as const;

interface QualitiesBar3DProps {
    projectId?: string;
    qualities: ProjectQualities;
    onQualitiesChange: (qualities: ProjectQualities) => void;
    onSave?: () => void;
    mode?: "bar" | "popover";
    defaultExpanded?: boolean;
}

export function QualitiesBar3D({
    projectId,
    qualities: externalQualities,
    onQualitiesChange,
    onSave,
    mode = "bar",
    defaultExpanded = false,
}: QualitiesBar3DProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [isSaving, setIsSaving] = useState(false);

    // Internal state for 3D-specific qualities
    const [meshStyle, setMeshStyle] = useState(externalQualities.meshStyle || "realistic");
    const [textureQuality, setTextureQuality] = useState(externalQualities.textureQuality || "standard");
    const [polyCount, setPolyCount] = useState(externalQualities.polyCount || "auto");
    const [rigging, setRigging] = useState(externalQualities.rigging || "auto");

    // Sync internal state when external qualities change
    useEffect(() => {
        if (externalQualities.meshStyle) setMeshStyle(externalQualities.meshStyle);
        if (externalQualities.textureQuality) setTextureQuality(externalQualities.textureQuality);
        if (externalQualities.polyCount) setPolyCount(externalQualities.polyCount);
        if (externalQualities.rigging) setRigging(externalQualities.rigging);
    }, [externalQualities]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Validate with Zod schemas
            const validatedMeshStyle = meshStyleSchema.parse(meshStyle);
            const validatedTexture = textureQualitySchema.parse(textureQuality);

            // Update parent state with 3D qualities
            onQualitiesChange({
                ...externalQualities,
                meshStyle: validatedMeshStyle,
                textureQuality: validatedTexture,
                polyCount,
                rigging,
            });

            // Save to memory files using db directly if projectId provided
            if (projectId) {
                const now = new Date().toISOString();
                await db.memory_files.put({
                    id: crypto.randomUUID(),
                    project_id: projectId,
                    type: "generation-log.json" as const,
                    content: JSON.stringify({
                        meshStyle: validatedMeshStyle,
                        textureQuality: validatedTexture,
                        polyCount,
                        rigging,
                    }, null, 2),
                    updated_at: now,
                    created_at: now,
                });
            }

            console.log("✅ 3D qualities saved:", { meshStyle, textureQuality, polyCount, rigging });
            onSave?.();
        } catch (error) {
            console.error("Failed to save 3D qualities:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // For mobile popover mode
    if (mode === "popover") {
        return (
            <div className="flex items-center gap-2">
                <Select
                    value={meshStyle}
                    onValueChange={(value) => {
                        setMeshStyle(value);
                        onQualitiesChange({ ...externalQualities, meshStyle: value });
                    }}
                >
                    <SelectTrigger className="w-24 h-8 bg-white/5 border-white/10 text-xs text-white">
                        <SelectValue placeholder="Mesh" />
                    </SelectTrigger>
                    <SelectContent>
                        {MESH_STYLE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-8 text-xs"
                >
                    <Save className="h-3 w-3 mr-1" />
                    {isSaving ? "..." : "Save"}
                </Button>
            </div>
        );
    }

    // For desktop bar mode
    return (
        <div className="w-full bg-glass-bg/30 backdrop-blur-md border-b border-white/5">
            {/* Compact Header */}
            <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                        3D Mode
                    </span>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                        <span className="px-2 py-0.5 rounded bg-cyan-600/20 text-cyan-300">
                            {meshStyle}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-cyan-600/20 text-cyan-300">
                            {textureQuality}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-white/60 hover:text-white"
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white"
                    >
                        <Save className="h-4 w-4 mr-1" />
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>

            {/* Expanded Options */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-white/5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Mesh Style */}
                        <div className="space-y-2">
                            <label className="text-xs text-white/60">Mesh Style</label>
                            <Select
                                value={meshStyle}
                                onValueChange={(value) => {
                                    setMeshStyle(value);
                                    onQualitiesChange({ ...externalQualities, meshStyle: value });
                                }}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MESH_STYLE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Texture Quality */}
                        <div className="space-y-2">
                            <label className="text-xs text-white/60">Texture Quality</label>
                            <Select
                                value={textureQuality}
                                onValueChange={(value) => {
                                    setTextureQuality(value);
                                    onQualitiesChange({ ...externalQualities, textureQuality: value });
                                }}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TEXTURE_QUALITY_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Poly Count */}
                        <div className="space-y-2">
                            <label className="text-xs text-white/60">Poly Count</label>
                            <Select
                                value={polyCount}
                                onValueChange={(value) => {
                                    setPolyCount(value);
                                    onQualitiesChange({ ...externalQualities, polyCount: value });
                                }}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {POLY_COUNT_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Rigging */}
                        <div className="space-y-2">
                            <label className="text-xs text-white/60">Rigging</label>
                            <Select
                                value={rigging}
                                onValueChange={(value) => {
                                    setRigging(value);
                                    onQualitiesChange({ ...externalQualities, rigging: value });
                                }}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {RIGGING_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
