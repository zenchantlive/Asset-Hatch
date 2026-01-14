"use client";

/**
 * SkyboxViewer Component
 *
 * Displays an equirectangular 360 panorama skybox image in a spherical viewer.
 * User can look around in all directions using mouse drag controls.
 *
 * Technical approach:
 * - Camera positioned at center of inverted sphere (0, 0, 0)
 * - Equirectangular image texture mapped to sphere interior
 * - OrbitControls for look-around (zoom and pan disabled)
 *
 * @see ModelViewer.tsx for similar Three.js Canvas pattern
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { Canvas, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Loader2, AlertCircle, Move3D } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

/**
 * Props for the SkyboxViewer component.
 */
interface SkyboxViewerProps {
    // URL of the equirectangular skybox image (data URL or HTTP URL)
    imageUrl: string;
    // Show seam line at 0/360° for seamlessness inspection
    showSeamLine?: boolean;
    // Enable auto-rotation for easy inspection
    autoRotate?: boolean;
    // Auto-rotation speed (default: 0.5)
    rotationSpeed?: number;
    // Optional additional CSS classes
    className?: string;
    // Callback when skybox finishes loading
    onLoad?: () => void;
    // Callback when an error occurs
    onError?: (error: Error) => void;
}

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Loading Spinner Component
 * Displayed inside the Canvas while texture loads.
 */
function LoadingSpinner() {
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                <span className="text-xs text-white/60">Loading skybox...</span>
            </div>
        </Html>
    );
}

/**
 * Error Display Component
 * Shown when texture fails to load.
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
 * SkyboxSphere Component
 * Renders the inverted sphere with equirectangular texture.
 */
function SkyboxSphere({
    imageUrl,
    onLoad,
    showSeamLine = false,
}: {
    imageUrl: string;
    onLoad?: () => void;
    showSeamLine?: boolean;
}) {
    // Load the texture using Three.js TextureLoader
    const texture = useLoader(THREE.TextureLoader, imageUrl);

    // Configure texture clone for proper equirectangular mapping
    useEffect(() => {
        if (texture) {
            console.log('SkyboxSphere: Texture loaded', texture);
            // Clone texture to avoid mutating cached version
            const cloned = texture.clone();
            // Set color space for proper colors
            cloned.colorSpace = THREE.SRGBColorSpace;
            // Notify parent that loading is complete
            onLoad?.();
        }
    }, [texture, onLoad]);

    return (
        <>
            {/* Skybox sphere - camera is inside looking out */}
            <mesh scale={[-1, 1, 1]}>
                <sphereGeometry args={[500, 60, 40]} />
                <meshBasicMaterial map={texture} side={THREE.BackSide} />
            </mesh>

            {/* Red seam line at 0/360° boundary for seamlessness inspection */}
            {showSeamLine && (
                <mesh rotation={[0, 0, 0]}>
                    <planeGeometry args={[1, 1000]} />
                    <meshBasicMaterial color="#ff0000" side={THREE.DoubleSide} opacity={0.8} transparent />
                </mesh>
            )}
        </>
    );
}

/**
 * Camera Setup Component
 * Ensures camera is properly positioned at center.
 */
function CameraSetup() {
    const { camera } = useThree();

    useEffect(() => {
        // Position camera at center of sphere
        camera.position.set(0, 0, 0);
        camera.lookAt(0, 0, 1);
    }, [camera]);

    return null;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * SkyboxViewer Component
 *
 * Displays a 360 degree panoramic skybox image that users can look around.
 * Uses Three.js with an inverted sphere for immersive viewing.
 *
 * @param imageUrl - The equirectangular skybox image URL
 * @param className - Optional CSS classes
 * @param onLoad - Callback when skybox finishes loading
 * @param onError - Callback when an error occurs
 */
export function SkyboxViewer({
    imageUrl,
    showSeamLine = false,
    autoRotate = false,
    rotationSpeed = 0.5,
    className = "",
    onLoad,
    onError,
}: SkyboxViewerProps) {
    // Loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Handle successful texture load
    const handleLoad = useCallback(() => {
        setIsLoading(false);
        onLoad?.();
    }, [onLoad]);

    // Handle errors in Suspense boundary
    const handleError = useCallback((err: Error) => {
        setError(err.message || "Failed to load skybox");
        setIsLoading(false);
        onError?.(err);
    }, [onError]);

    return (
        <div className={`relative w-full h-full bg-black/20 rounded-lg ${className}`}>
            <Canvas
                camera={{ position: [0, 0, 0.1], fov: 75 }}
                gl={{ antialias: true }}
            >
                <ambientLight intensity={0.5} />
                <CameraSetup />

                <Suspense fallback={<LoadingSpinner />}>
                    <SkyboxSphere imageUrl={imageUrl} onLoad={handleLoad} showSeamLine={showSeamLine} />
                </Suspense>

                <OrbitControls
                    makeDefault
                    autoRotate={autoRotate}
                    autoRotateSpeed={rotationSpeed}
                    enablePan={false}
                    enableZoom={true}
                    enableRotate={true}
                />
            </Canvas>

            {/* Only show loading when actually loading */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                </div>
            )}

            {/* Error display */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <AlertCircle className="h-6 w-6 text-red-400 mb-2" />
                        <span className="text-sm text-red-400">{error}</span>
                    </div>
                </div>
            )}

            {/* Controls hint - only when loaded */}
            {!isLoading && !error && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-black/60 text-xs text-white/50 pointer-events-none">
                    Drag to rotate
                </div>
            )}
        </div>
    );
}
