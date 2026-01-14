/**
 * AnimatedModelViewer Component
 *
 * Three.js viewer for animated GLB models with playback controls.
 * Detects and plays embedded animation clips using drei's useAnimations hook.
 *
 * @see ModelViewer.tsx for static model viewer
 * @see AssetDetailPanel3D.tsx for integration
 */

"use client";

import { useRef, useState, useCallback, Suspense, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
    OrbitControls,
    Environment,
    useGLTF,
    useAnimations,
    Stage,
    Html,
} from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { Loader2, AlertCircle, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnimationState } from "./types/3d-queue-types";
import { ANIMATION_PRESET_LABELS } from "@/lib/types/3d-generation";

// =============================================================================
// Types
// =============================================================================

/** Props for AnimatedModelViewer component */
interface AnimatedModelViewerProps {
    modelUrl: string;
    /** Optional preset name to display (e.g., "Climb") instead of raw animation name */
    presetName?: string;
    autoRotate?: boolean;
    autoPlay?: boolean;
    className?: string;
    onLoad?: () => void;
    onAnimationStateChange?: (state: AnimationState) => void;
}

/** Props for the internal 3D model component */
interface AnimatedGLBModelProps {
    url: string;
    isPlaying: boolean;
    onLoad?: () => void;
    onStateChange?: (state: AnimationState) => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format animation name to be user-friendly
 * Maps raw animation names (like "NlaTrack") to preset labels when possible
 */
function formatAnimationName(rawName: string | null, presetName?: string): string {
    // If preset name is provided, use it
    if (presetName) {
        return presetName;
    }

    // If no raw name, return generic label
    if (!rawName) {
        return "Animation";
    }

    // Try to match raw name to preset labels
    // Common patterns: "NlaTrack", "mixamo.com", "Armature|mixamo.com"
    const lowerName = rawName.toLowerCase();
    
    // Check if raw name contains any preset keywords
    for (const [preset, label] of Object.entries(ANIMATION_PRESET_LABELS)) {
        const presetKey = preset.replace('preset:', '');
        if (lowerName.includes(presetKey)) {
            return label;
        }
    }

    // If it's a generic NlaTrack, return "Animation"
    if (lowerName.includes('nlatrack')) {
        return "Animation";
    }

    // Return the raw name as fallback
    return rawName;
}

// =============================================================================
// Loading/Error Components
// =============================================================================

/** Loading spinner shown while model loads */
function LoadingSpinner() {
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                <span className="text-xs text-white/60">Loading animated model...</span>
            </div>
        </Html>
    );
}

/** Error display for model loading failures */
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

// =============================================================================
// 3D Model Component
// =============================================================================

/** Internal component that loads and animates the GLB model */
function AnimatedGLBModel({ url, isPlaying, onLoad, onStateChange }: AnimatedGLBModelProps) {
    // Ref for the group - required by useAnimations
    const groupRef = useRef<THREE.Group>(null);

    // Use proxy for Tripo URLs to avoid CORS issues
    const loadUrl = url.startsWith("https://tripo-data.")
        ? `/api/proxy-model?url=${encodeURIComponent(url)}`
        : url;

    // Load model and animations
    const { scene, animations } = useGLTF(loadUrl);

    // Get animation controls from drei
    const { actions, names, mixer } = useAnimations(animations, groupRef);

    // Track the first animation name (primary animation to play)
    const currentAnimationName = names.length > 0 ? names[0] : null;

    // Handle play/pause state changes
    useEffect(() => {
        if (!currentAnimationName) return;

        const action = actions[currentAnimationName];
        if (!action) return;

        if (isPlaying) {
            // Play the animation
            action.reset().fadeIn(0.3).play();
        } else {
            // Pause by stopping mixer update (action.paused causes lint error)
            action.stop();
        }

        return () => {
            // Cleanup on unmount
            action.fadeOut(0.3);
        };
    }, [isPlaying, currentAnimationName, actions]);

    // Signal model loaded
    useEffect(() => {
        if (scene) onLoad?.();
    }, [scene, onLoad]);

    // Report animation state to parent each frame
    useFrame((_, delta) => {
        // CRITICAL: Update the mixer each frame to advance animation time
        if (mixer) {
            mixer.update(delta);
        }

        if (!mixer || !onStateChange) return;

        const action = currentAnimationName ? actions[currentAnimationName] : null;
        let progress = 0;
        let duration = 0;

        if (action) {
            const clip = action.getClip();
            duration = clip.duration;
            progress = duration > 0 ? (action.time % duration) / duration : 0;
        }

        onStateChange({
            isPlaying,
            animationNames: names,
            currentAnimation: currentAnimationName,
            progress,
            duration,
        });
    });

    // Clone and center the model using SkeletonUtils for proper skeleton cloning
    // CRITICAL: Regular scene.clone() doesn't work for animated models because
    // animation tracks reference the original skeleton bone paths. SkeletonUtils.clone()
    // properly clones the skeleton AND rebinds to the new bones.
    const cloned = useMemo(() => {
        const clone = SkeletonUtils.clone(scene);
        const box = new THREE.Box3().setFromObject(clone);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        clone.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 2) clone.scale.setScalar(2 / maxDim);

        return clone;
    }, [scene]);

    // R3F elements (group, primitive) require special JSX intrinsic types
    // Use explicit cast since ts-expect-error doesn't span multi-line JSX
    const GroupComponent = 'group' as unknown as React.FC<{ ref: React.RefObject<THREE.Group | null>; children: React.ReactNode }>;
    const PrimitiveComponent = 'primitive' as unknown as React.FC<{ object: THREE.Object3D }>;

    return (
        <GroupComponent ref={groupRef}>
            <PrimitiveComponent object={cloned} />
        </GroupComponent>
    );
}

