import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock the fetch function
global.fetch = mock();

describe("Rigged Model Hydration", () => {
    beforeEach(() => {
        (global.fetch as any).mockClear();
    });

    it("should verify that riggedModelUrl is present in the API response", async () => {
        const mockAssets = [
            {
                id: "asset-1",
                assetId: "asset-1",
                status: "complete",
                approvalStatus: "approved",
                draftModelUrl: "https://example.com/draft.glb",
                riggedModelUrl: "https://example.com/rigged.glb",
                animationTaskIds: {},
                animatedModelUrls: {}
            }
        ];

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                assets: mockAssets
            })
        });

        const response = await fetch("/api/projects/proj-1/3d-assets");
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.assets[0].riggedModelUrl).toBe("https://example.com/rigged.glb");
    });
});
EOF > src/tests/unit/rigged-model-hydration.test.ts
import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock the fetch function
global.fetch = mock();

describe("Rigged Model Hydration", () => {
    beforeEach(() => {
        (global.fetch as any).mockClear();
    });

    it("should verify that riggedModelUrl is present in the API response", async () => {
        const mockAssets = [
            {
                id: "asset-1",
                assetId: "asset-1",
                status: "complete",
                approvalStatus: "approved",
                draftModelUrl: "https://example.com/draft.glb",
                riggedModelUrl: "https://example.com/rigged.glb",
                animationTaskIds: {},
                animatedModelUrls: {}
            }
        ];

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                assets: mockAssets
            })
        });

        const response = await fetch("/api/projects/proj-1/3d-assets");
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.assets[0].riggedModelUrl).toBe("https://example.com/rigged.glb");
    });
});
