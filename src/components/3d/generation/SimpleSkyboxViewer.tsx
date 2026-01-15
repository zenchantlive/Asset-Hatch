"use client";

/**
 * Babylon.js PhotoDome 360 Skybox Viewer
 * Uses Babylon.js PhotoDome for proper equirectangular projection
 */

import { useRef, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface SimpleSkyboxViewerProps {
    imageUrl: string;
    showSeamLine?: boolean;
    autoRotate?: boolean;
    rotationSpeed?: number;
    className?: string;
}

export function SimpleSkyboxViewer({
    imageUrl,
    showSeamLine = false,
    autoRotate = false,
    rotationSpeed = 0.001,
    className = "",
}: SimpleSkyboxViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<unknown>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        let disposed = false;
        let resizeHandler: (() => void) | null = null;

        // Dynamically import Babylon.js
        import('@babylonjs/core').then((BABYLON) => {
            if (disposed) return;

            try {
                // Create engine
                const engine = new BABYLON.Engine(canvas, true);
                engineRef.current = engine;

                // Create scene
                const scene = new BABYLON.Scene(engine);
                scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

                // Create camera at origin looking forward
                const camera = new BABYLON.ArcRotateCamera(
                    "camera",
                    -Math.PI / 2, // alpha (horizontal rotation)
                    Math.PI / 2,  // beta (vertical rotation, looking at horizon)
                    0.1,          // radius (very close to center)
                    BABYLON.Vector3.Zero(),
                    scene
                );
                camera.attachControl(canvas, true);
                camera.lowerRadiusLimit = 0.1;
                camera.upperRadiusLimit = 0.1;
                camera.wheelPrecision = 1000; // Disable zoom
                camera.panningSensibility = 0; // Disable panning

                // Create PhotoDome for 360 panorama
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

                // Wait for texture to load
                photoDome.onReady = () => {
                    setIsLoading(false);
                    setError(null);
                };

                // Auto-rotate if enabled
                if (autoRotate) {
                    scene.registerBeforeRender(() => {
                        camera.alpha += rotationSpeed;
                    });
                }

                // Render loop
                engine.runRenderLoop(() => {
                    scene.render();
                });

                // Handle resize
                resizeHandler = () => {
                    engine.resize();
                };
                window.addEventListener('resize', resizeHandler);

                // Fallback timeout for loading state
                setTimeout(() => {
                    if (!disposed) setIsLoading(false);
                }, 3000);

            } catch (err) {
                console.error('Babylon.js error:', err);
                setIsLoading(false);
                setError(err instanceof Error ? err.message : 'Failed to load viewer');
            }
        }).catch((err) => {
            console.error('Failed to load Babylon.js:', err);
            setIsLoading(false);
            setError('Failed to load 360 viewer');
        });

        return () => {
            disposed = true;
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
            }
            if (engineRef.current) {
                try {
                    (engineRef.current as { dispose: () => void }).dispose();
                } catch {
                    // Ignore cleanup errors
                }
                engineRef.current = null;
            }
        };
    }, [imageUrl, autoRotate, rotationSpeed]);

    return (
        <div className={`relative w-full h-full bg-black rounded-lg overflow-hidden ${className}`}>
            {/* Babylon.js canvas */}
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ display: 'block', touchAction: 'none' }}
            />

            {/* Seam line indicator */}
            {showSeamLine && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="h-full w-0.5 bg-red-500/80" />
                </div>
            )}

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
