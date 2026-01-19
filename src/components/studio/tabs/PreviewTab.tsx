// -----------------------------------------------------------------------------
// Preview Tab Component
// Displays Babylon.js preview with controls and FPS badge
// Multi-file support: Passes GameFile[] to PreviewFrame
// Error fix requests are handled by PreviewFrame overlay
// -----------------------------------------------------------------------------

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useStudio } from '@/lib/studio/context';
import type { AssetManifest } from '@/lib/types/unified-project';
import { PreviewFrame } from '../PreviewFrame';
import { AlertCircle } from 'lucide-react';

/**
 * PreviewTab - preview iframe with controls
 * Multi-file support: Uses files array from context instead of code string
 */
export function PreviewTab() {
    const { files, isPlaying, previewKey, requestErrorFix, game } = useStudio();
    const [fps, setFps] = useState<number>(0);
    const [hasError, setHasError] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [assetManifest, setAssetManifest] = useState<AssetManifest | null>(null);
    const [showAssetRegistry, setShowAssetRegistry] = useState(false);

    // Handle iframe ready
    const handleReady = useCallback(() => {
        setIsReady(true);
        setHasError(false);
    }, []);

    // Handle error - just track state, PreviewFrame shows the overlay
    const handleError = useCallback((message: string) => {
        setHasError(true);
        console.log('🚨 Preview error:', message);
    }, []);

    // Fetch asset manifest on mount
    useEffect(() => {
        if (!game?.id) return;
        
        async function fetchAssets() {
            try {
                // Safely get game.id - game comes from context and should exist
            const currentGameId = game?.id;
            if (!currentGameId) return;
            
            const response = await fetch(`/api/studio/games/${currentGameId}/assets`);
                if (response.ok) {
                    const manifest = await response.json();
                    setAssetManifest(manifest);
                }
            } catch (error) {
                console.warn('[PreviewTab] Failed to fetch asset manifest:', error);
            }
        }
        
        fetchAssets();
    }, [game?.id]);

    // Handle fix request from PreviewFrame
    const handleRequestFix = useCallback((error: { message: string; line?: number }) => {
        requestErrorFix(error);
    }, [requestErrorFix]);

    return (
        <div className="h-full flex flex-col preview-container relative">
            {/* Controls bar - simplified, no PlayControls */}
            <div className="h-12 border-b border-studio-panel-border px-4 flex items-center justify-between bg-studio-panel-bg">
                <div className="flex items-center gap-2">
                    {/* File count indicator */}
                    <span className="text-sm text-muted-foreground">
                        {files.length} file{files.length !== 1 ? 's' : ''}
                    </span>
                    {/* Asset count indicator */}
                    {assetManifest && Object.keys(assetManifest.assets).length > 0 && (
                        <span className="text-xs text-purple-400">
                            {Object.keys(assetManifest.assets).length} asset{Object.keys(assetManifest.assets).length !== 1 ? 's' : ''}
                        </span>
                    )}
                    
                    {/* FPS Badge */}
                    {isReady && !hasError && (
                        <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-xs font-mono text-green-400">
                            {fps || '60'} FPS
                        </div>
                    )}
                </div>

                {/* Status indicators */}
                <div className="flex items-center gap-2">
                    {!isReady && !hasError && (
                        <span className="text-xs text-muted-foreground">Loading preview...</span>
                    )}
                    {hasError && (
                        <div className="flex items-center gap-1 text-red-400 text-xs">
                            <AlertCircle className="h-3 w-3" />
                            Error in scene
                        </div>
                    )}
                    {assetManifest && Object.keys(assetManifest.assets).length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowAssetRegistry((prev) => !prev)}
                            className="text-xs text-muted-foreground hover:text-white transition-colors"
                        >
                            {showAssetRegistry ? 'Hide Assets' : 'Show Assets'}
                        </button>
                    )}
                </div>
            </div>

            {/* Preview iframe with built-in error overlay */}
            {/* Multi-file: Pass files array instead of code string */}
            <div className="flex-1 bg-studio-preview-bg relative">
                {showAssetRegistry && assetManifest && (
                    <div className="absolute top-3 left-3 z-20 max-w-xs w-64 bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-white backdrop-blur">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Asset Registry</span>
                            <span className="text-[10px] text-white/60">
                                {Object.keys(assetManifest.assets).length} total
                            </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                            {Object.entries(assetManifest.assets).map(([key, entry]) => (
                                <div key={key} className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-medium text-white/90">{key}</div>
                                        <div className="text-[10px] text-white/60">{entry.name}</div>
                                    </div>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                                        {entry.type.toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <PreviewFrame
                    files={files}
                    assetManifest={assetManifest || undefined}
                    gameId={game?.id}
                    isPlaying={isPlaying}
                    previewKey={previewKey}
                    onReady={handleReady}
                    onError={handleError}
                    onRequestFix={handleRequestFix}
                />
            </div>
        </div>
    );
}
