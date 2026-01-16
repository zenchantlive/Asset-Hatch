"use client";

/**
 * Babylon.js PhotoDome 360 Skybox Viewer
 * Uses Babylon.js PhotoDome for proper equirectangular projection
 *
 * Features:
 * - Delta-time-based auto-rotation for consistent speed across frame rates
 */

import { useRef, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface SimpleSkyboxViewerProps {
    /** URL of the equirectangular skybox image */
    imageUrl: string;
    /** Enable auto-rotation of the camera */
    autoRotate?: boolean;
    /** Rotation speed in degrees per second (default: 15°/s) */
    rotationSpeedDegPerSec?: number;
    /** Additional CSS classes */
    className?: string;
}

// =============================================================================
// Constants
// =============================================================================

/** Default rotation speed: 15 degrees per second (comfortable viewing pace) */
const DEFAULT_ROTATION_SPEED_DEG_PER_SEC = 15;

// =============================================================================
// Main Component
// =============================================================================

export function SimpleSkyboxViewer({
    imageUrl,
    autoRotate = false,
    rotationSpeedDegPerSec = DEFAULT_ROTATION_SPEED_DEG_PER_SEC,
    className = "",
}: SimpleSkyboxViewerProps) {
    // Canvas ref for Babylon.js engine
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Engine ref for cleanup
    const engineRef = useRef<unknown>(null);

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        let disposed = false;
        let resizeHandler: (() => void) | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let observer: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let currentScene: any = null;

        // Dynamically import Babylon.js to avoid SSR issues
        import('@babylonjs/core').then((BABYLON) => {
            if (disposed) return;

            try {
                // Create engine with antialiasing
                const engine = new BABYLON.Engine(canvas, true);
                engineRef.current = engine;

                // Create scene with black background
                const scene = new BABYLON.Scene(engine);
                currentScene = scene;
                scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

                // Create ArcRotateCamera at origin, looking forward
                // alpha = horizontal rotation, beta = vertical (π/2 = horizon level)
                const camera = new BABYLON.ArcRotateCamera(
                    "camera",
                    -Math.PI / 2, // alpha: start looking forward
                    Math.PI / 2,  // beta: looking at horizon level
                    0.1,          // radius: very close to center for inside-sphere view
                    BABYLON.Vector3.Zero(),
                    scene
                );
                camera.attachControl(canvas, true);

                // Lock zoom to keep camera at center
                camera.lowerRadiusLimit = 0.1;
                camera.upperRadiusLimit = 0.1;
                camera.wheelPrecision = 1000; // Effectively disable zoom
                camera.panningSensibility = 0; // Disable panning

                // Create PhotoDome for 360 panorama viewing
                const photoDome = new BABYLON.PhotoDome(
                    "skybox",
                    imageUrl,
                    {
                        resolution: 32,
                        size: 1000,
                        useDirectMapping: false,
                    },
                    scene
                );

                // Mark loading complete when texture is ready
                photoDome.onReady = () => {
                    setIsLoading(false);
                    setError(null);
                };

                // Convert rotation speed from degrees/sec to radians/ms
                const rotationSpeedRadPerMs = (rotationSpeedDegPerSec * Math.PI) / (180 * 1000);

                // Register before-render callback for auto-rotation
                observer = scene.registerBeforeRender(() => {
                    // Delta-time-based rotation for consistent speed across frame rates
                    if (autoRotate) {
                        const deltaMs = engine.getDeltaTime();
                        camera.alpha += rotationSpeedRadPerMs * deltaMs;
                    }
                });

                // Main render loop
                engine.runRenderLoop(() => {
                    scene.render();
                });

                // Handle window resize
                resizeHandler = () => {
                    engine.resize();
                };
                window.addEventListener('resize', resizeHandler);

                // Fallback timeout in case onReady doesn't fire
                setTimeout(() => {
                    if (!disposed) setIsLoading(false);
                }, 3000);

            } catch (err) {
                console.error('Babylon.js initialization error:', err);
                setIsLoading(false);
                setError(err instanceof Error ? err.message : 'Failed to load viewer');
            }
        }).catch((err) => {
            console.error('Failed to load Babylon.js:', err);
            setIsLoading(false);
            setError('Failed to load 360 viewer');
        });

        // Cleanup on unmount or dependency change
        return () => {
            disposed = true;
            // Unregister the render loop observer
            if (observer && currentScene) {
                currentScene.onBeforeRenderObservable.remove(observer);
            }
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
            }
            if (engineRef.current) {
                try {
                    (engineRef.current as { dispose: () => void }).dispose();
                } catch {
                    // Ignore cleanup errors during disposal
                }
                engineRef.current = null;
            }
        };
    }, [imageUrl, autoRotate, rotationSpeedDegPerSec]);

    return (
        <div className={`relative w-full h-full bg-black rounded-lg overflow-hidden ${className}`}>
            {/* Babylon.js canvas */}
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ display: 'block', touchAction: 'none' }}
            />

            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                </div>
            )}

            {/* Error overlay */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                        <span className="text-sm text-red-400">{error}</span>
                    </div>
                </div>
            )}

            {/* Controls hint */}
            {!isLoading && !error && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-black/60 text-xs text-white/50 pointer-events-none z-10">
                    Drag to rotate
                </div>
            )}
        </div>
    );
}
