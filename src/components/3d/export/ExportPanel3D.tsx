/**
 * ExportPanel3D Component
 *
 * Displays export options and triggers ZIP download of approved 3D assets.
 * Mirrors the 2D ExportPanel pattern with 3D-specific metadata.
 *
 * Features:
 * - Lists all approved 3D assets
 * - ZIP download with GLB files and manifest
 * - Progress indicator during export
 * - Summary of included assets
 *
 * @see components/export/ExportPanel.tsx for 2D pattern
 * @see app/api/export-3d/route.ts for export endpoint
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Package, FileArchive, CheckCircle2, Loader2 } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the ExportPanel3D component.
 */
interface ExportPanel3DProps {
    // Project ID to export assets from
    projectId: string;
}

/**
 * Approved 3D asset info for display.
 */
interface Approved3DAsset {
    // Asset ID from database
    id: string;
    // Asset name from plan
    name: string;
    // Whether asset has been rigged
    isRigged: boolean;
    // Number of animations applied
    animationCount: number;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * ExportPanel3D Component
 *
 * Shows export controls for approved 3D assets.
 * Triggers ZIP download with GLB files and manifest.
 *
 * @param projectId - Project ID to export assets from
 */
export function ExportPanel3D({ projectId }: ExportPanel3DProps) {
    // State for approved assets list
    const [approvedAssets, setApprovedAssets] = useState<Approved3DAsset[]>([]);
    // Loading state for fetching assets
    const [isLoadingAssets, setIsLoadingAssets] = useState(true);
    // Exporting state for ZIP generation
    const [isExporting, setIsExporting] = useState(false);
    // Project name for display
    const [projectName, setProjectName] = useState<string>("3D Project");

    // -------------------------------------------------------------------------
    // Load Approved Assets
    // -------------------------------------------------------------------------

    useEffect(() => {
        async function loadApprovedAssets() {
            try {
                // Fetch approved 3D assets from API
                const response = await fetch(`/api/projects/${projectId}/3d-assets?status=approved`);

                if (!response.ok) {
                    console.error("Failed to fetch approved assets");
                    setIsLoadingAssets(false);
                    return;
                }

                const data = await response.json() as {
                    success: boolean;
                    assets?: Array<{
                        id: string;
                        name: string;
                        riggedModelUrl?: string;
                        animatedModelUrls?: string;
                    }>;
                    projectName?: string;
                };

                if (data.success && data.assets) {
                    // Map API response to display format
                    const assets: Approved3DAsset[] = data.assets.map((asset) => {
                        // Parse animation URLs if present
                        let animationCount = 0;
                        if (asset.animatedModelUrls) {
                            try {
                                const urls = JSON.parse(asset.animatedModelUrls);
                                animationCount = Object.keys(urls).length;
                            } catch {
                                animationCount = 0;
                            }
                        }

                        return {
                            id: asset.id,
                            name: asset.name,
                            isRigged: !!asset.riggedModelUrl,
                            animationCount,
                        };
                    });

                    setApprovedAssets(assets);
                    if (data.projectName) {
                        setProjectName(data.projectName);
                    }
                }

                setIsLoadingAssets(false);
            } catch (err) {
                console.error("Error loading approved assets:", err);
                setIsLoadingAssets(false);
            }
        }

        loadApprovedAssets();
    }, [projectId]);

    // -------------------------------------------------------------------------
    // Export Handler
    // -------------------------------------------------------------------------

    /**
     * Triggers export to generate ZIP with all approved 3D assets.
     * Downloads the ZIP file directly to the browser.
     */
    const handleExport = useCallback(async () => {
        if (approvedAssets.length === 0) {
            console.warn("No approved assets to export");
            return;
        }

        setIsExporting(true);

        try {
            // Call export API
            const response = await fetch("/api/export-3d", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId }),
            });

            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }

            // Get the ZIP blob from response
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${projectName.replace(/\s+/g, "_")}_3D_Assets.zip`;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Export error:", err);
        } finally {
            setIsExporting(false);
        }
    }, [projectId, approvedAssets.length, projectName]);

    // -------------------------------------------------------------------------
    // Loading State
    // -------------------------------------------------------------------------

    if (isLoadingAssets) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    <span className="text-white/60">Loading approved assets...</span>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // Main Render
    // -------------------------------------------------------------------------

    return (
        <div className="w-full h-full p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <FileArchive className="h-6 w-6 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white/90">Export 3D Assets</h2>
            </div>

            {/* Summary Card */}
            <div className="glass-panel p-6 space-y-4">
                {/* Project Info */}
                <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-white/40" />
                    <span className="text-white/90 font-medium">{projectName}</span>
                </div>

                {/* Asset Count */}
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <span className="text-white/70">
                        {approvedAssets.length} approved asset{approvedAssets.length !== 1 ? "s" : ""} ready to export
                    </span>
                </div>

                {/* Export Contents Description */}
                <div className="text-sm text-white/50 space-y-1">
                    <p>The ZIP file will contain:</p>
                    <ul className="list-disc list-inside ml-2 space-y-0.5">
                        <li>GLB model files for each asset</li>
                        <li>Rigged models (if applicable)</li>
                        <li>Animated models (for each preset)</li>
                        <li>manifest-3d.json with metadata</li>
                    </ul>
                </div>
            </div>

            {/* Approved Assets List */}
            {approvedAssets.length > 0 ? (
                <div className="glass-panel p-4 space-y-2">
                    <h3 className="text-sm font-medium text-white/70 mb-3">Included Assets</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {approvedAssets.map((asset) => (
                            <div
                                key={asset.id}
                                className="flex items-center gap-3 p-2 rounded bg-white/5 border border-white/5"
                            >
                                {/* Check icon */}
                                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />

                                {/* Asset name */}
                                <span className="text-sm text-white/80 flex-1 truncate">{asset.name}</span>

                                {/* Rigged badge */}
                                {asset.isRigged && (
                                    <span className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-300">
                                        Rigged
                                    </span>
                                )}

                                {/* Animation count */}
                                {asset.animationCount > 0 && (
                                    <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-300">
                                        {asset.animationCount} anim
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // No approved assets message
                <div className="glass-panel p-6 text-center">
                    <p className="text-white/50">No approved assets yet.</p>
                    <p className="text-sm text-white/40 mt-1">
                        Generate and approve 3D assets in the Generation tab first.
                    </p>
                </div>
            )}

            {/* Export Button */}
            <Button
                onClick={handleExport}
                disabled={isExporting || approvedAssets.length === 0}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50"
            >
                {isExporting ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating ZIP...
                    </>
                ) : (
                    <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Asset Pack
                    </>
                )}
            </Button>

            {/* Tip Box */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3 text-xs text-white/70">
                <strong className="text-purple-300">Tip:</strong> The manifest-3d.json file contains all asset
                metadata including prompts, animation presets, and generation settings. Use this for AI-assisted
                integration into your game engine.
            </div>
        </div>
    );
}
