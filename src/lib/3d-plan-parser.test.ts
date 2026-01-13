/**
 * Unit tests for 3D Plan Parser
 *
 * Tests the parse3DPlan function for:
 * - [RIG] tag extraction
 * - [STATIC] tag extraction
 * - Animation preset extraction
 * - Multiple assets in one plan
 * - Edge cases (empty input, malformed markdown)
 *
 * @see lib/3d-plan-parser.ts
 */

import { describe, test, expect } from 'bun:test';
import { parse3DPlan } from './3d-plan-parser';

describe('parse3DPlan', () => {
    const projectId = 'test-project';

    // =========================================================================
    // [RIG] Tag Tests
    // =========================================================================

    describe('[RIG] tag parsing', () => {
        test('parses [RIG] tagged character as riggable', () => {
            const markdown = `
## Characters
- [RIG] Knight Character
  - Description: Armored knight in T-pose
  - Animations: idle, walk, run
            `;
            const assets = parse3DPlan(markdown, { projectId });

            expect(assets.length).toBe(1);
            expect(assets[0].name).toBe('Knight Character');
            expect(assets[0].category).toBe('Characters');
            expect(assets[0].shouldRig).toBe(true);
            expect(assets[0].description).toBe('Armored knight in T-pose');
        });

        test('extracts animations from [RIG] asset', () => {
            const markdown = `
## Characters
- [RIG] Hero
  - Animations: idle, walk, run
            `;
            const assets = parse3DPlan(markdown, { projectId });

            expect(assets[0].animationsRequested).toContain('preset:idle');
            expect(assets[0].animationsRequested).toContain('preset:walk');
            expect(assets[0].animationsRequested).toContain('preset:run');
            expect(assets[0].animationsRequested.length).toBe(3);
        });

        test('handles case-insensitive [RIG] tag', () => {
            const markdown = `
## Characters
- [rig] Lowercase Hero
            `;
            const assets = parse3DPlan(markdown, { projectId });

            expect(assets[0].shouldRig).toBe(true);
            expect(assets[0].name).toBe('Lowercase Hero');
        });
    });

    // =========================================================================
    // [STATIC] Tag Tests
    // =========================================================================

    describe('[STATIC] tag parsing', () => {
        test('parses [STATIC] tagged prop as non-riggable', () => {
            const markdown = `
## Props
- [STATIC] Treasure Chest
  - Description: Wooden chest with gold trim
            `;
            const assets = parse3DPlan(markdown, { projectId });

            expect(assets.length).toBe(1);
            expect(assets[0].name).toBe('Treasure Chest');
            expect(assets[0].shouldRig).toBe(false);
            expect(assets[0].animationsRequested).toEqual([]);
        });

        test('handles case-insensitive [STATIC] tag', () => {
            const markdown = `
## Props
- [static] Rock Formation
            `;
            const assets = parse3DPlan(markdown, { projectId });

            expect(assets[0].shouldRig).toBe(false);
            expect(assets[0].name).toBe('Rock Formation');
        });
    });

    // =========================================================================
    // Animation Extraction Tests
    // =========================================================================

    describe('animation extraction', () => {
        test('parses all valid animation presets', () => {
            const markdown = `
## Characters
- [RIG] Athlete
  - Animations: idle, walk, run, jump, climb, dive
            `;
            const assets = parse3DPlan(markdown, { projectId });

            expect(assets[0].animationsRequested).toEqual([
                'preset:idle',
                'preset:walk',
                'preset:run',
                'preset:jump',
                'preset:climb',
                'preset:dive',
            ]);
        });

        test('ignores invalid animation names', () => {
            const markdown = `
## Characters
- [RIG] Character
  - Animations: idle, invalid, walk, custom
            `;
            const assets = parse3DPlan(markdown, { projectId });

            expect(assets[0].animationsRequested).toEqual([
                'preset:idle',
                'preset:walk',
            ]);
        });

        test('handles singular "Animation:" prefix', () => {
            const markdown = `
## Characters
- [RIG] Solo Dancer
  - Animation: idle
            `;
            const assets = parse3DPlan(markdown, { projectId });

            expect(assets[0].animationsRequested).toContain('preset:idle');
        });
    });

    // =========================================================================
    // Multiple Assets Tests
    // =========================================================================

    describe('multiple assets', () => {
        test('parses multiple assets from different categories', () => {
            const markdown = `
## Characters
- [RIG] Knight
  - Description: Armored warrior
  - Animations: idle, walk

## Props
- [STATIC] Sword
  - Description: Steel longsword

## Environment
- [STATIC] Tree
  - Description: Oak tree
            `;
            const assets = parse3DPlan(markdown, { projectId });

            expect(assets.length).toBe(3);

            // Knight
            expect(assets[0].name).toBe('Knight');
            expect(assets[0].category).toBe('Characters');
            expect(assets[0].shouldRig).toBe(true);

            // Sword
            expect(assets[1].name).toBe('Sword');
            expect(assets[1].category).toBe('Props');
            expect(assets[1].shouldRig).toBe(false);

            // Tree
            expect(assets[2].name).toBe('Tree');
            expect(assets[2].category).toBe('Environment');
            expect(assets[2].shouldRig).toBe(false);
        });

        test('generates unique IDs for each asset', () => {
            const markdown = `
## Characters
- [RIG] Hero
- [RIG] Villain
            `;
            const assets = parse3DPlan(markdown, { projectId });

            expect(assets[0].id).toBe('test-project-3d-asset-0');
            expect(assets[1].id).toBe('test-project-3d-asset-1');
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('edge cases', () => {
        test('returns empty array for empty input', () => {
            expect(parse3DPlan('', { projectId })).toEqual([]);
        });

        test('returns empty array for undefined input', () => {
            expect(parse3DPlan(undefined as unknown as string, { projectId })).toEqual([]);
        });

        test('returns empty array for null input', () => {
            expect(parse3DPlan(null as unknown as string, { projectId })).toEqual([]);
        });

        test('handles asset without any tag (defaults to static)', () => {
            const markdown = `
## Props
- Untagged Item
            `;
            const assets = parse3DPlan(markdown, { projectId });

            expect(assets[0].shouldRig).toBe(false);
            expect(assets[0].name).toBe('Untagged Item');
        });

        test('handles asset without description', () => {
            const markdown = `
## Props
- [STATIC] Barrel
            `;
            const assets = parse3DPlan(markdown, { projectId });

            expect(assets[0].description).toBe('');
        });

        test('handles malformed markdown without categories', () => {
            const markdown = `
- [RIG] Orphan Asset
            `;
            const assets = parse3DPlan(markdown, { projectId });

            expect(assets.length).toBe(1);
            expect(assets[0].category).toBe('Uncategorized');
        });
    });
});
