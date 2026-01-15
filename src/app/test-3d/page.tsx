"use client";

import { useState } from "react";
import { ModelViewer } from "@/components/3d/generation/ModelViewer";

/**
 * Test Page for 3D Model Viewer
 * 
 * Quick way to test loading GLB models from Tripo
 */
export default function Test3DPage() {
  const [modelUrl, setModelUrl] = useState("");
  const [loadUrl, setLoadUrl] = useState("");

  const handleLoad = () => {
    setLoadUrl(modelUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass-panel p-6 space-y-4">
          <h1 className="text-3xl font-bold text-white">
            🎨 3D Model Viewer Test
          </h1>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              Tripo GLB URL:
            </label>
            <input
              type="text"
              value={modelUrl}
              onChange={(e) => setModelUrl(e.target.value)}
              placeholder="Paste GLB URL from Tripo API..."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <button
            onClick={handleLoad}
            disabled={!modelUrl}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Load Model
          </button>

          {loadUrl && (
            <div className="pt-2">
              <p className="text-xs text-white/60 mb-2">
                Loading from: {loadUrl.substring(0, 50)}...
              </p>
            </div>
          )}
        </div>

        {loadUrl && (
          <div className="glass-panel p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Model Preview
            </h2>
            <div className="h-[500px]">
              <ModelViewer
                modelUrl={loadUrl}
                autoRotate={true}
                onLoad={() => console.log("✅ Model loaded!")}
              />
            </div>
          </div>
        )}

        <div className="glass-panel p-6 space-y-3 text-sm text-white/80">
          <h3 className="font-semibold text-white">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Run the test script: <code className="px-2 py-1 bg-black/30 rounded">bun run scripts/test-tripo-basic.ts</code></li>
            <li>Copy the GLB URL from the output</li>
            <li>Paste it in the input above and click &quot;Load Model&quot;</li>
            <li>The model will load through the CORS proxy at <code className="px-2 py-1 bg-black/30 rounded">/api/proxy-model</code></li>
          </ol>

          <div className="pt-4 space-y-2">
            <h4 className="font-semibold text-white">Sample Test URLs:</h4>
            <p className="text-xs">
              Run <code className="px-2 py-1 bg-black/30 rounded">bun run scripts/test-tripo-basic.ts</code> to generate a fresh test model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
