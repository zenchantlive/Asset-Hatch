"use client";

/**
 * ModelViewer Component
 * 
 * Displays GLB 3D models with orbit controls. Handles errors gracefully,
 * including 403 Forbidden from expired Tripo3D signed URLs.
 */

import { useState, useCallback, Suspense, useEffect, useRef, useMemo, Component, type ReactNode, type ErrorInfo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, Stage, Html } from "@react-three/drei";
import * as THREE from "three";
import { Loader2, Box } from "lucide-react";
import { ErrorBadge3D, type ErrorType } from "./ErrorBadge3D";

interface ModelViewerProps {
    /** URL of the GLB model to display */
    modelUrl: string;
    /** Enable auto-rotation of the model */
    autoRotate?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Callback when model loads successfully */
    onLoad?: () => void;
    /** Callback when error occurs, with error type */
    onError?: (errorType: ErrorType) => void;
    /** Callback when user clicks regenerate on error */
    onRegenerate?: () => void;
}

/**
 * GLB Model Loader Component
 * Handles loading and rendering of 3D models inside the Canvas
 */
function GLBModel({ url, onLoad }: { url: string; onLoad?: () => void }) {
    // Use proxy for Tripo URLs to avoid CORS issues
    const loadUrl = url.startsWith("https://tripo-data.")
        ? `/api/proxy-model?url=${encodeURIComponent(url)}`
        : url;

    const { scene } = useGLTF(loadUrl);

    // Process scene when loaded
    useEffect(() => {
        if (scene) {
            // Trigger onLoad callback
            onLoad?.();
        }
    }, [scene, onLoad]);

    // Memoize the processed scene to avoid repeated Box3 calculations/cloning
    const processedScene = useMemo(() => {
        if (!scene) return null;

        // Clone scene to avoid mutating cached version
        const cloned = scene.clone(true);

        // Center and scale the model
        const box = new THREE.Box3().setFromObject(cloned);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        cloned.position.set(
            -center.x,
            -center.y,
            -center.z
        );

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 2) {
            cloned.scale.setScalar(2 / maxDim);
        }

        return cloned;
    }, [scene]);

    if (!processedScene) return null;

    return <primitive object={processedScene} />;
}

/**
 * Loading Spinner Component - shows inside Canvas
 */
function LoadingSpinner() {
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                <span className="text-xs text-white/60">Summoning your 3D model...</span>
            </div>
        </Html>
    );
}

/**
 * Determines error type from error message
 * @param error - The error object or message
 * @returns ErrorType - 'expired' for 403, 'network' for fetch errors, 'failed' otherwise
 */
function getErrorType(error: unknown): ErrorType {
    const message = error instanceof Error ? error.message : String(error);

    // Check for 403 Forbidden (expired Tripo URL)
    if (message.includes("403") || message.includes("Forbidden")) {
        return "expired";
    }

    // Check for network errors
    if (message.includes("fetch") || message.includes("network") || message.includes("Failed to fetch")) {
        return "network";
    }

    // Default to general failure
    return "failed";
}

/**
 * Main Model Viewer Component
 * Displays GLB models in an interactive 3D viewer with error handling
 */
export function ModelViewer({
    modelUrl,
    autoRotate = true,
    className = "",
    onLoad,
    onError,
    onRegenerate,
}: ModelViewerProps) {
    const [loading, setLoading] = useState(true);
    const [errorType, setErrorType] = useState<ErrorType | null>(null);

    // Note: State is automatically reset when modelUrl changes because the
    // parent div uses key={modelUrl} which causes a full remount

    // Handle successful model load
    const handleLoad = useCallback(() => {
        setLoading(false);
        setErrorType(null);
        onLoad?.();
    }, [onLoad]);

    // Use a ref to hold the latest onError callback to avoid stale closures in ErrorBoundary
    const onErrorRef = useRef(onError);
    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    // Handle model load error - called from error boundary
    const handleError = useCallback((error: unknown) => {
        console.error("❌ ModelViewer error:", error);
        const type = getErrorType(error);
        setErrorType(type);
        setLoading(false);
        onErrorRef.current?.(type);
    }, []);

    // Handle regenerate click
    const handleRegenerate = useCallback(() => {
        setErrorType(null);
        setLoading(true);
        onRegenerate?.();
    }, [onRegenerate]);

    // If we have an error, show the error badge instead of the Canvas
    if (errorType) {
        return (
            <div className={`relative w-full h-full min-h-[300px] rounded-lg overflow-hidden bg-glass-bg/20 ${className}`}>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    {/* Placeholder icon */}
                    <Box className="h-16 w-16 text-white/20 mb-4" />

                    {/* Error badge with explanation */}
                    <div className="w-full max-w-sm">
                        <ErrorBadge3D
                            errorType={errorType}
                            onAction={onRegenerate ? handleRegenerate : undefined}
                            actionLabel="Regenerate Model"
                        />
                    </div>
                </div>
            </div>
        );
    }

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
                onError={(e) => handleError(e)}
            >
                {/* Lighting Environment */}
                <Environment preset="studio" />

                {/* Stage for professional lighting */}
                <Stage environment="studio" intensity={0.5} adjustCamera={false}>
                    <Suspense fallback={<LoadingSpinner />}>
                        <ErrorBoundary onError={handleError}>
                            <GLBModel url={modelUrl} onLoad={handleLoad} />
                        </ErrorBoundary>
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
                        <span className="text-sm text-white/60">Summoning your 3D model...</span>
                    </div>
                </div>
            )}

            {/* Controls Hint */}
            {!loading && !errorType && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white/50">
                    Drag to rotate • Scroll to zoom
                </div>
            )}
        </div>
    );
}

/**
 * Simple Error Boundary Component for catching render errors in 3D scene
 */
interface ErrorBoundaryProps {
    children: ReactNode;
    onError: (error: unknown) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("ErrorBoundary caught:", error, errorInfo);
        this.props.onError(error);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // Return null - parent will show error UI
            return null;
        }
        return this.props.children;
    }
}

// Preload the GLTF loader
useGLTF.preload("");

