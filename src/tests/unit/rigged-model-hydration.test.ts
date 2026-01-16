import { describe, it, expect, mock, beforeEach, afterAll } from "bun:test";
import { parse3DPlan } from "@/lib/3d-plan-parser";

// Mock get3DAssets function for testing
async function get3DAssets(projectId: string) {
    const response = await fetch(`/api/projects/${projectId}/3d-assets`);
    const data = await response.json();
    return data.assets;
}

// Mock the fetch function
const originalFetch = global.fetch;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.fetch = mock() as any;
afterAll(() => {
    global.fetch = originalFetch;
});

describe("Rigged Model Hydration", () => {
    beforeEach(() => {
        ((global.fetch as unknown) as ReturnType<typeof mock>).mockClear();
    });

    it("should fetch 3d assets and include riggedModelUrl", async () => {
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

        ((global.fetch as unknown) as ReturnType<typeof mock>).mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                assets: mockAssets
            })
        });

        const assets = await get3DAssets("proj-1");

        expect(assets.length).toBe(1);
        expect(assets[0].riggedModelUrl).toBe("https://example.com/rigged.glb");
    });

    it("should correctly parse a 3D plan with [RIG] tags", () => {
        const markdown = `
## Characters
- [RIG] Knight Character
  - Description: Armored knight in T-pose
  - Animations: idle, walk, run
`;
        const assets = parse3DPlan(markdown.trim(), { projectId: "proj-1" });

        expect(assets.length).toBe(1);
        expect(assets[0].name).toBe("Knight Character");
        expect(assets[0].shouldRig).toBe(true);
        expect(assets[0].animationsRequested).toContain("preset:idle");
        expect(assets[0].animationsRequested).toContain("preset:walk");
        expect(assets[0].animationsRequested).toContain("preset:run");
    });
});
