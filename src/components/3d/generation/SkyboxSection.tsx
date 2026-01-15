"use client";

/**
 * SkyboxSection Component
 *
 * UI section for generating equirectangular skybox images.
 * Provides prompt input, model selection, and 360 preview.
 *
 * Features:
 * - Collapsible section header
 * - Prompt textarea for skybox description
 * - Model selector dropdown
 * - Generate button with loading state
 * - SkyboxViewer for 360 preview
 * - Download button for generated image
 *
 * @see GenerationQueue3D.tsx for parent container
 * @see SkyboxViewer.tsx for 360 preview component
 */

import { useState, useCallback } from "react";
import {
    Cloud,
    ChevronDown,
    ChevronRight,
    Play,
    Loader2,
    Download,
    Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getImageGenerationModels, CURATED_MODELS } from "@/lib/model-registry";
import { SKYBOX_PRESETS, type SkyboxPreset } from "@/lib/skybox-prompts";
import { SimpleSkyboxViewer } from "./SimpleSkyboxViewer";
import { blendSeams } from "@/lib/image-processing";

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the SkyboxSection component.
 */
interface SkyboxSectionProps {
    // Project ID for API calls
    projectId: string;
    // Callback when skybox is generated
    onGenerated?: (url: string) => void;
    // Initial URL from persistence
    initialUrl?: string | null;
    // Initial approval status from persistence
    initialApprovalStatus?: 'pending' | 'approved' | 'rejected' | null;
}

// =============================================================================
// Constants
// =============================================================================

/** Default skybox prompt to help users get started */
const DEFAULT_PROMPT = "a vibrant sunset sky with orange and purple clouds";

/** Default model for skybox generation */
const DEFAULT_MODEL = "google/gemini-3-pro-image-preview";

// =============================================================================
// Main Component
// =============================================================================

/**
 * SkyboxSection Component
 *
 * Collapsible section for skybox generation in the 3D workflow.
 *
 * @param projectId - Project ID for API context
 * @param onGenerated - Callback when skybox is successfully generated
 */

