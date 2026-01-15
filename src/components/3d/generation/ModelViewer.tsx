"use client";

import { useState, useCallback, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, Stage, Html } from "@react-three/drei";
import * as THREE from "three";
import { Loader2, AlertCircle } from "lucide-react";

interface ModelViewerProps {
    modelUrl: string;
    autoRotate?: boolean;
    className?: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}

/**
 * GLB Model Loader Component
 * Handles loading, rendering of 3D models
 */
function GLBModel({ url, onLoad }: { url: string; onLoad?: () => void }) {
    // Use proxy for Tripo URLs to avoid CORS issues
    const loadUrl = url.startsWith('https://tripo-data.')
        ? `/api/proxy-model?url=${encodeURIComponent(url)}`
        : url;

    const { scene } = useGLTF(loadUrl);

    // Note: This effect runs once when the scene is loaded
    // The parent component uses key={modelUrl} to remount when URL changes
    if (scene) {
        // Clone scene to avoid mutating cached version
        const cloned = scene.clone(true);

        // Center and scale
        const box = new THREE.Box3().setFromObject(cloned);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        cloned.position.set(
            cloned.position.x - center.x,
            cloned.position.y - center.y,
            cloned.position.z - center.z
        );

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 2) {
            cloned.scale.setScalar(2 / maxDim);
        }

        // Trigger onLoad callback synchronously after processing
        // This is safe because it's not inside an effect
        onLoad?.();
    }

    return (
        // @ts-expect-error - R3F intrinsic elements
        <primitive object={scene} />
    );
}

/**
 * Loading Spinner Component
 */
function LoadingSpinner() {
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                <span className="text-xs text-white/60">Loading model...</span>
            </div>
        </Html>
    );
}

/**
 * Error Display Component
 */
function ErrorDisplay({ error }: { error: string }) {
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <span className="text-xs text-red-400">{error}</span>
            </div>
        </Html>
    );
}

/**
 * Main Model Viewer Component
 * Displays GLB models in an interactive 3D viewer
 */
export function ModelViewer({
    modelUrl,
    autoRotate = true,
    className = "",
    onLoad,
}: Omit<ModelViewerProps, 'onError'>) {
    const [loading, setLoading] = useState(true);
    const [error] = useState<string | null>(null);

    const handleLoad = useCallback(() => {
        setLoading(false);
        onLoad?.();
    }, [onLoad]);

    return (
        // Key forces re-mount when modelUrl changes, resetting all state naturally
        <div key={modelUrl} className={`relative w-full h-full min-h-[300px] rounded-lg overflow-hidden bg-glass-bg/20 ${className}`}>
            <Canvas
                shadows
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                }}
                camera={{ position: [0, 1, 3], fov: 45 }}
                dpr={[1, 2]}
            >
                {/* Lighting Environment */}
                <Environment preset="studio" />

                {/* Stage for professional lighting */}
                <Stage
                    environment="studio"
                    intensity={0.5}
                    adjustCamera={false}
                >
                    <Suspense fallback={<LoadingSpinner />}>
                        {error ? (
                            <ErrorDisplay error={error} />
                        ) : (
                            <GLBModel
                                url={modelUrl}
                                onLoad={handleLoad}
                            />
                        )}
                    </Suspense>
                </Stage>

                {/* Orbit Controls */}
                <OrbitControls
                    makeDefault
                    autoRotate={autoRotate && !loading}
                    autoRotateSpeed={1}
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={0.5}
                    maxDistance={10}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI}
                />
            </Canvas>

            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                        <span className="text-sm text-white/60">Loading 3D model...</span>
                    </div>
                </div>
            )}

            {/* Error Display Overlay */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                        <AlertCircle className="h-8 w-8 text-red-400" />
                        <span className="text-sm text-red-400">{error}</span>
                    </div>
                </div>
            )}

            {/* Controls Hint */}
            {!loading && !error && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white/50">
                    Drag to rotate • Scroll to zoom
                </div>
            )}
        </div>
    );
}

// Preload the GLTF loader
useGLTF.preload("");
