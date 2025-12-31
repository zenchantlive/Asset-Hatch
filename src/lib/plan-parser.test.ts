import { describe, test, expect } from 'bun:test';
import { parsePlan } from './plan-parser';

describe('parsePlan', () => {
    const projectId = 'test-project';

    test('parses a basic plan with categories, assets, and variants', () => {
        const markdown = `
# Asset Plan
## Characters
- Farmer
  - Idle (4-direction)
  - Walking (4-direction)
## Environments
- Grass Tileset
- Sky Background
    `;

        const assets = parsePlan(markdown, { mode: 'composite', projectId });

        expect(assets.length).toBe(4);

        // Check Farmer Idle
        expect(assets[0].name).toBe('Farmer');
        expect(assets[0].category).toBe('Characters');
        expect(assets[0].variant.name).toBe('Idle');
        expect(assets[0].variant.frameCount).toBe(4);

        // Check Farmer Walking
        expect(assets[1].name).toBe('Farmer');
        expect(assets[1].variant.name).toBe('Walking');

        // Check Grass Tileset
        expect(assets[2].name).toBe('Grass Tileset');
        expect(assets[2].category).toBe('Environments');
        expect(assets[2].type).toBe('tileset');

        // Check Sky Background
        expect(assets[3].name).toBe('Sky Background');
        expect(assets[3].type).toBe('background');
    });

    test('handles granular mode for multi-direction animations', () => {
        const markdown = `
## Characters
- Warrior
  - Attack (4-direction)
    `;

        const assets = parsePlan(markdown, { mode: 'granular', projectId });

        // 4 directions = 4 assets in granular mode
        expect(assets.length).toBe(4);
        expect(assets[0].variant.direction).toBe('front');
        expect(assets[1].variant.direction).toBe('left');
        expect(assets[2].variant.direction).toBe('right');
        expect(assets[3].variant.direction).toBe('back');
    });

    test('handles composite mode for multi-direction animations', () => {
        const markdown = `
## Characters
- Warrior
  - Attack (4-direction)
    `;

        const assets = parsePlan(markdown, { mode: 'composite', projectId });

        // 1 sprite sheet in composite mode
        expect(assets.length).toBe(1);
        expect(assets[0].type).toBe('sprite-sheet');
        expect(assets[0].variant.frameCount).toBe(4);
    });

    test('handles assets without variants', () => {
        const markdown = `
## Items
- Health Potion
- Wooden Sword
    `;

        const assets = parsePlan(markdown, { mode: 'composite', projectId });

        expect(assets.length).toBe(2);
        expect(assets[0].name).toBe('Health Potion');
        expect(assets[1].name).toBe('Wooden Sword');
        expect(assets[0].type).toBe('icon');
    });

    test('correctly determines asset types', () => {
        const markdown = `
## Characters
- Guard
## Environment
- Stone Wall
## UI
- Start Button
## Items
- Gold Coin
    `;

        const assets = parsePlan(markdown, { mode: 'composite', projectId });

        expect(assets.find(a => a.name === 'Guard')?.type).toBe('character-sprite');
        expect(assets.find(a => a.name === 'Stone Wall')?.type).toBe('tileset');
        expect(assets.find(a => a.name === 'Start Button')?.type).toBe('ui-element');
        expect(assets.find(a => a.name === 'Gold Coin')?.type).toBe('icon');
    });

    test('parses frame counts correctly', () => {
        const markdown = `
## Characters
- Slime
  - Jump (8-frame)
    `;

        const assets = parsePlan(markdown, { mode: 'composite', projectId });
        expect(assets[0].variant.frameCount).toBe(8);
    });

    test('handles empty or malformed input', () => {
        expect(parsePlan('', { mode: 'composite', projectId })).toEqual([]);
        expect(parsePlan('# Title Only', { mode: 'composite', projectId })).toEqual([]);
        expect(parsePlan('Just some text', { mode: 'composite', projectId })).toEqual([]);
    });
});
