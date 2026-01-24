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
import { generateCombinedHelperScript } from '@/lib/studio/asset-loader';
import { manifestEntryToAssetInfo } from '@/lib/studio/types';
import type { AssetManifest } from '@/lib/types/unified-project';
import type { AssetInfo } from '@/lib/studio/types';

import { IFRAME_SCRIPTS } from '@/lib/studio/preview-libraries';

/**
 * Error info structure
 */
interface ErrorInfo {
    message: string;
    line?: number;
    kind: 'runtime' | 'asset' | 'script';
    code?: string;
    stage?: string;
    requestId?: string;
    key?: string;
    script?: string;
}

/**
 * Props for PreviewFrame
 */
interface PreviewFrameProps {
    /** Array of game files to execute in order (sorted by orderIndex) */
    files: GameFileData[];
    /** Optional asset manifest for ASSETS global helper */
    assetManifest?: AssetManifest;
    /** Game ID for asset resolving */
    gameId?: string;
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
    return [...files]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((f) => f.content)
        .join('\n\n');
}

/**
 * Extract filename from a CDN URL for display purposes
 */
function getScriptName(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1] || url;
}

/**
 * Generate script tags with onload/onerror handlers for error detection
 * Each script reports its loading status via window.__scriptStatus
 */
function generateScriptTags(scripts: string[]): string {
    return scripts.map((src, index) => {
        const scriptName = getScriptName(src);
        // Use data attributes to safely pass script info without XSS concerns
        return `  <script
    src="${src}"
    data-script-name="${scriptName}"
    data-script-index="${index}"
    onload="window.__scriptStatus && window.__scriptStatus.loaded('${scriptName}')"
    onerror="window.__scriptStatus && window.__scriptStatus.failed('${scriptName}', '${src}')"
  ></script>`;
    }).join('\n');
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
    gameId,
    isPlaying,
    onReady,
    onError,
    onRequestFix,
    previewKey = 0,
}: PreviewFrameProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [errorState, setErrorState] = useState<{ key: string; error: ErrorInfo } | null>(null);

    console.log(isPlaying); // Use isPlaying to satisfy lint if needed, or remove from props if truly unused

    // Concatenate files for preview
    const concatenatedCode = concatenateFiles(files);
    const currentKey = `${previewKey}:${concatenatedCode}`;
    const activeError = errorState?.key === currentKey ? errorState.error : null;

    // Clear error when preview key changes (new code)
    // Handle fix request
    const handleFixClick = useCallback(() => {
        if (activeError && onRequestFix) {
            onRequestFix(activeError);
        }
    }, [activeError, onRequestFix]);

    // Generate combined ASSETS + CONTROLS helper script if manifest provided
    const assetScript = assetManifest
        ? generateCombinedHelperScript(
            convertManifestToAssetInfo(assetManifest),
            { gameId, debug: true },  // Enable debug mode for troubleshooting
            (typeof window !== 'undefined' && window.location.origin !== 'null') ? window.location.origin : '*'
        )
        : '// No assets available';

    // Generate script tags with error handling from library manifest
    const scriptTags = generateScriptTags(IFRAME_SCRIPTS);
    const totalScripts = IFRAME_SCRIPTS.length;

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
  <script>
    // Script loading status tracker - initialized before any external scripts load
    const PARENT_ORIGIN = typeof window !== 'undefined' ? (window.location.origin === 'null' ? '*' : window.location.origin) : '*';
    const TOTAL_SCRIPTS = ${totalScripts};

    window.__scriptStatus = {
      loadedCount: 0,
      failedScripts: [],

      loaded: function(name) {
        this.loadedCount++;
        console.log('[Script] Loaded: ' + name + ' (' + this.loadedCount + '/' + TOTAL_SCRIPTS + ')');
      },

      failed: function(name, url) {
        this.failedScripts.push({ name: name, url: url });
        console.error('[Script] Failed to load: ' + name);

        // Show error in overlay using safe DOM manipulation (textContent, not innerHTML)
        var errorEl = document.getElementById('error-overlay');
        if (errorEl) {
          errorEl.textContent = 'Script Load Error: Failed to load ' + name;
          errorEl.classList.add('show');
        }

        // Report to parent frame
        window.parent.postMessage({
          type: 'script-error',
          script: name,
          url: url,
          message: 'Failed to load external script: ' + name
        }, PARENT_ORIGIN);
      },

      allLoaded: function() {
        return this.loadedCount === TOTAL_SCRIPTS && this.failedScripts.length === 0;
      }
    };
  </script>
${scriptTags}
</head>
<body>
  <canvas id="renderCanvas"></canvas>
  <div id="error-overlay"></div>
  <script>
    // Error handling - capture and send to parent
    window.addEventListener('error', function(e) {
      var errorEl = document.getElementById('error-overlay');
      if (errorEl) {
        errorEl.textContent = 'Error: ' + e.message + '\\n\\nLine: ' + e.lineno;
        errorEl.classList.add('show');
      }
      window.parent.postMessage({ type: 'error', message: e.message, line: e.lineno }, PARENT_ORIGIN);
    });

    // Ready signal - only fires if no script errors occurred
    window.addEventListener('load', function() {
      // Check if any scripts failed to load
      if (window.__scriptStatus && window.__scriptStatus.failedScripts.length > 0) {
        console.warn('[Preview] Not sending ready signal due to script load failures');
        return;
      }
      window.parent.postMessage({ type: 'ready' }, PARENT_ORIGIN);
    });

    // Execute user code (concatenated from multiple files)
    // Only execute if all scripts loaded successfully
    if (window.__scriptStatus && window.__scriptStatus.failedScripts.length === 0) {
      try {
        // ASSETS global injected before user code
        ${assetScript}

        // User code executes after ASSETS is available
        ${concatenatedCode}
      } catch (error) {
        var errorEl = document.getElementById('error-overlay');
        if (errorEl) {
          errorEl.textContent = 'Runtime Error: ' + error.message;
          errorEl.classList.add('show');
        }
        window.parent.postMessage({ type: 'error', message: error.message }, PARENT_ORIGIN);
      }
    } else {
      console.warn('[Preview] Skipping user code execution due to script load failures');
    }

    // FPS counter (send to parent every second)
    if (typeof engine !== 'undefined') {
      setInterval(function() {
        var fps = engine.getFps().toFixed(0);
        window.parent.postMessage({ type: 'fps', value: fps }, PARENT_ORIGIN);
      }, 1000);
    }
  </script>