// =============================================================================
// Main Component
// =============================================================================

/** Displays animated GLB models with playback controls */
export function AnimatedModelViewer({
    modelUrl,
    presetName,
    autoRotate = false,
    autoPlay = true,
    className = "",
    onLoad,
    onAnimationStateChange,
}: AnimatedModelViewerProps) {
    const [loading, setLoading] = useState(true);
    const [error] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [animState, setAnimState] = useState<AnimationState>({
        isPlaying: autoPlay,
        animationNames: [],
        currentAnimation: null,
        progress: 0,
        duration: 0,
    });

    // Handle model load complete
    const handleLoad = useCallback(() => {
        setLoading(false);
        onLoad?.();
    }, [onLoad]);

    // Handle animation state updates from 3D scene
    const handleAnimationState = useCallback(
        (state: AnimationState) => {
            setAnimState(state);
            onAnimationStateChange?.(state);
        },
        [onAnimationStateChange]
    );

    // Toggle play/pause
    const togglePlay = useCallback(() => {
        setIsPlaying((prev) => !prev);
    }, []);

    return (
        <div key={modelUrl} className={cn("relative w-full h-full min-h-[15rem] max-h-[70vh] rounded-lg overflow-hidden bg-glass-bg/20", className)}>
            <Canvas
                shadows
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                camera={{ position: [0, 1, 3], fov: 45 }}
                dpr={[1, 2]}
            >
                <Environment preset="studio" />
                <Stage environment="studio" intensity={0.5} adjustCamera={false}>
                    <Suspense fallback={<LoadingSpinner />}>
                        {error ? (
                            <ErrorDisplay error={error} />
                        ) : (
                            <AnimatedGLBModel
                                url={modelUrl}
                                isPlaying={isPlaying}
                                onLoad={handleLoad}
                                onStateChange={handleAnimationState}
                            />
                        )}
                    </Suspense>
                </Stage>
                <OrbitControls
                    makeDefault
                    autoRotate={autoRotate && !loading}
                    autoRotateSpeed={1}
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={0.5}
                    maxDistance={10}
                />
            </Canvas>

            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                </div>
            )}

            {/* Animation Controls - show when model has animations */}
            {!loading && !error && animState.animationNames.length > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm">
                    {/* Play/Pause Button */}
                    <button
                        onClick={togglePlay}
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            isPlaying
                                ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                                : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        )}
                        title={isPlaying ? "Pause animation" : "Play animation"}
                    >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </button>
                    {/* Animation Name - show formatted name instead of raw NlaTrack */}
                    <span className="text-xs text-white/70">
                        {formatAnimationName(animState.currentAnimation, presetName)}
                    </span>
                    {/* Progress Bar */}
                    <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 transition-all" style={{ width: `${animState.progress * 100}%` }} />
                    </div>
                </div>
            )}

            {/* No Animations Hint */}
            {!loading && !error && animState.animationNames.length === 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white/50">
                    No embedded animations • Drag to rotate
                </div>
            )}
        </div>
    );
}

// Preload GLTF loader
useGLTF.preload("");
