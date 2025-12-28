"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export function QualitiesBar({ qualities, onQualitiesChange }: QualitiesBarProps) {
  const handleChange = (key: QualityKey, value: string) => {
    onQualitiesChange({
      ...qualities,
      [key]: value,
    })
  }

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
          className="bg-glass-panel border-glass-border backdrop-blur-xl p-1"
        >
          <div className="max-h-[300px] overflow-y-auto px-1">
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

  return (
    <div className="w-full px-6 py-4 border-b border-white/5 bg-glass-bg/10 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold tracking-widest text-muted-foreground/70 uppercase font-heading">
          Asset Parameters
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Suggest
        </Button>
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
}
