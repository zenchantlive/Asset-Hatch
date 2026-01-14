/**
 * Tripo3D Module Index
 * 
 * Re-exports all Tripo functions for convenient imports.
 * 
 * @example
 * import { generateMeshFromText, rigMesh } from '@/lib/tripo';
 */

// Base client exports
export {
    getTripoApiKey,
    tripoFetch,
    createTripoTask,
    getTripoTaskStatus,
    type TripoApiError,
    type TripoApiResponse,
    type TextToModelParams,
    type AnimateRigParams,
    type AnimateRetargetParams,
    type TripoTaskParams,
} from './client';

// Polling exports
export {
    pollTripoTask,
    POLLING_DEFAULTS,
    type PollOptions,
} from './polling';

// Mesh generation exports
export {
    generateMeshFromText,
    submitMeshGenerationTask,
    type TextTo3DOptions,
    type MeshGenerationResult,
} from './mesh';

// Rigging and animation exports
export {
    rigMesh,
    applyAnimation,
    submitRigTask,
    submitAnimationTask,
    type RigOptions,
    type RigResult,
    type AnimateOptions,
    type AnimateResult,
} from './rig';
