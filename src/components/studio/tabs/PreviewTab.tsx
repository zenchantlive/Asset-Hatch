// -----------------------------------------------------------------------------
// Preview Tab Component
// Displays Babylon.js preview with controls and FPS badge
// Multi-file support: Passes GameFile[] to PreviewFrame
// Error fix requests are handled by PreviewFrame overlay
// -----------------------------------------------------------------------------

'use client';

import { useState, useCallback } from 'react';
import { useStudio } from '@/lib/studio/context';
import { PreviewFrame } from '../PreviewFrame';
import { AlertCircle } from 'lucide-react';

/**
 * PreviewTab - preview iframe with controls
 * Multi-file support: Uses files array from context instead of code string
 */
export function PreviewTab() {
    const { files, isPlaying, previewKey, requestErrorFix } = useStudio();
    const [fps, setFps] = useState<number>(0);
    const [hasError, setHasError] = useState(false);
    const [isReady, setIsReady] = useState(false);

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
                </div>
            </div>

            {/* Preview iframe with built-in error overlay */}
            {/* Multi-file: Pass files array instead of code string */}
            <div className="flex-1 bg-studio-preview-bg relative">
                <PreviewFrame
                    files={files}
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
