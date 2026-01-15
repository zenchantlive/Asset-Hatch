"use client";

/**
 * AddAssetForm Component
 *
 * Form for manually adding 3D assets to the generation queue.
 * Provides fields for name, description, rig/static toggle, and category.
 *
 * Features:
 * - Name input
 * - Description textarea
 * - Rig/Static toggle
 * - Category selector (Characters, Props, Environment, Custom)
 * - Submit creates new Parsed3DAsset structure
 *
 * @see GenerationQueue3D.tsx for parent integration
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import type { Parsed3DAsset } from "@/lib/3d-plan-parser";

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the AddAssetForm component.
 */
interface AddAssetFormProps {
    // Project ID for generating asset IDs
    projectId: string;
    // Callback when form is submitted
    onSubmit: (asset: Parsed3DAsset) => void;
    // Callback when form is cancelled
    onCancel: () => void;
}

// =============================================================================
// Constants
// =============================================================================

/** Available asset categories */
const ASSET_CATEGORIES = ["Characters", "Props", "Environment", "Custom"] as const;

type AssetCategory = (typeof ASSET_CATEGORIES)[number];

// =============================================================================
// Main Component
// =============================================================================

/**
 * AddAssetForm Component
 *
 * Form for manually adding 3D assets to the generation queue.
 *
 * @param projectId - Project ID for generating unique asset IDs
 * @param onSubmit - Callback when asset is added
 * @param onCancel - Callback when form is cancelled
 */
export function AddAssetForm({ projectId, onSubmit, onCancel }: AddAssetFormProps) {
    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [shouldRig, setShouldRig] = useState(true);
    const [category, setCategory] = useState<AssetCategory>("Props");

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!name.trim()) {
            alert("Please enter an asset name");
            return;
        }

        // Generate a robust unique ID for the asset
        const uniqueId = crypto.randomUUID();

        // Create new asset structure matching Parsed3DAsset
        const newAsset: Parsed3DAsset = {
            id: uniqueId,
            projectId, // Required field from props
            name: name.trim(),
            description: description.trim() || `A ${category.toLowerCase()} asset`,
            shouldRig,
            category,
            animationsRequested: [], // Empty initially, user can add via UI later
        };

        // Call parent callback with new asset
        onSubmit(newAsset);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {/* Form Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add Asset to Queue</h3>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onCancel}
                    className="text-white/50 hover:text-white"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Asset Name */}
            <div className="space-y-2">
                <Label htmlFor="asset-name" className="text-sm text-white/70">
                    Asset Name *
                </Label>
                <Input
                    id="asset-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Space Marine, Medieval Sword"
                    className="bg-black/20 border-white/10 text-white"
                    required
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="asset-description" className="text-sm text-white/70">
                    Description
                </Label>
                <textarea
                    id="asset-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the asset for AI generation..."
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white/80 resize-none focus:border-cyan-500/50 focus:outline-none"
                    rows={3}
                />
                <p className="text-xs text-white/40">
                    Optional. If empty, a default description will be generated.
                </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
                <Label htmlFor="asset-category" className="text-sm text-white/70">
                    Category
                </Label>
                <Select value={category} onValueChange={(val) => setCategory(val as AssetCategory)}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-glass-panel border-glass-border">
                        {ASSET_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                                {cat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Rig Toggle */}
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="should-rig"
                    checked={shouldRig}
                    onChange={(e) => setShouldRig(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/20 text-cyan-600 focus:ring-cyan-500"
                />
                <Label htmlFor="should-rig" className="text-sm text-white/70 cursor-pointer">
                    Rig this asset for animation
                </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
                <Button
                    type="submit"
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="border-white/20"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
