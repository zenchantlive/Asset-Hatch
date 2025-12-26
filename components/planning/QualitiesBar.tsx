"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface ProjectQualities {
  art_style?: string
  base_resolution?: string
  perspective?: string
  game_genre?: string
  theme?: string
  mood?: string
  color_palette?: string
}

interface QualitiesBarProps {
  qualities: ProjectQualities
  onQualitiesChange: (qualities: ProjectQualities) => void
}

const QUALITY_OPTIONS = {
  art_style: [
    "Pixel Art",
    "Hand-drawn",
    "3D Painted",
    "Watercolor",
    "Comic Book",
    "Vector/Flat",
    "Anime",
    "Realistic",
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

export function QualitiesBar({ qualities, onQualitiesChange }: QualitiesBarProps) {
  const handleChange = (key: keyof ProjectQualities, value: string) => {
    onQualitiesChange({
      ...qualities,
      [key]: value,
    })
  }

  return (
    <div
      className="sticky top-[var(--header-height)] z-40 flex flex-wrap items-center gap-3 px-6 py-3 glass-panel border-b"
      style={{ height: "var(--qualities-bar-height)" }}
    >
      {/* Art Style */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label htmlFor="art-style" className="text-xs font-medium opacity-70">
          Art Style
        </label>
        <Select
          value={qualities.art_style}
          onValueChange={(value) => handleChange("art_style", value)}
        >
          <SelectTrigger id="art-style" className="h-8 text-xs">
            <SelectValue placeholder="Select style..." />
          </SelectTrigger>
          <SelectContent>
            {QUALITY_OPTIONS.art_style.map((option) => (
              <SelectItem key={option} value={option} className="text-xs">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Base Resolution */}
      <div className="flex flex-col gap-1 min-w-[120px]">
        <label htmlFor="resolution" className="text-xs font-medium opacity-70">
          Resolution
        </label>
        <Select
          value={qualities.base_resolution}
          onValueChange={(value) => handleChange("base_resolution", value)}
        >
          <SelectTrigger id="resolution" className="h-8 text-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {QUALITY_OPTIONS.base_resolution.map((option) => (
              <SelectItem key={option} value={option} className="text-xs">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Perspective */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label htmlFor="perspective" className="text-xs font-medium opacity-70">
          Perspective
        </label>
        <Select
          value={qualities.perspective}
          onValueChange={(value) => handleChange("perspective", value)}
        >
          <SelectTrigger id="perspective" className="h-8 text-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {QUALITY_OPTIONS.perspective.map((option) => (
              <SelectItem key={option} value={option} className="text-xs">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Game Genre */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label htmlFor="genre" className="text-xs font-medium opacity-70">
          Genre
        </label>
        <Select
          value={qualities.game_genre}
          onValueChange={(value) => handleChange("game_genre", value)}
        >
          <SelectTrigger id="genre" className="h-8 text-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {QUALITY_OPTIONS.game_genre.map((option) => (
              <SelectItem key={option} value={option} className="text-xs">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Theme */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label htmlFor="theme" className="text-xs font-medium opacity-70">
          Theme
        </label>
        <Select
          value={qualities.theme}
          onValueChange={(value) => handleChange("theme", value)}
        >
          <SelectTrigger id="theme" className="h-8 text-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {QUALITY_OPTIONS.theme.map((option) => (
              <SelectItem key={option} value={option} className="text-xs">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mood */}
      <div className="flex flex-col gap-1 min-w-[120px]">
        <label htmlFor="mood" className="text-xs font-medium opacity-70">
          Mood
        </label>
        <Select
          value={qualities.mood}
          onValueChange={(value) => handleChange("mood", value)}
        >
          <SelectTrigger id="mood" className="h-8 text-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {QUALITY_OPTIONS.mood.map((option) => (
              <SelectItem key={option} value={option} className="text-xs">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Palette */}
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label htmlFor="palette" className="text-xs font-medium opacity-70">
          Palette
        </label>
        <Select
          value={qualities.color_palette}
          onValueChange={(value) => handleChange("color_palette", value)}
        >
          <SelectTrigger id="palette" className="h-8 text-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {QUALITY_OPTIONS.color_palette.map((option) => (
              <SelectItem key={option} value={option} className="text-xs">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
