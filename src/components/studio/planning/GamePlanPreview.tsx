// -----------------------------------------------------------------------------
// Game Plan Preview
// Shows the game plan markdown with features and file list
// -----------------------------------------------------------------------------

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileCode, Sparkles, CheckCircle2, FileText } from 'lucide-react';

interface GamePlanPreviewProps {
    content: string;
    status: string;
    onApprove: () => void;
    isApproving: boolean;
}

/**
 * Render inline markdown (bold, code)
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > currentIndex) {
            parts.push(text.slice(currentIndex, match.index));
        }

        const matchedText = match[0];
        if (matchedText.startsWith('**')) {
            parts.push(
                <strong key={match.index} className="font-bold text-white/90">
                    {matchedText.slice(2, -2)}
                </strong>
            );
        } else if (matchedText.startsWith('`')) {
            parts.push(
                <code key={match.index} className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs text-primary">
                    {matchedText.slice(1, -1)}
                </code>
            );
        }

        currentIndex = regex.lastIndex;
    }

    if (currentIndex < text.length) {
        parts.push(text.slice(currentIndex));
    }

    return parts;
}

/**
 * Parse game plan markdown into React elements
 */
function parseGamePlanMarkdown(markdown: string): React.ReactNode {
    if (!markdown) return null;

    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
        // H1 headers - Game title
        if (line.startsWith('# ')) {
            elements.push(
                <h1 key={index} className="text-2xl font-bold mb-6 mt-8 first:mt-0 bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent font-heading tracking-tight">
                    {renderInlineMarkdown(line.slice(2))}
                </h1>
            );
        }
        // H2 headers - Sections (Features, Files)
        else if (line.startsWith('## ')) {
            const headerText = line.slice(3);
            const isFilesSection = headerText.toLowerCase().includes('file');
            elements.push(
                <div key={index} className="flex items-center gap-2 mb-4 mt-8 pb-2 border-b border-primary/20">
                    {isFilesSection ? (
                        <FileCode className="w-4 h-4 text-primary" />
                    ) : (
                        <Sparkles className="w-4 h-4 text-primary" />
                    )}
                    <h2 className="text-lg font-semibold text-white font-heading tracking-tight">
                        {renderInlineMarkdown(headerText)}
                    </h2>
                </div>
            );
        }
        // H3 headers - Sub-sections
        else if (line.startsWith('### ')) {
            elements.push(
                <h3 key={index} className="text-base font-semibold text-white/95 mb-3 mt-6 font-heading tracking-tight">
                    {renderInlineMarkdown(line.slice(4))}
                </h3>
            );
        }
        // Checkbox items - [ ] or [x]
        else if (line.match(/^\s*-\s+\[( |x)\]/i)) {
            const isChecked = line.includes('[x]') || line.includes('[X]');
            const content = line.replace(/^\s*-\s+\[[ xX]\]\s*/, '');
            elements.push(
                <div key={index} className="flex items-start gap-3 mb-2 text-sm group">
                    {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                        <div className="w-4 h-4 rounded border border-white/30 mt-0.5 shrink-0" />
                    )}
                    <span className={`${isChecked ? 'text-white/70' : 'text-white/90'} group-hover:text-white transition-colors`}>
                        {renderInlineMarkdown(content)}
                    </span>
                </div>
            );
        }
        // File list items - .js files
        else if (line.match(/^-\s+`.*\.js`/)) {
            const match = line.match(/`([^`]+)`(.*)$/);
            if (match) {
                const fileName = match[1];
                const description = match[2]?.replace(/^\s*[-]\s*/, '').trim() || '';
                elements.push(
                    <div key={index} className="flex items-start gap-3 mb-3 ml-1 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <FileCode className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
                        <div className="flex flex-col">
                            <code className="text-sm font-mono text-sky-300 font-medium">{fileName}</code>
                            {description && (
                                <span className="text-xs text-white/60 mt-1">{renderInlineMarkdown(description)}</span>
                            )}
                        </div>
                    </div>
                );
            }
        }
        // Regular list items
        else if (line.startsWith('- ')) {
            elements.push(
                <div key={index} className="flex items-start gap-3 mb-2 ml-1">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0 ring-2 ring-purple-400/20" />
                    <span className="text-base font-medium text-white">
                        {renderInlineMarkdown(line.slice(2))}
                    </span>
                </div>
            );
        }
        // Numbered list items
        else if (line.match(/^\d+\.\s+/)) {
            const content = line.replace(/^\d+\.\s+/, '');
            const number = line.match(/^(\d+)/)?.[1] || '1';
            elements.push(
                <div key={index} className="flex items-start gap-3 mb-2 ml-1">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {number}
                    </span>
                    <span className="text-sm text-white/90">
                        {renderInlineMarkdown(content)}
                    </span>
                </div>
            );
        }
        // Regular text
        else if (line.trim()) {
            elements.push(
                <p key={index} className="text-sm mb-3 leading-relaxed text-muted-foreground">
                    {renderInlineMarkdown(line)}
                </p>
            );
        }
    });

    return <div className="space-y-1">{elements}</div>;
}

export function GamePlanPreview({ content, status, onApprove, isApproving }: GamePlanPreviewProps) {
    const isEmpty = !content && !isApproving;
    const isAccepted = status === 'accepted';

    return (
        <div className="flex flex-col h-full bg-glass-bg/30 backdrop-blur-sm">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                {isApproving ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
                                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                            <p className="text-sm font-medium text-primary animate-pulse">Approving plan...</p>
                        </div>
                    </div>
                ) : isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-full text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-50" />

                        <div className="relative z-10 p-8 glass-panel border-white/5 max-w-md animate-float">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-[0_0_1.875rem_-0.3125rem_var(--color-primary)]">
                                <FileText className="w-8 h-8 text-primary" />
                            </div>

                            <h3 className="text-xl font-bold mb-2 text-white">No Plan Yet</h3>
                            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                                Chat with the AI to describe your game. We will create a plan with features and files to build.
                            </p>

                            <div className="flex gap-2 justify-center">
                                <div className="h-1.5 w-16 rounded-full bg-muted/50" />
                                <div className="h-1.5 w-8 rounded-full bg-muted/30" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="plan-content max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {parseGamePlanMarkdown(content)}
                    </div>
                )}
            </div>

            {/* Action button - sticky at bottom */}
            {!isEmpty && !isAccepted && (
                <div className="sticky bottom-0 glass-panel border-t border-white/5 px-8 py-6 flex items-center justify-center z-20">
                    <Button
                        onClick={onApprove}
                        disabled={!content || isApproving}
                        className="flex-1 max-w-md bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_1.25rem_-0.3125rem_var(--color-primary)] hover:shadow-[0_0_1.875rem_-0.3125rem_var(--color-primary)] transition-all duration-300"
                    >
                        Accept Plan and Start Building
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            )}

            {isAccepted && (
                <div className="sticky bottom-0 glass-panel border-t border-white/5 px-8 py-4 flex items-center justify-center z-20">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Plan Accepted - Redirecting to build phase...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
