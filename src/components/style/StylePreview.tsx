'use client';

/**
 * Style Preview Component
 *
 * Displays the current style draft collected via chat.
 * Shows:
 * - Style keywords, lighting keywords, color palette (collapsible)
 * - Generated reference image (once created)
 * - Loading states during generation
 *
 * Similar to PlanPreview for the planning phase.
 */

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Style draft state interface
export interface StyleDraft {
    styleKeywords: string;
    lightingKeywords: string;
    colorPalette: string[];
    fluxModel?: string;
}

// Generated style anchor data
export interface GeneratedStyleAnchor {
    id: string;
    imageUrl: string;
    prompt: string;
}

interface StylePreviewProps {
    // Current style draft from chat
    styleDraft: StyleDraft;
    // Generated style anchor (null until generated)
    generatedAnchor: GeneratedStyleAnchor | null;
    // Loading state during generation
    isGenerating: boolean;
    // Callback when user wants to proceed to generation phase
    onFinalize?: () => void;
    // Callback to trigger style anchor generation directly (no AI prompt needed)
    onGenerateStyleAnchor?: () => void;
}

export function StylePreview({
    styleDraft,
    generatedAnchor,
    isGenerating,
    onFinalize,
    onGenerateStyleAnchor,
}: StylePreviewProps) {
    // Track if any style data has been collected
    const hasStyleData = Boolean(
        styleDraft.styleKeywords ||
        styleDraft.lightingKeywords ||
        styleDraft.colorPalette.length > 0
    );

    // Auto-collapse style details when image is generated (initial state based on prop)
    const [isStyleDetailsExpanded, setIsStyleDetailsExpanded] = useState(!generatedAnchor);

    // Color palette display limit
    const displayedColors = styleDraft.colorPalette.slice(0, 8);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-4 glass-panel border-b">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${generatedAnchor ? 'bg-green-500' : 'bg-purple-500 animate-pulse'}`} />
                    <span className="text-sm font-medium text-white/80">
                        Style Preview
                    </span>
                </div>
                {/* Show generate button when style data exists but no anchor yet */}
                {hasStyleData && !generatedAnchor && !isGenerating && onGenerateStyleAnchor && (
                    <button
                        onClick={onGenerateStyleAnchor}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-purple-500/25"
                    >
                        ✨ Generate Style Anchor
                    </button>
                )}
                {/* Show proceed button after anchor is generated */}
                {generatedAnchor && onFinalize && (
                    <button
                        onClick={onFinalize}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Proceed to Generation →
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {!hasStyleData && !generatedAnchor && !isGenerating ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                        <svg
                            className="w-16 h-16 mb-4 opacity-30"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                            />
                        </svg>
                        <p className="text-sm font-medium">No style defined yet</p>
                        <p className="text-xs mt-2 max-w-xs">
                            Chat with the AI to define your game&apos;s visual style
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Generated Image - FIRST when available */}
                        {generatedAnchor && (
                            <div className="flex flex-col gap-3">
                                <h3 className="text-sm font-medium text-white/80">
                                    ✨ Generated Style Reference
                                </h3>
                                <div className="relative w-full aspect-square max-w-md mx-auto bg-black/20 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                    <Image
                                        src={generatedAnchor.imageUrl}
                                        alt="Style reference"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                                <p className="text-xs text-white/40 text-center">
                                    This image will guide all asset generation
                                </p>
                            </div>
                        )}

                        {/* Generation Loading State */}
                        {isGenerating && (
                            <div className="flex flex-col items-center gap-4 p-8 bg-purple-600/10 rounded-lg border border-purple-500/20">
                                <div className="animate-spin h-8 w-8 border-2 border-white/20 border-t-purple-500 rounded-full" />
                                <p className="text-sm text-white/80">
                                    Generating style reference image...
                                </p>
                                <p className="text-xs text-white/40">
                                    This may take 10-30 seconds
                                </p>
                            </div>
                        )}

                        {/* Collapsible Style Details Section */}
                        {hasStyleData && (
                            <div className="border border-white/10 rounded-lg overflow-hidden">
                                {/* Toggle header */}
                                <button
                                    onClick={() => setIsStyleDetailsExpanded(!isStyleDetailsExpanded)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <span className="text-sm font-medium text-white/80">
                                        Style Details
                                    </span>
                                    {isStyleDetailsExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-white/60" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-white/60" />
                                    )}
                                </button>

                                {/* Collapsible content */}
                                {isStyleDetailsExpanded && (
                                    <div className="p-4 space-y-4 bg-white/[0.02]">
                                        {/* Style Keywords */}
                                        {styleDraft.styleKeywords && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-medium text-white/60">
                                                    Style Keywords
                                                </span>
                                                <p className="text-sm text-white/90">
                                                    {styleDraft.styleKeywords}
                                                </p>
                                            </div>
                                        )}

                                        {/* Lighting Keywords */}
                                        {styleDraft.lightingKeywords && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-medium text-white/60">
                                                    Lighting
                                                </span>
                                                <p className="text-sm text-white/90">
                                                    {styleDraft.lightingKeywords}
                                                </p>
                                            </div>
                                        )}

                                        {/* Color Palette */}
                                        {displayedColors.length > 0 && (
                                            <div className="flex flex-col gap-2">
                                                <span className="text-xs font-medium text-white/60">
                                                    Color Palette
                                                </span>
                                                <div className="flex flex-wrap gap-2">
                                                    {displayedColors.map((color, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-full border border-white/10"
                                                        >
                                                            <div
                                                                className="w-3 h-3 rounded-full border border-white/20"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                            <span className="text-xs text-white/70 font-mono">
                                                                {color}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-medium text-white/60">
                                                Model
                                            </span>
                                            <span className="text-sm text-white/90">
                                                {styleDraft.fluxModel === 'black-forest-labs/flux.2-pro'
                                                    ? 'Flux.2 Pro (Best Quality)'
                                                    : styleDraft.fluxModel}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Default empty draft for initialization
export const emptyStyleDraft: StyleDraft = {
    styleKeywords: '',
    lightingKeywords: '',
    colorPalette: [],
    fluxModel: 'black-forest-labs/flux.2-pro',
};
