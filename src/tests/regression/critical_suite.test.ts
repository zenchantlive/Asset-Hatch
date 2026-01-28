import { describe, test, expect } from 'bun:test'
import { parsePlan } from '../../lib/plan-parser'
import { getDefaultModel, getModelById } from '../../lib/model-registry'
import { formatCostDisplay } from '../../lib/cost-tracker'

/**
 * CRITICAL REGRESSION SUITE
 * 
 * This file contains high-level, deterministic tests for core user flows.
 * It ensures that the most fundamental functions of Asset-Hatch remain functional.
 */

describe('Core User Flow: Asset Plan Parsing (CRITICAL)', () => {
    test('successfully parses a standard asset plan markdown', () => {
        const markdown = `
# Game Assets
## Characters
- Hero
  - Idle (4-direction)
  - Walk (4-direction)
## Environment
- Forest Background
- Stone Tileset
## UI
- Health Bar
    `
        const assets = parsePlan(markdown, { mode: 'composite', projectId: 'reg-test-1' })

        expect(assets).toBeDefined()
        expect(assets.length).toBe(5)

        // Core Invariants
        expect(assets.find(a => a.name === 'Hero')).toBeDefined()
        expect(assets.find(a => a.name === 'Forest Background')?.type).toBe('background')
        expect(assets.find(a => a.name === 'Health Bar')?.type).toBe('ui-element')
    })

    test('successfully handles mobility tags in plans', () => {
        const markdown = `
## Heroes (Playable)
- [MOVEABLE:4] Holy Cow
- [MOVEABLE:4] Chicken Rogue
    `
        const assets = parsePlan(markdown, { mode: 'composite', projectId: 'reg-test-2' })

        expect(assets.length).toBe(2)
        expect(assets[0].mobility.type).toBe('moveable')
        expect(assets[1].mobility.directions).toBe(4)
    })
})

describe('Core User Flow: Model Registry (CRITICAL)', () => {
    test('resolves default models for all categories', () => {
        const chatDefault = getDefaultModel('chat');
        const multimodalDefault = getDefaultModel('multimodal');
        const imageGenDefault = getDefaultModel('image-gen');

        expect(chatDefault).toBeDefined();
        expect(multimodalDefault).toBeDefined();
        expect(imageGenDefault).toBeDefined();

        expect(chatDefault.category).toBe('chat');
        expect(multimodalDefault.category).toBe('multimodal');
    });

    test('retrieves known curated models by ID', () => {
        const gemini = getModelById('google/gemini-2.5-flash-image');
        expect(gemini).toBeDefined();
        expect(gemini?.displayName).toContain('Gemini');
    });
});

describe('Core User Flow: Cost Tracker (CRITICAL)', () => {
    test('formats cost display consistently', () => {
        expect(formatCostDisplay(0.01)).toBe('$0.0100');
        expect(formatCostDisplay(0.01, { isEstimate: true })).toBe('~$0.0100');
        expect(formatCostDisplay(1.50)).toBe('$1.50');
    });
});
