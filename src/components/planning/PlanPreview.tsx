"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Edit, ArrowRight, Sparkles, FileText, CheckCircle2 } from "lucide-react"

interface PlanPreviewProps {
  markdown: string
  onEdit: () => void
  onApprove: () => void
  isLoading?: boolean
}

// Helper to render inline markdown (bold, code)
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let currentIndex = 0

  // Match bold (**text**) and code (`text`)
  const regex = /(\*\*.*?\*\*|`.*?`)/g
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > currentIndex) {
      parts.push(text.slice(currentIndex, match.index))
    }

    const matchedText = match[0]
    if (matchedText.startsWith('**')) {
      parts.push(<strong key={match.index} className="font-bold text-white/90">{matchedText.slice(2, -2)}</strong>)
    } else if (matchedText.startsWith('`')) {
      parts.push(<code key={match.index} className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs text-primary">{matchedText.slice(1, -1)}</code>)
    }

    currentIndex = regex.lastIndex
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.slice(currentIndex))
  }

  return parts
}

// Simple markdown-to-HTML converter for plan preview
// Supports: H1, H2, lists, checkmarks, tree structure
function parseMarkdown(markdown: string): React.ReactNode {
  if (!markdown) return null

  const lines = markdown.split("\n")
  const elements: React.ReactNode[] = []

  lines.forEach((line, index) => {
    // H1 headers
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={index} className="text-2xl font-bold mb-6 mt-8 first:mt-0 bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent font-heading tracking-tight">
          {renderInlineMarkdown(line.slice(2))}
        </h1>
      )
    }
    // H2 headers
    else if (line.startsWith("## ")) {
      elements.push(
        <div key={index} className="flex items-center gap-2 mb-4 mt-8 pb-2 border-b border-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold text-white font-heading tracking-tight">
            {renderInlineMarkdown(line.slice(3))}
          </h2>
        </div>
      )
    }
    // H3 headers
    else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={index} className="text-base font-semibold text-white/95 mb-3 mt-6 font-heading tracking-tight">
          {renderInlineMarkdown(line.slice(4))}
        </h3>
      )
    }
    // List items with checkmarks
    else if (line.match(/^-\s+.*✓/)) {
      elements.push(
        <div key={index} className="flex items-start gap-3 mb-2 text-sm group">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <span className="text-white/90 group-hover:text-white transition-colors">
            {renderInlineMarkdown(line.slice(2).replace("✓", "").trim())}
          </span>
        </div>
      )
    }
    // Tree structure lines (├─, └─, │) - sub-items under categories
    else if (line.match(/^[├└│─\s]+/)) {
      const match = line.match(/^([├└│─\s]+)(.*)/)
      const prefix = match ? match[1] : ""
      const content = match ? match[2] : line

      elements.push(
        <div key={index} className="font-mono text-sm mb-1.5 pl-6 py-0.5 flex">
          <span className="text-indigo-400/50 whitespace-pre select-none">{prefix}</span>
          <span className="text-sky-300/90 font-medium tracking-wide ml-1">
            {renderInlineMarkdown(content)}
          </span>
        </div>
      )
    }
    // Regular list items (category headers like "Player Character (Base):")
    else if (line.startsWith("- ")) {
      elements.push(
        <div key={index} className="flex items-start gap-3 mb-2 ml-1">
          <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0 ring-2 ring-purple-400/20" />
          <span className="text-base font-medium text-white">
            {renderInlineMarkdown(line.slice(2))}
          </span>
        </div>
      )
    }
    // Bracketed metadata (e.g., [4 animations], [~40 tiles])
    else if (line.match(/^\s*\[.*\]/)) {
      elements.push(
        <div key={index} className="text-xs text-primary/60 mb-2 ml-6 font-mono bg-primary/5 inline-block px-2 py-0.5 rounded">
          {line.trim()}
        </div>
      )
    }
    // Empty lines
    else if (line.trim() === "") {
      // Skip or add spacing
    }
    // Regular text
    else if (line.trim()) {
      elements.push(
        <p key={index} className="text-sm mb-3 leading-relaxed text-muted-foreground">
          {renderInlineMarkdown(line)}
        </p>
      )
    }
  })

  return <div className="space-y-1">{elements}</div>
}

export function PlanPreview({ markdown, onEdit, onApprove, isLoading }: PlanPreviewProps) {
  const isEmpty = !markdown && !isLoading

  return (
    <div className="flex flex-col h-full bg-glass-bg/30 backdrop-blur-sm">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm font-medium text-primary animate-pulse">Forging your plan...</p>
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
                Chat with the AI Assistant to discuss your game idea. We&apos;ll generate a comprehensive asset plan for you automatically.
              </p>

              <div className="flex gap-2 justify-center">
                <div className="h-1.5 w-16 rounded-full bg-muted/50" />
                <div className="h-1.5 w-8 rounded-full bg-muted/30" />
              </div>
            </div>
          </div>
        ) : (
          <div className="plan-content max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {parseMarkdown(markdown)}
          </div>
        )}
      </div>

      {/* Action buttons - sticky at bottom */}
      {!isEmpty && (
        <div className="sticky bottom-0 glass-panel border-t border-white/5 px-8 py-6 flex items-center justify-between gap-4 z-20">
          <Button
            variant="outline"
            onClick={onEdit}
            disabled={!markdown || isLoading}
            className="flex-1 max-w-xs glass-interactive border-white/10 hover:bg-white/5"
          >
            <Edit className="w-4 h-4 mr-2 opacity-70" />
            Edit Plan
          </Button>
          <Button
            onClick={onApprove}
            disabled={!markdown || isLoading}
            className="flex-1 max-w-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_1.25rem_-0.3125rem_var(--color-primary)] hover:shadow-[0_0_1.875rem_-0.3125rem_var(--color-primary)] transition-all duration-300"
          >
            Approve Plan
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}

