// =============================================================================
// CSS Module Declaration
// =============================================================================
// This file tells TypeScript how to handle CSS imports in .tsx/.ts files.
// Without this, TypeScript throws "Cannot find module" errors for CSS imports.
// =============================================================================

declare module "*.css" {
    // CSS modules export an object with class names as keys
    const content: { [className: string]: string };
    export default content;
}

// Side-effect CSS imports (like globals.css) don't export anything
declare module "*.css" {
    const content: Record<string, string>;
    export default content;
}

// =============================================================================
// React Three Fiber Type Declarations
// =============================================================================
// Add support for R3F JSX elements like <primitive>, <suspense>, etc.
// =============================================================================

import { Object3DNode, BufferGeometryNode } from "@react-three/fiber";
import * as THREE from "three";

// Note: R3F event handlers (onClick using ThreeEvent) are already properly typed
// within the Canvas context. We do NOT override React.HTMLAttributes here as
// that would break normal React button/div onClick handlers throughout the app.

declare global {
    namespace JSX {
        interface IntrinsicElements {
            // R3F core elements
            primitive: Object3DNode<object, object>;
            primitive_legacy: Object3DNode<object, object>;
            instancedMesh: Object3DNode<THREE.InstancedMesh, typeof THREE.InstancedMesh>;

            // R3F helpers
            stage: {
                intensity?: number;
                environment?: string | false;
                adjustCamera?: boolean;
                shadows?: boolean;
                children?: React.ReactNode;
            };

            // Three.js core elements (extends intrinsic elements)
            mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
            group: Object3DNode<THREE.Group, typeof THREE.Group>;
            sprite: Object3DNode<THREE.Sprite, typeof THREE.Sprite>;
            points: Object3DNode<THREE.Points, typeof THREE.Points>;
            line: Object3DNode<THREE.Line, typeof THREE.Line>;
            lineSegments: Object3DNode<THREE.LineSegments, typeof THREE.LineSegments>;
            LOD: Object3DNode<THREE.LOD, typeof THREE.LOD>;

            // Geometry elements
            bufferGeometry: BufferGeometryNode<THREE.BufferGeometry, typeof THREE.BufferGeometry>;
            boxGeometry: Object3DNode<THREE.BoxGeometry, typeof THREE.BoxGeometry>;
            sphereGeometry: Object3DNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>;
            planeGeometry: Object3DNode<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>;
            circleGeometry: Object3DNode<THREE.CircleGeometry, typeof THREE.CircleGeometry>;
            coneGeometry: Object3DNode<THREE.ConeGeometry, typeof THREE.ConeGeometry>;
            cylinderGeometry: Object3DNode<THREE.CylinderGeometry, typeof THREE.CylinderGeometry>;
            torusGeometry: Object3DNode<THREE.TorusGeometry, typeof THREE.TorusGeometry>;
            torusKnotGeometry: Object3DNode<THREE.TorusKnotGeometry, typeof THREE.TorusKnotGeometry>;
            icosahedronGeometry: Object3DNode<THREE.IcosahedronGeometry, typeof THREE.IcosahedronGeometry>;
            octahedronGeometry: Object3DNode<THREE.OctahedronGeometry, typeof THREE.OctahedronGeometry>;
            dodecahedronGeometry: Object3DNode<THREE.DodecahedronGeometry, typeof THREE.DodecahedronGeometry>;

            // Material elements
            meshBasicMaterial: Object3DNode<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>;
            meshStandardMaterial: Object3DNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>;
            meshPhongMaterial: Object3DNode<THREE.MeshPhongMaterial, typeof THREE.MeshPhongMaterial>;
            meshLambertMaterial: Object3DNode<THREE.MeshLambertMaterial, typeof THREE.MeshLambertMaterial>;
            meshToonMaterial: Object3DNode<THREE.MeshToonMaterial, typeof THREE.MeshToonMaterial>;
            meshNormalMaterial: Object3DNode<THREE.MeshNormalMaterial, typeof THREE.MeshNormalMaterial>;
            meshPhysicalMaterial: Object3DNode<THREE.MeshPhysicalMaterial, typeof THREE.MeshPhysicalMaterial>;
            shadowMaterial: Object3DNode<THREE.ShadowMaterial, typeof THREE.ShadowMaterial>;
            spriteMaterial: Object3DNode<THREE.SpriteMaterial, typeof THREE.SpriteMaterial>;
            pointsMaterial: Object3DNode<THREE.PointsMaterial, typeof THREE.PointsMaterial>;

            // Light elements
            ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
            directionalLight: Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>;
            pointLight: Object3DNode<THREE.PointLight, typeof THREE.PointLight>;
            spotLight: Object3DNode<THREE.SpotLight, typeof THREE.SpotLight>;
            rectAreaLight: Object3DNode<THREE.RectAreaLight, typeof THREE.RectAreaLight>;
            hemisphereLight: Object3DNode<THREE.HemisphereLight, typeof THREE.HemisphereLight>;

            // Camera elements
            perspectiveCamera: Object3DNode<THREE.PerspectiveCamera, typeof THREE.PerspectiveCamera>;
            orthographicCamera: Object3DNode<THREE.OrthographicCamera, typeof THREE.OrthographicCamera>;

            // Additional elements
            arrowHelper: Object3DNode<THREE.ArrowHelper, typeof THREE.ArrowHelper>;
            axesHelper: Object3DNode<THREE.AxesHelper, typeof THREE.AxesHelper>;
            gridHelper: Object3DNode<THREE.GridHelper, typeof THREE.GridHelper>;
            polarGridHelper: Object3DNode<THREE.PolarGridHelper, typeof THREE.PolarGridHelper>;
        }
    }
}
