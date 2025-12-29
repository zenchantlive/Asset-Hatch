'use client';

/**
 * Export Panel Component
 * 
 * Displays export options and triggers ZIP download of approved assets
 * Per ADR-014: Single-Asset Strategy
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Package, FileArchive, CheckCircle2 } from 'lucide-react';

interface ExportPanelProps {
    projectId: string;
    projectName: string;
    approvedAssetCount: number;
}

export function ExportPanel({ projectId, projectName, approvedAssetCount }: ExportPanelProps) {
    // Track export state
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Trigger export by calling /api/export endpoint
     * Downloads ZIP file to user's browser
     */
    const handleExport = async () => {
        // Validate we have assets to export
        if (approvedAssetCount === 0) {
            setError('No approved assets to export. Approve some assets first.');
            return;
        }

        setIsExporting(true);
        setError(null);

        try {
            // Call export API
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Export failed');
            }

            // Get ZIP blob from response
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${projectName.replace(/\s+/g, '_')}_assets.zip`;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Export error:', err);
            setError(err instanceof Error ? err.message : 'Failed to export assets');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-6 border border-border/40 rounded-lg bg-card/50 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold">Export Asset Pack</h3>
                    <p className="text-sm text-muted-foreground">
                        Download all approved assets as an organized ZIP
                    </p>
                </div>
            </div>

            {/* Asset Count */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">
                    <span className="font-semibold">{approvedAssetCount}</span> approved asset{approvedAssetCount !== 1 ? 's' : ''} ready
                </span>
            </div>

            {/* Export Details */}
            <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                    <FileArchive className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                        Includes <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">manifest.json</code> with semantic IDs for AI consumption
                    </span>
                </div>
                <div className="flex items-start gap-2">
                    <FileArchive className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                        Assets organized by category: <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">characters/</code>, <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">furniture/</code>, etc.
                    </span>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">
                        {error}
                    </p>
                </div>
            )}

            {/* Export Button */}
            <Button
                onClick={handleExport}
                disabled={isExporting || approvedAssetCount === 0}
                className="w-full"
                size="lg"
            >
                {isExporting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Generating ZIP...
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Asset Pack
                    </>
                )}
            </Button>

            {approvedAssetCount === 0 && (
                <p className="text-xs text-center text-muted-foreground">
                    Approve some assets in the Generation tab first
                </p>
            )}
        </div>
    );
}
