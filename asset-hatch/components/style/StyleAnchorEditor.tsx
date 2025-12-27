'use client';

/**
 * Style Anchor Editor Component
 *
 * Workflow:
 * 1. User uploads reference image
 * 2. AI analyzes image and suggests style/lighting keywords
 * 3. Client extracts color palette from image
 * 4. User reviews and edits suggestions
 * 5. User saves style anchor to IndexedDB
 */

import { useState, useRef } from 'react';
import { db, type StyleAnchor } from '@/lib/db';
import { extractColorPalette, blobToBase64 } from '@/lib/image-utils';

interface StyleAnalysisResult {
  style_keywords: string;
  lighting_keywords: string;
  color_notes: string;
  ai_suggested: boolean;
}

interface StyleAnchorEditorProps {
  projectId: string;
  onSave: (styleAnchor: StyleAnchor) => void;
  onCancel?: () => void;
  initialStyleKeywords?: string;
  initialLightingKeywords?: string;
  initialColorPalette?: string[];
}

export function StyleAnchorEditor({
  projectId,
  onSave,
  onCancel,
  initialStyleKeywords,
  initialLightingKeywords,
  initialColorPalette,
}: StyleAnchorEditorProps) {
  // Upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<StyleAnalysisResult | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);

  // Editable fields (pre-fill with AI chat suggestions if provided)
  const [styleKeywords, setStyleKeywords] = useState(initialStyleKeywords || '');
  const [lightingKeywords, setLightingKeywords] = useState(initialLightingKeywords || '');
  const [selectedColors, setSelectedColors] = useState<string[]>(initialColorPalette || []);
  const [fluxModel, setFluxModel] = useState('black-forest-labs/flux-2-dev');

  // Save state
  const [isSaving, setIsSaving] = useState(false);

  // Handle image upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-analyze after upload
    await analyzeImage(file);
  };

  // Analyze image with AI + color extraction
  const analyzeImage = async (imageFile: File) => {
    setIsAnalyzing(true);

    try {
      // 1. AI analysis via API
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/analyze-style', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      setAiSuggestions(result.analysis);

      // Auto-fill editable fields with AI suggestions
      setStyleKeywords(result.analysis.style_keywords);
      setLightingKeywords(result.analysis.lighting_keywords);

      // 2. Client-side color extraction
      const imageBlob = new Blob([await imageFile.arrayBuffer()], { type: imageFile.type });
      const colors = await extractColorPalette(imageBlob, 8);
      setExtractedColors(colors);
      setSelectedColors(colors); // Default: select all

      console.log('✅ Style analysis complete:', {
        ai: result.analysis,
        colors,
      });
    } catch (error) {
      console.error('❌ Style analysis failed:', error);
      alert('Failed to analyze image. You can still manually enter style keywords.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle color selection
  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  // Save style anchor to IndexedDB
  const handleSave = async () => {
    if (!selectedImage || !styleKeywords || !lightingKeywords) {
      alert('Please complete all required fields');
      return;
    }

    setIsSaving(true);

    try {
      // Convert image to blob and base64
      const imageBlob = new Blob([await selectedImage.arrayBuffer()], {
        type: selectedImage.type,
      });
      const imageBase64 = await blobToBase64(imageBlob);

      const styleAnchor: StyleAnchor = {
        id: `style-${Date.now()}`,
        project_id: projectId,
        reference_image_name: selectedImage.name,
        reference_image_blob: imageBlob,
        reference_image_base64: imageBase64,
        style_keywords: styleKeywords,
        lighting_keywords: lightingKeywords,
        color_palette: selectedColors,
        flux_model: fluxModel,
        ai_suggested: Boolean(aiSuggestions),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to IndexedDB
      await db.style_anchors.add(styleAnchor);

      console.log('✅ Style anchor saved:', styleAnchor.id);

      // Callback
      onSave(styleAnchor);
    } catch (error) {
      console.error('❌ Failed to save style anchor:', error);
      alert('Failed to save style anchor');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
      <h2 className="text-2xl font-bold text-white">Create Style Anchor</h2>

      {/* Step 1: Upload Image */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-white/80">
          1. Upload Reference Image
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
        >
          {selectedImage ? 'Change Image' : 'Choose Image'}
        </button>

        {imagePreview && (
          <div className="relative w-full h-64 bg-black/20 rounded-md overflow-hidden">
            <img
              src={imagePreview}
              alt="Style reference"
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Step 2: AI Analysis (auto-triggered) */}
      {isAnalyzing && (
        <div className="flex items-center gap-3 p-4 bg-purple-600/20 rounded-md">
          <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" />
          <span className="text-white/80">Analyzing image with AI...</span>
        </div>
      )}

      {/* Step 3: Edit AI Suggestions */}
      {aiSuggestions && !isAnalyzing && (
        <>
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-white/80">
              2. Style Keywords
              {aiSuggestions.ai_suggested && (
                <span className="ml-2 text-xs text-purple-400">(AI suggested - edit as needed)</span>
              )}
            </label>
            <textarea
              value={styleKeywords}
              onChange={(e) => setStyleKeywords(e.target.value)}
              rows={2}
              placeholder="e.g., 16-bit pixel art, SNES RPG style, limited 16-color palette"
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-white/80">
              3. Lighting Keywords
              {aiSuggestions.ai_suggested && (
                <span className="ml-2 text-xs text-purple-400">(AI suggested - edit as needed)</span>
              )}
            </label>
            <textarea
              value={lightingKeywords}
              onChange={(e) => setLightingKeywords(e.target.value)}
              rows={2}
              placeholder="e.g., flat lighting, even illumination, minimal shadows"
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Step 4: Color Palette Selection */}
          {extractedColors.length > 0 && (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-white/80">
                4. Color Palette (click to toggle)
              </label>
              <div className="grid grid-cols-8 gap-2">
                {extractedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => toggleColor(color)}
                    className={`relative h-12 rounded-md transition-all ${
                      selectedColors.includes(color)
                        ? 'ring-2 ring-white scale-105'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {selectedColors.includes(color) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-xl drop-shadow-lg">✓</div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/60">
                {selectedColors.length} colors selected
              </p>
            </div>
          )}

          {/* Step 5: Model Selection */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-white/80">
              5. Flux Model
            </label>
            <select
              value={fluxModel}
              onChange={(e) => setFluxModel(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="black-forest-labs/flux-2-dev">Flux.2 Dev (Fast, good quality)</option>
              <option value="black-forest-labs/flux-2-pro">Flux.2 Pro (Slow, best quality)</option>
            </select>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={!selectedImage || !styleKeywords || !lightingKeywords || isSaving}
          className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Style Anchor'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
