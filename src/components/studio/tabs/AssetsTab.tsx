// -----------------------------------------------------------------------------
// Assets Tab Component
// Wrapper for AssetBrowser with type filtering and sync capability
// Includes link to full Asset Hatch planning flow
// Phase 10: Added AssetCounter and AssetLimitModal for permanent storage tracking
// -----------------------------------------------------------------------------

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AssetBrowser } from '../AssetBrowser';
import { AssetCounter } from '../AssetCounter';
import { AssetLimitWarning } from '../AssetLimitModal';
import { AssetLimitModal } from '../AssetLimitModal';
import { Button } from '@/components/ui/button';
import { useStudio } from '@/lib/studio/context';
import { RefreshCw, Check } from 'lucide-react';
import { ASSET_THRESHOLDS } from '../AssetCounter';

/**
 * AssetsTab - asset browser with type filter tabs
 * Also provides access to full Asset Hatch planning workflow
 */
export function AssetsTab() {
    const [assetType, setAssetType] = useState<'all' | '2d' | '3d'>('all');
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
    const [stored3DCount, setStored3DCount] = useState(0);
    const { game } = useStudio();

    // Get projectId from game (1:1 relation)
    const projectId = game?.projectId;
    const limit = ASSET_THRESHOLDS.SAFE;

    // Fetch count of 3D assets with permanent storage
    const fetchStoredCount = useCallback(async () => {
        if (!game?.id) return;

        try {
            const response = await fetch(`/api/studio/games/${game.id}/assets`);
            if (response.ok) {
                const manifest = await response.json();
                const assets = manifest.assets || {};
                // Count 3D assets that have glbData stored
                const assetArray = Object.values(assets) as Array<{
                    type: string;
                    urls?: { glbData?: string };
                }>;
                const count = assetArray.filter(
                    (a) =>
                        (a.type === '3d' || a.type === 'model') && a.urls?.glbData
                ).length;
                setStored3DCount(count);
            }
        } catch (error) {
            console.warn('Failed to fetch asset storage count:', error);
        }
    }, [game?.id]);

    useEffect(() => {
        fetchStoredCount();
    }, [fetchStoredCount]);

    // Handle sync button click
    const handleSync = async () => {
        if (!projectId) return;

        setSyncing(true);
        setSyncResult(null);

        try {
            const response = await fetch(`/api/projects/${projectId}/assets/sync`, {
                method: 'POST',
            });
            const data = await response.json();

            setSyncResult({
                success: data.success,
                message: data.message || (data.success ? 'Sync complete' : 'Sync failed'),
            });

            // Clear result after 3 seconds
            setTimeout(() => setSyncResult(null), 3000);
            } catch (error) {
                setSyncResult({ success: false, message: 'Network error' });
            } finally {
            setSyncing(false);
        }
    };

    // Determine if we should show warning or modal
    const shouldShowWarning = stored3DCount >= limit - 2;
    const shouldShowModal = stored3DCount >= limit;

    return (
        <div className="h-full flex flex-col">
            {/* Filter tabs */}
            <div className="h-12 border-b border-studio-panel-border px-4 flex items-center justify-between bg-studio-panel-bg">
                <div className="flex items-center gap-1">
                    {(['all', '2d', '3d'] as const).map((type) => (
                        <Button
                            key={type}
                            size="sm"
                            variant={assetType === type ? 'default' : 'ghost'}
                            onClick={() => setAssetType(type)}
                            className="text-xs"
                        >
                            {type === 'all' ? 'All Assets' : type === '2d' ? '2D Images' : '3D Models'}
                        </Button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {/* Phase 10: Asset limit warning */}
                    {shouldShowWarning && !shouldShowModal && (
                        <AssetLimitWarning count={stored3DCount} limit={limit} />
                    )}

                    {/* Sync button for Phase 9 */}
                    {projectId && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSync}
                            disabled={syncing}
                            className="text-xs"
                        >
                            {syncing ? (
                                <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Syncing...
                                </>
                            ) : syncResult ? (
                                <>
                                    <Check className="h-3 w-3 mr-1" />
                                    {syncResult.success ? 'Synced!' : 'Failed'}
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Sync Assets
                                </>
                            )}
                        </Button>
                    )}

                    {projectId ? (
                        <a
                            href={`/project/${projectId}/planning`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                        >
                            🎨 Open Asset Hatch
                        </a>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open('/projects', '_blank')}
                            className="text-xs"
                        >
                            Create New Asset
                        </Button>
                    )}
                </div>
            </div>

            {/* Phase 10: Asset counter and limit modal */}
            <AssetLimitModal
                count={stored3DCount}
                limit={limit}
                open={shouldShowModal ? undefined : false}
            >
                {/* Placeholder trigger - modal opens based on count */}
                <div />
            </AssetLimitModal>

            {/* Asset browser */}
            <div className="flex-1 overflow-hidden">
                <AssetBrowser type={assetType} />
            </div>

            {/* Phase 10: Asset counter footer */}
            <div className="border-t border-studio-panel-border p-2 bg-studio-panel-bg">
                <AssetCounter
                    count={stored3DCount}
                    limit={limit}
                    showDetails={false}
                    className="max-w-xs mx-auto"
                />
            </div>
        </div>
    );
}
