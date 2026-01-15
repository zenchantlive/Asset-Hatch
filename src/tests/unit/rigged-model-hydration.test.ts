import { describe, it, expect, mock, beforeEach } from "bun:test";
import { parse3DPlan } from "@/lib/3d-plan-parser";

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

    it("should correctly parse a 3D plan with [RIG] tags", () => {
        const markdown = `
## Characters
- [RIG] Knight Character
  - Description: Armored knight in T-pose
  - Animations: idle, walk, run
`;
        const assets = parse3DPlan(markdown, { projectId: 'proj-1' });
        
        expect(assets.length).toBe(1);
        expect(assets[0].name).toBe("Knight Character");
        expect(assets[0].shouldRig).toBe(true);
        expect(assets[0].animationsRequested).toContain("preset:idle");
        expect(assets[0].animationsRequested).toContain("preset:walk");
        expect(assets[0].animationsRequested).toContain("preset:run");
    });
});

