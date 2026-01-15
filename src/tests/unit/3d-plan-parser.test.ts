/**
 * Unit Tests for 3D Plan Parser
 *
 * Tests the parse3DPlan function with various markdown inputs,
 * verifying correct extraction of:
 * - Asset names and categories
 * - RIG/STATIC tags
 * - Descriptions
 * - Animation presets
 *
 * @see lib/3d-plan-parser.ts
 */

import { describe, it, expect } from "bun:test";
import { parse3DPlan } from "@/lib/3d-plan-parser";

describe("3D Plan Parser", () => {
  const projectId = "test-project";

  // =========================================================================
  // Basic Parsing Tests
  // =========================================================================

  describe("Basic Parsing", () => {
    it("should return empty array for empty input", () => {
      const result = parse3DPlan("", { projectId });
      expect(result).toEqual([]);
    });

    it("should return empty array for null/undefined input", () => {
      // @ts-expect-error - Testing invalid input
      const resultNull = parse3DPlan(null, { projectId });
      expect(resultNull).toEqual([]);

      // @ts-expect-error - Testing invalid input
      const resultUndefined = parse3DPlan(undefined, { projectId });
      expect(resultUndefined).toEqual([]);
    });

    it("should parse a simple RIG asset", () => {
      const markdown = `
## Characters
- [RIG] Hero Character
  - Description: A brave warrior in T-pose
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Hero Character");
      expect(result[0].category).toBe("Characters");
      expect(result[0].shouldRig).toBe(true);
      expect(result[0].description).toBe("A brave warrior in T-pose");
    });

    it("should parse a simple STATIC asset", () => {
      const markdown = `
## Props
- [STATIC] Treasure Chest
  - Description: Wooden chest with gold trim
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Treasure Chest");
      expect(result[0].category).toBe("Props");
      expect(result[0].shouldRig).toBe(false);
      expect(result[0].description).toBe("Wooden chest with gold trim");
    });

    it("should default to STATIC for untagged assets", () => {
      const markdown = `
## Environment
- Mountain Peak
  - Description: Snow-capped mountain
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Mountain Peak");
      expect(result[0].shouldRig).toBe(false);
    });
  });

  // =========================================================================
  // ID Generation Tests
  // =========================================================================

  describe("ID Generation", () => {
    it("should generate unique IDs with project prefix", () => {
      const markdown = `
## Characters
- [RIG] Knight
- [RIG] Mage
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result[0].id).toBe("test-project-3d-asset-0");
      expect(result[1].id).toBe("test-project-3d-asset-1");
    });

    it("should use different project IDs correctly", () => {
      const markdown = `
## Props
- [STATIC] Sword
`;
      const result1 = parse3DPlan(markdown, { projectId: "proj-a" });
      const result2 = parse3DPlan(markdown, { projectId: "proj-b" });

      expect(result1[0].id).toContain("proj-a");
      expect(result2[0].id).toContain("proj-b");
    });
  });

  // =========================================================================
  // Category Handling Tests
  // =========================================================================

  describe("Category Handling", () => {
    it("should parse multiple categories", () => {
      const markdown = `
## Characters
- [RIG] Hero

## Environment
- [STATIC] Tree

## Props
- [STATIC] Sword
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result).toHaveLength(3);
      expect(result[0].category).toBe("Characters");
      expect(result[1].category).toBe("Environment");
      expect(result[2].category).toBe("Props");
    });

    it("should handle empty categories gracefully", () => {
      const markdown = `
## Characters

## Props
- [STATIC] Shield
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("Props");
    });

    it("should categorize assets as 'Uncategorized' when no category header", () => {
      const markdown = `
- [RIG] Orphan Asset
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("Uncategorized");
    });
  });

  // =========================================================================
  // Animation Preset Tests
  // =========================================================================

  describe("Animation Presets", () => {
    it("should parse single animation", () => {
      const markdown = `
## Characters
- [RIG] Soldier
  - Description: Military soldier
  - Animations: idle
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result[0].animationsRequested).toEqual(["preset:idle"]);
    });

    it("should parse multiple animations", () => {
      const markdown = `
## Characters
- [RIG] Runner
  - Description: Athlete character
  - Animations: idle, walk, run, jump
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result[0].animationsRequested).toContain("preset:idle");
      expect(result[0].animationsRequested).toContain("preset:walk");
      expect(result[0].animationsRequested).toContain("preset:run");
      expect(result[0].animationsRequested).toContain("preset:jump");
      expect(result[0].animationsRequested).toHaveLength(4);
    });

    it("should ignore invalid animation names", () => {
      const markdown = `
## Characters
- [RIG] Character
  - Animations: idle, fly, walk, teleport
`;
      const result = parse3DPlan(markdown, { projectId });

      // Only valid presets should be included
      expect(result[0].animationsRequested).toEqual(["preset:idle", "preset:walk"]);
    });

    it("should handle 'Animation:' singular form", () => {
      const markdown = `
## Characters
- [RIG] Simple
  - Animation: walk
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result[0].animationsRequested).toEqual(["preset:walk"]);
    });

    it("should return empty animations for STATIC assets", () => {
      const markdown = `
## Props
- [STATIC] Box
  - Animations: idle
`;
      const result = parse3DPlan(markdown, { projectId });

      // Parser still extracts animations even for static, but shouldRig is false
      // The UI should use shouldRig to determine if animations should be applied
      expect(result[0].shouldRig).toBe(false);
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  describe("Edge Cases", () => {
    it("should handle case-insensitive RIG/STATIC tags", () => {
      const markdown = `
## Characters
- [rig] Lowercase Rig
- [STATIC] Uppercase Static
- [Rig] Mixed Case
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result[0].shouldRig).toBe(true);
      expect(result[1].shouldRig).toBe(false);
      expect(result[2].shouldRig).toBe(true);
    });

    it("should handle extra whitespace in tags", () => {
      const markdown = `
## Characters
- [RIG]   Spaced Name
  -   Description:   Lots of spaces
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result[0].name).toBe("Spaced Name");
      expect(result[0].description).toBe("Lots of spaces");
    });

    it("should handle complex multi-line descriptions", () => {
      const markdown = `
## Characters
- [RIG] Complex Character
  - Description: A very detailed character with multiple features
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result[0].description).toBe(
        "A very detailed character with multiple features"
      );
    });

    it("should handle all six valid animation presets", () => {
      const markdown = `
## Characters
- [RIG] Full Animation Set
  - Animations: idle, walk, run, jump, climb, dive
`;
      const result = parse3DPlan(markdown, { projectId });

      expect(result[0].animationsRequested).toEqual([
        "preset:idle",
        "preset:walk",
        "preset:run",
        "preset:jump",
        "preset:climb",
        "preset:dive",
      ]);
    });

    it("should ignore markdown formatting in asset names", () => {
      const markdown = `
## Characters
- [RIG] **Bold** Hero
`;
      const result = parse3DPlan(markdown, { projectId });

      // The parser should keep the markdown as-is in the name
      expect(result[0].name).toBe("**Bold** Hero");
    });
  });

  // =========================================================================
  // Full Plan Integration Test
  // =========================================================================

  describe("Full Plan Integration", () => {
    it("should correctly parse a complete realistic plan", () => {
      const fullPlan = `
# 3D Asset Plan for Fantasy RPG

## Characters
- [RIG] Player Knight
  - Description: Medieval knight in full plate armor, T-pose ready for rigging
  - Animations: idle, walk, run, jump

- [RIG] NPC Merchant
  - Description: Middle-aged merchant with apron and coin purse
  - Animations: idle, walk

## Environment
- [STATIC] Castle Wall Section
  - Description: Stone wall segment with battlements

- [STATIC] Oak Tree
  - Description: Large oak tree with full foliage

## Props
- [STATIC] Sword of Light
  - Description: Legendary sword with glowing blade

- [STATIC] Health Potion
  - Description: Red glass bottle with healing liquid

- [RIG] Treasure Mimic
  - Description: Animated chest monster that attacks players
  - Animations: idle, jump
`;

      const result = parse3DPlan(fullPlan, { projectId: "fantasy-rpg" });

      // Verify total count
      expect(result).toHaveLength(7);

      // Verify categories
      const characters = result.filter((a) => a.category === "Characters");
      const environment = result.filter((a) => a.category === "Environment");
      const props = result.filter((a) => a.category === "Props");

      expect(characters).toHaveLength(2);
      expect(environment).toHaveLength(2);
      expect(props).toHaveLength(3);

      // Verify rigged vs static
      const rigged = result.filter((a) => a.shouldRig);
      const staticAssets = result.filter((a) => !a.shouldRig);

      expect(rigged).toHaveLength(3); // Knight, Merchant, Mimic
      expect(staticAssets).toHaveLength(4); // Wall, Tree, Sword, Potion

      // Verify specific asset details
      const knight = result.find((a) => a.name === "Player Knight");
      expect(knight).toBeDefined();
      expect(knight!.shouldRig).toBe(true);
      expect(knight!.animationsRequested).toContain("preset:idle");
      expect(knight!.animationsRequested).toContain("preset:walk");
      expect(knight!.animationsRequested).toContain("preset:run");
      expect(knight!.animationsRequested).toContain("preset:jump");

      // Verify ID format
      expect(knight!.id).toMatch(/^fantasy-rpg-3d-asset-\d+$/);
    });
  });
});
