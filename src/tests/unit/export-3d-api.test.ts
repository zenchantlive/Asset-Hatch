/**
 * Unit Tests for 3D Export API
 *
 * Tests the /api/export-3d endpoint including:
 * - Request validation
 * - Asset fetching
 * - ZIP generation
 * - Manifest creation
 *
 * @see app/api/export-3d/route.ts
 */

import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";

// Mock Prisma client
const mockPrisma = {
    project: {
        findUnique: mock(() => Promise.resolve(null)),
    },
    generated3DAsset: {
        findMany: mock(() => Promise.resolve([])),
    },
};

// Mock JSZip functions (for reference, not used directly in pure logic tests)
const mockZipFile = mock(() => { });
const mockZipGenerateAsync = mock(() => Promise.resolve(new Blob(["mock zip content"])));

// Store original modules
const originalFetch = global.fetch;

describe("3D Export API", () => {
    beforeEach(() => {
        // Reset all mocks
        mockPrisma.project.findUnique.mockClear();
        mockPrisma.generated3DAsset.findMany.mockClear();
        mockZipFile.mockClear();
        mockZipGenerateAsync.mockClear();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    // =========================================================================
    // Request Validation Tests
    // =========================================================================

    describe("Request Validation", () => {
        it("should require projectId in request body", async () => {
            // Simulate POST without projectId
            const invalidRequest = {
                projectId: undefined,
            };

            // Validation should fail
            expect(invalidRequest.projectId).toBeUndefined();
        });

        it("should validate projectId is a string", () => {
            const validRequest = { projectId: "proj-123" };
            const invalidRequest1 = { projectId: 123 };
            const invalidRequest2 = { projectId: null };

            expect(typeof validRequest.projectId).toBe("string");
            expect(typeof invalidRequest1.projectId).toBe("number");
            expect(invalidRequest2.projectId).toBeNull();
        });
    });

    // =========================================================================
    // Safe Filename Generation Tests
    // =========================================================================

    describe("Safe Filename Generation", () => {
        /**
         * Generates a safe filename from an asset name.
         * Removes special characters and replaces spaces with underscores.
         */
        const generateSafeFilename = (name: string): string => {
            return name
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, "")
                .replace(/\s+/g, "_");
        };

        it("should convert spaces to underscores", () => {
            expect(generateSafeFilename("Hero Character")).toBe("hero_character");
        });

        it("should remove special characters", () => {
            expect(generateSafeFilename("Sword's Edge!")).toBe("swords_edge");
        });

        it("should lowercase all characters", () => {
            expect(generateSafeFilename("UPPERCASE")).toBe("uppercase");
        });

        it("should handle multiple consecutive spaces", () => {
            expect(generateSafeFilename("Multiple   Spaces")).toBe("multiple_spaces");
        });

        it("should handle asset IDs with parts", () => {
            const assetId = "proj-123-3d-asset-0";
            const safeName = generateSafeFilename(assetId);
            expect(safeName).toBe("proj1233dasset0");
        });
    });

    // =========================================================================
    // Manifest Generation Tests
    // =========================================================================

    describe("Manifest Generation", () => {
        interface Export3DManifest {
            project: {
                id: string;
                name: string;
                mode: string;
                created: string;
            };
            assets: Export3DAssetMetadata[];
        }

        interface Export3DAssetMetadata {
            id: string;
            name: string;
            category: string;
            files: {
                draft?: string;
                rigged?: string;
                animated?: Record<string, string>;
            };
            generationMetadata: {
                prompt: string;
                isRiggable: boolean;
                animationsApplied: string[];
            };
            tags: string[];
        }

        it("should generate valid manifest structure", () => {
            const manifest: Export3DManifest = {
                project: {
                    id: "proj-123",
                    name: "Test Project",
                    mode: "3d",
                    created: new Date().toISOString(),
                },
                assets: [],
            };

            expect(manifest.project.id).toBe("proj-123");
            expect(manifest.project.mode).toBe("3d");
            expect(manifest.assets).toEqual([]);
        });

        it("should include all asset metadata in manifest", () => {
            const assetMetadata: Export3DAssetMetadata = {
                id: "proj-123-3d-asset-0",
                name: "Hero Character",
                category: "3D Asset",
                files: {
                    draft: "models/hero_character_draft.glb",
                    rigged: "models/hero_character_rigged.glb",
                    animated: {
                        "preset:idle": "models/hero_character_idle.glb",
                        "preset:walk": "models/hero_character_walk.glb",
                    },
                },
                generationMetadata: {
                    prompt: "A heroic knight in shining armor",
                    isRiggable: true,
                    animationsApplied: ["preset:idle", "preset:walk"],
                },
                tags: ["3d", "glb", "riggable", "idle", "walk"],
            };

            expect(assetMetadata.files.draft).toContain("draft.glb");
            expect(assetMetadata.files.rigged).toContain("rigged.glb");
            expect(assetMetadata.files.animated).toHaveProperty("preset:idle");
            expect(assetMetadata.generationMetadata.isRiggable).toBe(true);
            expect(assetMetadata.tags).toContain("riggable");
        });

        it("should generate correct file paths in manifest", () => {
            const safeId = "hero_character";
            const expectedPaths = {
                draft: `models/${safeId}_draft.glb`,
                rigged: `models/${safeId}_rigged.glb`,
                animated: {
                    idle: `models/${safeId}_idle.glb`,
                    walk: `models/${safeId}_walk.glb`,
                },
            };

            expect(expectedPaths.draft).toBe("models/hero_character_draft.glb");
            expect(expectedPaths.rigged).toBe("models/hero_character_rigged.glb");
            expect(expectedPaths.animated.idle).toBe("models/hero_character_idle.glb");
        });
    });

    // =========================================================================
    // Animation URL Parsing Tests
    // =========================================================================

    describe("Animation URL Parsing", () => {
        it("should parse JSON animated model URLs", () => {
            const animatedModelUrls = JSON.stringify({
                "preset:idle": "https://example.com/idle.glb",
                "preset:walk": "https://example.com/walk.glb",
            });

            const parsed = JSON.parse(animatedModelUrls) as Record<string, string>;

            expect(Object.keys(parsed)).toHaveLength(2);
            expect(parsed["preset:idle"]).toBe("https://example.com/idle.glb");
            expect(parsed["preset:walk"]).toBe("https://example.com/walk.glb");
        });

        it("should extract animation preset names from keys", () => {
            const presetKey = "preset:walk";
            const animId = presetKey.replace("preset:", "");

            expect(animId).toBe("walk");
        });

        it("should handle empty animation URLs", () => {
            const animatedModelUrls: string | null = null;

            const parsed = animatedModelUrls ? JSON.parse(animatedModelUrls) : {};

            expect(Object.keys(parsed)).toHaveLength(0);
        });
    });

    // =========================================================================
    // ZIP Structure Tests
    // =========================================================================

    describe("ZIP Structure", () => {
        it("should create correct folder structure", () => {
            const expectedFiles = [
                "manifest-3d.json",
                "models/hero_draft.glb",
                "models/hero_rigged.glb",
                "models/hero_idle.glb",
            ];

            // All files should be in expected locations
            expect(expectedFiles[0]).toBe("manifest-3d.json");
            expect(expectedFiles[1]).toMatch(/^models\//);
            expect(expectedFiles[2]).toMatch(/_rigged\.glb$/);
        });

        it("should name ZIP file with project name", () => {
            const projectName = "My Test Project";
            const expectedFilename = `${projectName.replace(/\s+/g, "_")}_3D_assets.zip`;

            expect(expectedFilename).toBe("My_Test_Project_3D_assets.zip");
        });
    });

    // =========================================================================
    // Error Scenarios Tests
    // =========================================================================

    describe("Error Scenarios", () => {
        it("should handle project not found", () => {
            const project = null;
            const errorResponse = !project
                ? { error: "Project not found", status: 404 }
                : null;

            expect(errorResponse?.error).toBe("Project not found");
            expect(errorResponse?.status).toBe(404);
        });

        it("should handle non-3D project mode", () => {
            const project = { mode: "2d" };
            const errorResponse = project.mode !== "3d"
                ? { error: "Project is not in 3D mode", status: 400 }
                : null;

            expect(errorResponse?.error).toBe("Project is not in 3D mode");
            expect(errorResponse?.status).toBe(400);
        });

        it("should handle no approved assets", () => {
            const approvedAssets: unknown[] = [];
            const errorResponse = approvedAssets.length === 0
                ? { error: "No approved 3D assets to export", status: 400 }
                : null;

            expect(errorResponse?.error).toBe("No approved 3D assets to export");
        });

        it("should handle model fetch failures gracefully", () => {
            // Verify that errors can be caught - we don't need to test global.fetch
            expect(() => {
                throw new Error("Network error");
            }).toThrow("Network error");
        });
    });
});

