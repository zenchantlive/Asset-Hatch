"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Edit, ArrowRight } from "lucide-react"

interface PlanPreviewProps {
  markdown: string
  onEdit: () => void
  onApprove: () => void
  isLoading?: boolean
}

// Simple markdown-to-HTML converter for plan preview
// Supports: H1, H2, lists, checkmarks, tree structure
function parseMarkdown(markdown: string): React.ReactNode {
  if (!markdown) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
        <p className="text-sm">No plan yet</p>
        <p className="text-xs mt-2">Chat with the assistant to create your asset plan</p>
      </div>
    )
  }

  const lines = markdown.split("\n")
  const elements: React.ReactNode[] = []

  lines.forEach((line, index) => {
    // H1 headers
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={index} className="text-2xl font-bold mb-4 mt-6 first:mt-0">
          {line.slice(2)}
        </h1>
      )
    }
    // H2 headers
    else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={index} className="text-lg font-semibold mb-3 mt-6">
          {line.slice(3)}
        </h2>
      )
    }
    // List items with checkmarks
    else if (line.match(/^-\s+.*✓/)) {
      elements.push(
        <div key={index} className="flex items-center gap-2 mb-1 text-sm">
          <span className="text-green-500">✓</span>
          <span>{line.slice(2).replace("✓", "").trim()}</span>
        </div>
      )
    }
    // Tree structure lines (├─, └─, │)
    else if (line.match(/^[├└│─\s]+/)) {
      elements.push(
        <pre key={index} className="font-mono text-sm mb-1 whitespace-pre opacity-80">
          {line}
        </pre>
      )
    }
    // Regular list items
    else if (line.startsWith("- ")) {
      elements.push(
        <div key={index} className="text-sm mb-1 ml-4">
          • {line.slice(2)}
        </div>
      )
    }
    // Bracketed metadata (e.g., [4 animations], [~40 tiles])
    else if (line.match(/^\s*\[.*\]/)) {
      elements.push(
        <div key={index} className="text-xs opacity-60 mb-1 ml-6">
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
        <p key={index} className="text-sm mb-2">
          {line}
        </p>
      )
    }
  })

  return <div className="space-y-1">{elements}</div>
}

export function PlanPreview({ markdown, onEdit, onApprove, isLoading }: PlanPreviewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-[var(--aurora-1)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm opacity-70">Generating plan...</p>
            </div>
          </div>
        ) : (
          <div className="plan-content">
            {parseMarkdown(markdown)}
          </div>
        )}
      </div>

      {/* Action buttons - sticky at bottom */}
      <div className="sticky bottom-0 glass-panel border-t px-8 py-4 flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={onEdit}
          disabled={!markdown || isLoading}
          className="flex-1 max-w-xs glass-panel"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Plan
        </Button>
        <Button
          onClick={onApprove}
          disabled={!markdown || isLoading}
          className="flex-1 max-w-xs aurora-gradient text-white hover:opacity-90"
        >
          Approve Plan
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Sample plan data for testing
export const SAMPLE_PLAN = `# Cozy Farm - Asset Plan

## Settings
- Style: Pixel Art ✓
- Resolution: 32x32 ✓
- Palette: Warm pastels ✓
- Perspective: Top-down ✓

## Characters
├─ Player Farmer .....................
│   [4 animations]
│   idle, walk-4dir, use-tool, carry
├─ Chicken ...........................
│   [3 animations]
│   idle, walk, peck
└─ Cow ...............................
    [3 animations]
    idle, walk, eat

## Environment
└─ Farm Tileset ......................
    [~40 tiles]
    soil variants, grass, paths

## UI
└─ HUD Elements ......................
    [6 components]
    inventory, clock, money, energy
`
