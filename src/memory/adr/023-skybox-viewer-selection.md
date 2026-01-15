# ADR-023: Skybox Viewer Technology Selection

**Status:** Accepted
**Date:** 2026-01-14
**Deciders:** Development Team

---

## Context

We needed to implement a 360° spherical skybox viewer for the generated equirectangular images in the 3D Asset Generation workflow. The viewer needs to:
1.  Project 2:1 equirectangular images onto a sphere.
2.  Allow interactive orbit controls (drag to rotate, scroll to zoom).
3.  Handle seam visualization (optional).
4.  Be lightweight and compatible with the existing Next.js/React/Three.js stack.

We encountered significant issues with standard R3F `OrbitControls` where interaction was blocked or inconsistent when inside a sphere geometry.

---

## Decision

We chose to use **Babylon.js (`@babylonjs/core`)** via its `PhotoDome` component for the skybox viewer implementation.

Although our stack is primarily React Three Fiber, Babylon.js offered a robust, "it just works" solution for 360 viewing without the specific interaction bugs we faced with Three.js orbit controls in this specific context (inverted controls inside spheres).

---

## Consequences

### Positive

*   **Robust Interaction:** Babylon.js provided immediate, correct touch and mouse interaction for 360 navigation without complex configuration.
*   **Correct Projection:** The `PhotoDome` component handles equirectangular projection automatically.
*   **Auto-Rotation:** Built-in support for auto-rotation and damping.
*   **No React Conflict:** Runs in its own Canvas context, independent of R3F, avoiding context conflicts.

### Negative

*   **Bundle Size:** Adds another 3D library (`@babylonjs/core`) to the bundle, which is relatively heavy alongside `three`.
*   **Consistency:** Introduces a second 3D engine paradigm into the codebase (Three.js vs Babylon.js).

### Neutral / Trade-offs

*   **Isolation:** The viewer is an isolated component (`SimpleSkyboxViewer.tsx`), so the implementation detail doesn't leak into the rest of the application. If we fix the R3F controls later, we can swap this component out.

---

## Alternatives Considered

### Alternative 1: React Three Fiber (Three.js) + OrbitControls
*   **Pros:** Native to our stack, no extra dependencies.
*   **Cons:** We faced persistent issues where `OrbitControls` would not orbit *around* the camera when the camera was *inside* the sphere (reversed controls, gimbal lock issues). We couldn't get the "Google Street View" style interaction working smoothly in the timebox.
*   **Why rejected:** High friction in implementation; time constraints.

### Alternative 2: Pannellum (`pannellum-react`)
*   **Pros:** Specialized library for panoramas, very lightweight.
*   **Cons:** The library is older, relies on `window` globals, had TypeScript declaration issues (`@types/pannellum`), and threw errors during dynamic imports in Next.js/Turbopack.
*   **Why rejected:** Integration fragility and legacy API design.

### Alternative 3: Photo Sphere Viewer (`@photo-sphere-viewer/core`)
*   **Pros:** Modern, feature-rich.
*   **Cons:** Initial integration attempts failed with projection errors.
*   **Why rejected:** Babylon.js worked immediately on first try.

---

## Implementation Notes

*   Used `SimpleSkyboxViewer.tsx` as a wrapper.
*   Implemented manual cleanup in `useEffect` to dispose of the Babylon engine to prevent memory leaks.
