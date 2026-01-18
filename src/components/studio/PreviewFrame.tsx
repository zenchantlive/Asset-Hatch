// -----------------------------------------------------------------------------
// Preview Frame Component
// Sandboxed iframe that executes Babylon.js code from multiple files
// Multi-file support: Accepts GameFile[] and concatenates them for preview
// Includes error detection and fix button
// -----------------------------------------------------------------------------

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, Wrench, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GameFileData } from '@/lib/studio/types';
import { generateAssetLoaderScript } from '@/lib/studio/asset-loader';
import { manifestEntryToAssetInfo } from '@/lib/studio/types';
import type { AssetManifest, AssetManifestEntry } from '@/lib/types/unified-project';
import type { AssetInfo } from '@/lib/studio/types';

import { IFRAME_SCRIPTS } from '@/lib/studio/preview-libraries';

/**
 * Error info structure
 */
interface ErrorInfo {
    message: string;
    line?: number;
}

/**
 * Props for PreviewFrame
 */
interface PreviewFrameProps {
    /** Array of game files to execute in order (sorted by orderIndex) */
    files: GameFileData[];
    /** Optional asset manifest for ASSETS global helper */
    assetManifest?: AssetManifest;
    /** Whether the scene should be playing */
    isPlaying: boolean;
    /** Callback when iframe is ready */
    onReady?: () => void;
    /** Callback when an error occurs */
    onError?: (message: string) => void;
    /** Callback to request AI to fix the error */
    onRequestFix?: (error: ErrorInfo) => void;
    /** Key to force iframe reload */
    previewKey?: number;
}

/**
 * Concatenate files in orderIndex order for execution
 */
function concatenateFiles(files: GameFileData[]): string {
    return files
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((f) => f.content)
        .join('\n\n');
}

/**
 * PreviewFrame - sandboxed Babylon.js execution environment
 * Multi-file support: accepts GameFile[] instead of single code string
 */

/**
 * Convert AssetManifest to AssetInfo array for iframe
 */
function convertManifestToAssetInfo(manifest: AssetManifest): AssetInfo[] {
  return Object.entries(manifest.assets).map(([key, entry]) =>
    manifestEntryToAssetInfo(key, entry)
  );
}

export function PreviewFrame({
    files,
    assetManifest,
    isPlaying,
    onReady,
    onError,
    onRequestFix,
    previewKey = 0,
}: PreviewFrameProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);

    // Concatenate files for preview
    const concatenatedCode = concatenateFiles(files);

    // Clear error when preview key changes (new code)
    useEffect(() => {
        setCurrentError(null);
    }, [previewKey, concatenatedCode]);

    // Handle fix request
    const handleFixClick = useCallback(() => {
        if (currentError && onRequestFix) {
            onRequestFix(currentError);
        }
    }, [currentError, onRequestFix]);

    // Generate asset loader script if manifest provided
    const assetScript = assetManifest
      ? generateAssetLoaderScript(convertManifestToAssetInfo(assetManifest))
      : '// No assets available';

    // Generate script tags from library manifest
    const scriptTags = IFRAME_SCRIPTS
        .map((src) => `  <script src="${src}"></script>`)
        .join('\n');

    // Build the HTML document for the iframe with concatenated files
    const iframeContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Babylon.js Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1a1a; }
    #renderCanvas { width: 100%; height: 100%; touch-action: none; }
    #error-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.9); color: #ff6b6b; z-index: 1000;
      display: none; align-items: center; justify-content: center;
      padding: 2rem; font-family: monospace; font-size: 14px;
    }
    #error-overlay.show { display: flex; }
  </style>
${scriptTags}
</head>
<body>
  <canvas id="renderCanvas"></canvas>
  <div id="error-overlay"></div>
  <script>
    // Error handling - capture and send to parent
    window.addEventListener('error', function(e) {
      const errorEl = document.getElementById('error-overlay');
      errorEl.textContent = 'Error: ' + e.message + '\\n\\nLine: ' + e.lineno;
      errorEl.classList.add('show');
      window.parent.postMessage({ type: 'error', message: e.message, line: e.lineno }, '*');
    });

    // Ready signal
    window.addEventListener('load', function() {
      window.parent.postMessage({ type: 'ready' }, '*');
    });

    // Execute user code (concatenated from multiple files)
    try {
      // ASSETS global injected before user code
      ${assetScript}
      
      // User code executes after ASSETS is available
      ${concatenatedCode}
    } catch (error) {
      const errorEl = document.getElementById('error-overlay');
      errorEl.textContent = 'Runtime Error: ' + error.message;
      errorEl.classList.add('show');
      window.parent.postMessage({ type: 'error', message: error.message }, '*');
    }

    // FPS counter (send to parent every second)
    if (typeof engine !== 'undefined') {
      setInterval(function() {
        const fps = engine.getFps().toFixed(0);
        window.parent.postMessage({ type: 'fps', value: fps }, '*');
      }, 1000);
    }
  </script>
</body>
</html>
  `.trim();

    // Listen for postMessage from iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'ready') {
                setCurrentError(null);
                onReady?.();
            } else if (event.data.type === 'error') {
                const errorInfo: ErrorInfo = {
                    message: event.data.message,
                    line: event.data.line,
                };
                setCurrentError(errorInfo);
                onError?.(event.data.message);
            } else if (event.data.type === 'fps') {
                // FPS updates handled by parent component
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onReady, onError]);

    return (
        <div className="relative w-full h-full">
            {/* Iframe */}
            <iframe
                key={previewKey}
                ref={iframeRef}
                srcDoc={iframeContent}
                sandbox="allow-scripts"
                className="w-full h-full border-0"
                title="Babylon.js Preview"
            />

            {/* Error overlay with fix button */}
            {currentError && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 z-10">
                    <div className="glass-panel p-6 max-w-md w-full space-y-4 border border-red-500/30">
                        {/* Error header */}
                        <div className="flex items-center gap-3 text-red-400">
                            <AlertTriangle className="w-6 h-6 shrink-0" />
                            <h3 className="font-semibold text-lg">Runtime Error</h3>
                        </div>

                        {/* Error message */}
                        <div className="bg-red-950/50 rounded-lg p-3 border border-red-500/20">
                            <code className="text-sm text-red-300 font-mono break-all">
                                {currentError.message}
                            </code>
                            {currentError.line && (
                                <p className="text-xs text-red-400/70 mt-2">
                                    Line: {currentError.line}
                                </p>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            {onRequestFix && (
                                <Button
                                    onClick={handleFixClick}
                                    className="flex-1 bg-primary hover:bg-primary/90"
                                >
                                    <Wrench className="w-4 h-4 mr-2" />
                                    Ask AI to Fix
                                </Button>
                            )}
                            <Button
                                onClick={() => setCurrentError(null)}
                                variant="outline"
                                className="flex-1 border-white/20"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Dismiss
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