export function SkyboxSection({
    projectId,
    onGenerated,
    initialUrl,
    initialApprovalStatus,
}: SkyboxSectionProps) {
    // Section collapse state
    const [isCollapsed, setIsCollapsed] = useState(true);

    // Prompt input state
    const [prompt, setPrompt] = useState("");

    // Preset selection
    const [selectedPreset, setSelectedPreset] = useState<SkyboxPreset>('custom');

    // Selected model ID
    const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);

    // Seam blending state
    const [isBlending, setIsBlending] = useState(false);

    // Generated skybox URL
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(initialUrl || null);

    // Error state
    const [error, setError] = useState<string | null>(null);

    // Preview controls
    const [showSeamLine, setShowSeamLine] = useState(false);
    const [autoRotate, setAutoRotate] = useState(false);
    const [previewMode, setPreviewMode] = useState<'flat' | 'spherical'>('spherical');

    // Approval status state
    const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>(initialApprovalStatus || 'pending');

    // Get available image generation models
    const imageModels = getImageGenerationModels(CURATED_MODELS);

    // Toggle section collapse
    const toggleCollapse = useCallback(() => {
        setIsCollapsed((prev) => !prev);
    }, []);

    // Handle Clean Seams
    const handleCleanSeams = async () => {
        if (!generatedUrl) return;

        try {
            setIsBlending(true);
            setError(null);
            const blendedUrl = await blendSeams(generatedUrl);
            setGeneratedUrl(blendedUrl);

            // Persist the blended image to the database
            const skyboxAssetId = `${projectId}-skybox`;
            const response = await fetch(`/api/projects/${projectId}/3d-assets/${skyboxAssetId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ draftModelUrl: blendedUrl }),
            });

            if (!response.ok) {
                throw new Error('Failed to save blended skybox to database.');
            }

            // Notify parent to update its state as well
            if (onGenerated) {
                onGenerated(blendedUrl);
            }
        } catch (err) {
            console.error("Failed to blend seams:", err);
            setError("Failed to fix seam: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setIsBlending(false);
        }
    };

    // Handle skybox generation
    const handleGenerate = useCallback(async () => {
        // Use default prompt if empty
        const promptToUse = prompt.trim() || DEFAULT_PROMPT;

        setIsGenerating(true);
        setError(null);

        try {
            // Call skybox generation API
            const response = await fetch("/api/generate-skybox", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    prompt: promptToUse,
                    preset: selectedPreset,
                    modelId: selectedModel,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error || errorData.details || `HTTP ${response.status}`
                );
            }

            const data = await response.json();

            if (data.success && data.imageUrl) {
                setGeneratedUrl(data.imageUrl);
                onGenerated?.(data.imageUrl);
            } else {
                throw new Error("No image in response");
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Unknown error";
            setError(errorMessage);
            console.error("Skybox generation error:", err);
        } finally {
            setIsGenerating(false);
        }
    }, [prompt, projectId, selectedModel, selectedPreset, onGenerated]);

    // Handle download
    const handleDownload = useCallback(() => {
        if (!generatedUrl) return;

        // Create download link
        const link = document.createElement("a");
        link.href = generatedUrl;
        link.download = `skybox-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [generatedUrl]);

    // Handle approval status updates
    const [isUpdatingApproval, setIsUpdatingApproval] = useState(false);
    const handleApproval = async (status: 'approved' | 'rejected' | 'pending') => {
        try {
            setIsUpdatingApproval(true);
            setError(null);
            const skyboxAssetId = `${projectId}-skybox`;
            const res = await fetch(`/api/projects/${projectId}/3d-assets/${skyboxAssetId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approvalStatus: status }),
            });

            if (!res.ok) {
                throw new Error('Failed to update approval status');
            }
            // Update local state to reflect new approval status
            setApprovalStatus(status);
        } catch (err) {
            setError("Failed to update status: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setIsUpdatingApproval(false);
        }
    };

    return (
        <div className="border-t border-white/10">
            {/* Section Header */}
            <button
                onClick={toggleCollapse}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
                {/* Collapse indicator */}
                {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-white/50" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-white/50" />
                )}

                {/* Section icon */}
                <Cloud className="h-4 w-4 text-cyan-400" />

                {/* Section title */}
                <span className="text-sm font-medium text-white/80">
                    Skybox Generator
                </span>

                {/* Status indicator */}
                {generatedUrl && (
                    <span className="ml-auto text-xs text-green-400">✓ Generated</span>
                )}
                {isGenerating && (
                    <span className="ml-auto text-xs text-cyan-400 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                    </span>
                )}
            </button>

            {/* Section Content */}
            {!isCollapsed && (
                <div className="px-4 pb-4 space-y-4">
                    {/* Preset Selector */}
                    <div>
                        <label className="text-xs text-white/50 mb-1 block">
                            Preset
                        </label>
                        <Select value={selectedPreset} onValueChange={(val) => setSelectedPreset(val as SkyboxPreset)}>
                            <SelectTrigger className="bg-black/20 border-white/10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-glass-panel border-glass-border">
                                <SelectItem value="custom">Custom</SelectItem>
                                {Object.keys(SKYBOX_PRESETS).filter(k => k !== 'custom').map((preset) => (
                                    <SelectItem key={preset} value={preset}>
                                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Prompt Input */}
                    <div>
                        <label className="text-xs text-white/50 mb-1 block">
                            Skybox Description
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={DEFAULT_PROMPT}
                            className="w-full bg-black/20 rounded-lg p-3 text-sm text-white/80 border border-white/10 resize-none focus:border-cyan-500/50 focus:outline-none"
                            rows={2}
                        />
                    </div>

                    {/* Model Selector and Generate Button Row */}
                    <div className="flex items-center gap-3">
                        {/* Model Selector */}
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="w-[200px] bg-black/20 border-white/10">
                                <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent className="bg-glass-panel border-glass-border">
                                {imageModels.map((model) => (
                                    <SelectItem key={model.id} value={model.id}>
                                        {model.displayName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={cn(
                                "bg-cyan-600 hover:bg-cyan-500",
                                isGenerating && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Generate Skybox
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Preview Area with Tabs */}
                    {generatedUrl && (
                        <div className="space-y-2">
                            {/* Preview Mode Tabs */}
                            <div className="flex gap-2 border-b border-white/10">
                                <button
                                    onClick={() => setPreviewMode('spherical')}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium transition-colors",
                                        previewMode === 'spherical'
                                            ? "text-cyan-400 border-b-2 border-cyan-400"
                                            : "text-white/50 hover:text-white/70"
                                    )}
                                >
                                    Spherical 360°
                                </button>
                                <button
                                    onClick={() => setPreviewMode('flat')}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium transition-colors",
                                        previewMode === 'flat'
                                            ? "text-cyan-400 border-b-2 border-cyan-400"
                                            : "text-white/50 hover:text-white/70"
                                    )}
                                >
                                    Flat 2:1
                                </button>
                            </div>

                            {/* Preview Content */}
                            {previewMode === 'spherical' ? (
                                <div className="space-y-2">
                                    <div className="h-[250px] rounded-lg border border-white/10">
                                        <SimpleSkyboxViewer
                                            imageUrl={generatedUrl}
                                            showSeamLine={showSeamLine}
                                            autoRotate={autoRotate}
                                            rotationSpeed={0.5}
                                        />
                                    </div>
                                    {/* Controls */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-xs">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={showSeamLine}
                                                    onChange={(e) => setShowSeamLine(e.target.checked)}
                                                    className="w-3.5 h-3.5 rounded"
                                                />
                                                <span className="text-white/60">Seam Line</span>
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={autoRotate}
                                                    onChange={(e) => setAutoRotate(e.target.checked)}
                                                    className="w-3.5 h-3.5 rounded"
                                                />
                                                <span className="text-white/60">Auto-Rotate</span>
                                            </label>
                                        </div>

                                        {/* Clean Seam Button */}
                                        <Button
                                            onClick={handleCleanSeams}
                                            disabled={isBlending}
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30"
                                            title="Auto-blend image edges to remove seams"
                                        >
                                            {isBlending ? (
                                                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                            ) : (
                                                <Wand2 className="h-3 w-3 mr-1.5" />
                                            )}
                                            {isBlending ? "Fixing..." : "Fix Seam"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={generatedUrl}
                                    alt="Skybox preview"
                                    className="w-full rounded-lg border border-white/10"
                                />
                            )}

                            {/* Download Button */}
                            <Button
                                onClick={handleDownload}
                                variant="outline"
                                size="sm"
                                className="w-full border-white/20"
                            >
                                <Download className="h-3.5 w-3.5 mr-2" />
                                Download
                            </Button>

                            {/* Approval section - show buttons or status badge */}
                            {approvalStatus === 'pending' ? (
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        onClick={() => handleApproval('approved')}
                                        disabled={isUpdatingApproval}
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-green-600/30 text-green-400 hover:bg-green-950/30"
                                    >
                                        {isUpdatingApproval ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                                    </Button>
                                    <Button
                                        onClick={() => handleApproval('rejected')}
                                        disabled={isUpdatingApproval}
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-red-600/30 text-red-400 hover:bg-red-950/30"
                                    >
                                        {isUpdatingApproval ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reject"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between pt-2">
                                    <div className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                                        approvalStatus === 'approved'
                                            ? "bg-green-600/20 text-green-400 border border-green-600/30"
                                            : "bg-red-600/20 text-red-400 border border-red-600/30"
                                    )}>
                                        {approvalStatus === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                    </div>
                                    <Button
                                        onClick={() => setApprovalStatus('pending')}
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-white/50 hover:text-white/80"
                                    >
                                        Change
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
