// -----------------------------------------------------------------------------
// Assets Tab Component
// Wrapper for AssetBrowser with type filtering
// -----------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { AssetBrowser } from '../AssetBrowser';
import { Button } from '@/components/ui/button';

/**
 * AssetsTab - asset browser with type filter tabs
 */
export function AssetsTab() {
    const [assetType, setAssetType] = useState<'all' | '2d' | '3d'>('all');

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

                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('/projects', '_blank')}
                >
                    Create New Asset
                </Button>
            </div>

            {/* Asset browser */}
            <div className="flex-1 overflow-hidden">
                <AssetBrowser type={assetType} />
            </div>
        </div>
    );
}
