// -----------------------------------------------------------------------------
// Asset Browser Component
// Grid display of user's assets with detail panel
// -----------------------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import { Image, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Asset data shape from API
 */
interface StudioAsset {
    id: string;
    projectId: string;
    name: string;
    type: '2d' | '3d';
    thumbnailUrl: string | null;
    modelUrl: string | null;
    riggedModelUrl: string | null;
    prompt: string;
    updatedAt: string;
}

/**
 * Props for AssetBrowser
 */
interface AssetBrowserProps {
    /** Optional filter by asset type */
    type?: '2d' | '3d' | 'all';
}

/**
 * AssetBrowser - displays user's approved assets in a grid
 */
export function AssetBrowser({ type = 'all' }: AssetBrowserProps) {
    const [assets, setAssets] = useState<StudioAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<StudioAsset | null>(null);

    // Fetch assets from API
    useEffect(() => {
        const fetchAssets = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({ type, limit: '50' });
                const response = await fetch(`/api/studio/assets?${params}`);
                const data = await response.json();

                if (data.success) {
                    setAssets(data.assets);
                } else {
                    setError(data.error || 'Failed to load assets');
                }
            } catch (err) {
                setError('Network error loading assets');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAssets();
    }, [type]);

    // Loading state
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading assets...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-sm text-red-400">{error}</p>
            </div>
        );
    }

    // Empty state
    if (assets.length === 0) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Image className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-sm font-medium mb-2">No Assets Yet</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        Create assets in Asset Hatch to use them in your games.
                    </p>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open('/projects', '_blank')}
                    >
                        Go to Asset Hatch
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex">
            {/* Asset grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {assets.map((asset) => (
                        <button
                            key={asset.id}
                            onClick={() => setSelectedAsset(asset)}
                            className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedAsset?.id === asset.id
                                    ? 'border-primary shadow-lg shadow-primary/20'
                                    : 'border-border hover:border-primary/50'
                                }`}
                        >
                            {/* Thumbnail */}
                            {asset.thumbnailUrl ? (
                                <img
                                    src={asset.thumbnailUrl}
                                    alt={asset.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    {asset.type === '3d' ? (
                                        <Box className="h-8 w-8 text-muted-foreground" />
                                    ) : (
                                        <Image className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>
                            )}

                            {/* Overlay with name */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                <p className="text-xs font-medium text-white truncate w-full">
                                    {asset.name}
                                </p>
                            </div>

                            {/* Type badge */}
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-xs font-medium">
                                {asset.type.toUpperCase()}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Detail panel */}
            {selectedAsset && (
                <div className="w-80 border-l border-studio-panel-border p-4 overflow-y-auto">
                    <div className="space-y-4">
                        {/* Preview */}
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                            {selectedAsset.thumbnailUrl ? (
                                <img
                                    src={selectedAsset.thumbnailUrl}
                                    alt={selectedAsset.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    {selectedAsset.type === '3d' ? (
                                        <Box className="h-16 w-16 text-muted-foreground" />
                                    ) : (
                                        <Image className="h-16 w-16 text-muted-foreground" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div>
                            <h3 className="font-medium mb-1">{selectedAsset.name}</h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                {selectedAsset.type === '3d' ? '3D Model' : '2D Image'}
                            </p>

                            {selectedAsset.prompt && (
                                <div className="mb-3">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Prompt:</p>
                                    <p className="text-xs">{selectedAsset.prompt}</p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <Button
                            size="sm"
                            className="w-full"
                            disabled
                        >
                            Use in Game (Phase 3)
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