</body>
</html>
  `.trim();

    // Listen for postMessage from iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const data = event.data;
            const iframeWindow = iframeRef.current?.contentWindow;
            if (!iframeWindow || event.source !== iframeWindow) return;
            if (event.origin !== 'null' && event.origin !== window.location.origin) return;
            if (data?.type === 'ready') {
                setErrorState(null);
                onReady?.();
            } else if (data?.type === 'error') {
                const errorInfo: ErrorInfo = {
                    message: data.message,
                    line: data.line,
                    kind: 'runtime',
                };
                setErrorState({ key: currentKey, error: errorInfo });
                onError?.(data.message);
            } else if (data?.type === 'script-error') {
                // Handle script loading failures
                const errorInfo: ErrorInfo = {
                    message: data.message,
                    kind: 'script',
                    script: data.script,
                };
                setErrorState({ key: currentKey, error: errorInfo });
                onError?.(data.message);
            } else if (data?.type === 'asset-error') {
                const errorInfo: ErrorInfo = {
                    message: data.message,
                    kind: 'asset',
                    code: data.code,
                    stage: data.stage,
                    requestId: data.requestId,
                    key: data.key,
                };
                setErrorState({ key: currentKey, error: errorInfo });
                onError?.(data.message);
            } else if (data?.type === 'asset-resolve-request') {
                if (!gameId || !iframeRef.current?.contentWindow) return;
                const requestId = data.requestId;
                const key = data.key;
                if (!requestId || !key) return;

                console.log('[PreviewFrame] Received resolve request:', { 
                    requestId, 
                    key, 
                    gameId,
                    iframeExists: !!iframeRef.current?.contentWindow,
                    hasManifest: !!assetManifest,
                    assetCount: assetManifest ? Object.keys(assetManifest.assets || {}).length : 0
                });

                void fetch('/api/studio/assets/resolve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gameId, key }),
                }).then(async (response) => {
                    const payload = await response.json().catch(() => ({}));
                    iframeRef.current?.contentWindow?.postMessage({
                        type: 'asset-resolve-response',
                        requestId,
                        success: response.ok && payload?.url,
                        url: payload?.url || null,
                        source: payload?.source || null,
                        error: payload?.error || null,
                    }, event.origin === 'null' ? '*' : event.origin);
                }).catch(() => {
                    iframeRef.current?.contentWindow?.postMessage({
                        type: 'asset-resolve-response',
                        requestId,
                        success: false,
                        error: 'RESOLVE_REQUEST_FAILED',
                    }, event.origin === 'null' ? '*' : event.origin);
                });
            } else if (data?.type === 'fps') {
                // FPS updates handled by parent component
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [currentKey, gameId, onReady, onError]);

    // Helper function to get error type display name
    const getErrorTypeName = (kind: ErrorInfo['kind']): string => {
        switch (kind) {
            case 'script': return 'Script Load Error';
            case 'asset': return 'Asset Error';
            case 'runtime': return 'Runtime Error';
            default: return 'Error';
        }
    };

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
            {activeError && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 z-10">
                    <div className="glass-panel p-6 max-w-md w-full space-y-4 border border-red-500/30">
                        {/* Error header */}
                        <div className="flex items-center gap-3 text-red-400">
                            <AlertTriangle className="w-6 h-6 shrink-0" />
                            <h3 className="font-semibold text-lg">
                                {getErrorTypeName(activeError.kind)}
                            </h3>
                        </div>

                        {/* Error message */}
                        <div className="bg-red-950/50 rounded-lg p-3 border border-red-500/20">
                            <code className="text-sm text-red-300 font-mono break-all">
                                {activeError.message}
                            </code>
                            {activeError.script && (
                                <p className="text-xs text-red-400/70 mt-2">
                                    Script: {activeError.script}
                                </p>
                            )}
                            {activeError.code && (
                                <p className="text-xs text-red-400/70 mt-2">
                                    Code: {activeError.code}
                                </p>
                            )}
                            {activeError.stage && (
                                <p className="text-xs text-red-400/70 mt-1">
                                    Stage: {activeError.stage}
                                </p>
                            )}
                            {activeError.key && (
                                <p className="text-xs text-red-400/70 mt-1">
                                    Asset: {activeError.key}
                                </p>
                            )}
                            {activeError.requestId && (
                                <p className="text-xs text-red-400/70 mt-1">
                                    Request: {activeError.requestId}
                                </p>
                            )}
                            {activeError.line && activeError.kind === 'runtime' && (
                                <p className="text-xs text-red-400/70 mt-2">
                                    Line: {activeError.line}
                                </p>
                            )}
                            {/* Script-specific help message */}
                            {activeError.kind === 'script' && (
                                <p className="text-xs text-amber-400/80 mt-3">
                                    This may be a network issue or CDN outage. Try refreshing the page.
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
                                onClick={() => setErrorState(null)}
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
