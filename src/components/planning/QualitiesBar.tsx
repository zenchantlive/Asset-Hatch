"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, SlidersHorizontal, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ProjectQualities {
  art_style?: string
  base_resolution?: string
  perspective?: string
  game_genre?: string
  theme?: string
  mood?: string
  color_palette?: string
  [key: string]: string | undefined
}

interface QualitiesBarProps {
  qualities: ProjectQualities
  onQualitiesChange: (qualities: ProjectQualities) => void
  onSave?: () => void
  mode?: 'bar' | 'popover'
  defaultExpanded?: boolean
}

const QUALITY_OPTIONS = {
  art_style: [
    "Pixel Art (8-bit)",
    "Pixel Art (16-bit)",
    "Low-poly 3D",
    "Stylized 3D",
    "Realistic 3D",
    "Hand-painted 2D",
    "Vector/Flat",
    "Voxel",
  ],
  base_resolution: [
    "16x16",
    "32x32",
    "64x64",
    "128x128",
    "256x256",
    "512x512",
    "Custom",
  ],
  perspective: [
    "Top-down",
    "Side-view",
    "Isometric",
    "First-person",
    "Third-person",
    "2.5D",
  ],
  game_genre: [
    "Platformer",
    "RPG",
    "Puzzle",
    "Farming Sim",
    "Shooter",
    "Strategy",
    "Adventure",
    "Roguelike",
    "Metroidvania",
    "Tower Defense",
    "Visual Novel",
  ],
  theme: [
    "Fantasy",
    "Sci-Fi",
    "Modern",
    "Horror",
    "Cozy",
    "Steampunk",
    "Cyberpunk",
    "Post-Apocalyptic",
    "Historical",
  ],
  mood: [
    "Cheerful",
    "Dark",
    "Serious",
    "Whimsical",
    "Melancholic",
    "Energetic",
    "Calm",
    "Mysterious",
  ],
  color_palette: [
    "Warm Pastels",
    "Cool Neons",
    "Retro",
    "Monochrome",
    "Vibrant",
    "Earth Tones",
    "Desaturated",
    "High Contrast",
  ],
}

type QualityKey = keyof typeof QUALITY_OPTIONS

export function QualitiesBar({ qualities, onQualitiesChange, onSave, mode = 'popover', defaultExpanded = true }: QualitiesBarProps) {
  // Track if changes have been made to show save button highlight
  const [hasChanges, setHasChanges] = React.useState(false)

  const handleChange = (key: QualityKey, value: string) => {
    setHasChanges(true)
    onQualitiesChange({
      ...qualities,
      [key]: value,
    })
  }

  const handleSave = () => {
    if (onSave) {
      onSave()
      setHasChanges(false)
    }
  }

  const activeCount = Object.keys(qualities).filter(k => !!qualities[k]).length

  const renderPill = (key: QualityKey, label: string) => {
    const selectedValue = qualities[key]
    const isActive = !!selectedValue

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border backdrop-blur-sm",
              isActive
                ? "bg-primary/15 border-primary/40 text-primary shadow-[0_0_15px_-4px_var(--color-primary)] ring-1 ring-primary/20"
                : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 hover:border-white/20"
            )}
          >
            {isActive ? (
              <>
                <span className="opacity-60 font-normal">{label}</span>
                <span className="font-semibold text-primary-foreground/90">{selectedValue}</span>
              </>
            ) : (
              <span className="tracking-wide">{label}</span>
            )}
            <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isActive ? "opacity-80 text-primary" : "opacity-40")} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="bg-glass-panel border-glass-border backdrop-blur-xl p-1 z-50"
        >
          <div className="max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
            {QUALITY_OPTIONS[key].map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => handleChange(key, option)}
                className={cn(
                  "text-xs focus:bg-primary/20 focus:text-primary-foreground cursor-pointer rounded-md my-0.5",
                  qualities[key] === option && "bg-primary/10 text-primary-foreground"
                )}
              >
                {option}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const Content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-widest text-muted-foreground/70 uppercase font-heading">
          Asset Parameters
        </h2>
        <div className="flex items-center gap-2">
          {onSave && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className={cn(
                "h-7 text-xs font-medium gap-1.5 transition-all",
                hasChanges
                  ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600 animate-pulse"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {renderPill("art_style", "Style")}
        {renderPill("base_resolution", "Res")}
        {renderPill("perspective", "View")}
        {renderPill("game_genre", "Genre")}
        {renderPill("theme", "Theme")}
        {renderPill("mood", "Mood")}
        {renderPill("color_palette", "Palette")}
      </div>
    </div>
  )

  if (mode === 'popover') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "h-9 gap-2 px-3 transition-all duration-300 font-heading tracking-wide",
              activeCount > 0
                ? "text-primary hover:text-primary hover:bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Parameters</span>
            {activeCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 ml-1 text-[10px] font-bold rounded-full bg-primary/20 text-primary">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[400px] p-5 glass-panel border-glass-border rounded-xl mt-2"
          align="end"
          sideOffset={8}
        >
          {Content}
        </PopoverContent>
      </Popover>
    )
  }

  // Compact collapsible bar mode
  return (
    <CollapsibleBar
      qualities={qualities}
      onQualitiesChange={onQualitiesChange}
      onSave={handleSave}
      hasChanges={hasChanges}
      activeCount={activeCount}
      renderPill={renderPill}
      defaultExpanded={defaultExpanded}
    />
  )
}

// Extracted to separate component to use its own useState
function CollapsibleBar({
  activeCount,
  renderPill,
  onSave,
  hasChanges,
  defaultExpanded
}: {
  qualities: ProjectQualities
  onQualitiesChange: (q: ProjectQualities) => void
  activeCount: number
  renderPill: (key: QualityKey, label: string) => React.ReactNode
  onSave: () => void
  hasChanges: boolean
  defaultExpanded: boolean
}) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  return (
    <div className="w-full px-6 py-2 bg-glass-bg/5 backdrop-blur-sm">
      {/* Header row - Always visible */}
      <div className="flex items-center justify-between py-1">
        {/* Left side - clickable to toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 group"
        >
          <h2 className="text-sm font-semibold tracking-wide text-foreground/90 uppercase font-heading">
            Asset Parameters
          </h2>
          {!isExpanded && activeCount > 0 && (
            <span className="text-xs text-primary">
              {activeCount} set
            </span>
          )}
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isExpanded ? "rotate-180" : ""
          )} />
        </button>

        {/* Right side - Empty when collapsed, Save button shows when expanded */}
        {isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onSave()
            }}
            className={cn(
              "h-6 text-xs font-medium gap-1 transition-all",
              hasChanges
                ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600 shadow-[0_0_10px_-4px_rgba(34,197,94,0.5)]"
                : "text-muted-foreground hover:text-primary"
            )}
            title="Save changes and update plan"
          >
            <Save className="w-3 h-3" />
            Save
          </Button>
        )}
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="pt-2 pb-1">
          <div className="flex flex-wrap gap-2">
            {renderPill("art_style", "Style")}
            {renderPill("base_resolution", "Res")}
            {renderPill("perspective", "View")}
            {renderPill("game_genre", "Genre")}
            {renderPill("theme", "Theme")}
            {renderPill("mood", "Mood")}
            {renderPill("color_palette", "Palette")}
          </div>
        </div>
      )}
    </div>
  )
}
